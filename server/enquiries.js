import { neon } from '@neondatabase/serverless';

const requiredFields = ['name', 'email', 'product', 'quantity', 'country'];
const fields = [...requiredFields, 'company', 'phone', 'timing', 'packaging', 'requirements'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let database;

export function parseEnquiry(body) {
  if (!body || typeof body !== 'object' || !uuid.test(body.submissionId ?? '')) return null;
  const details = {};
  for (const field of fields) {
    const raw = body[field] ?? '';
    if (typeof raw !== 'string') return null;
    const value = raw.trim();
    const maxLength = field === 'requirements' ? 3000 : field === 'product' ? 200 : 180;
    if (value.length > maxLength || (requiredFields.includes(field) && !value)) return null;
    if (value) details[field] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return null;
  return { submissionId: body.submissionId, details };
}

export async function getDatabase() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Enquiry database is not configured');
  if (!database) {
    const sql = neon(url);
    database = sql.transaction([
      sql`SELECT pg_advisory_xact_lock(20382615)`,
      sql`CREATE TABLE IF NOT EXISTS enquiries (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        submission_id uuid NOT NULL UNIQUE,
        details jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      sql`ALTER TABLE enquiries
        ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
          CHECK (status IN ('new', 'follow_up', 'closed')),
        ADD COLUMN IF NOT EXISTS status_changed_at timestamptz`,
    ]).then(() => sql).catch(error => {
      database = undefined;
      throw error;
    });
  }
  return database;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export async function saveEnquiry({ submissionId, details }) {
  const sql = await getDatabase();
  const [created] = await sql`
    INSERT INTO enquiries (submission_id, details)
    VALUES (${submissionId}::uuid, ${JSON.stringify(details)}::jsonb)
    ON CONFLICT (submission_id) DO NOTHING
    RETURNING id::text, created_at AS "createdAt"
  `;
  if (created) return created;
  const [existing] = await sql`
    SELECT id::text, created_at AS "createdAt" FROM enquiries
    WHERE submission_id = ${submissionId}::uuid
  `;
  return existing;
}

export async function listEnquiries({ before, status, search }) {
  const sql = await getDatabase();
  const rows = await sql`
    SELECT id::text, details, status, status_changed_at AS "statusChangedAt",
      created_at AS "createdAt" FROM enquiries
    WHERE (${before}::bigint IS NULL OR id < ${before}::bigint)
      AND (${status}::text IS NULL OR status = ${status})
      AND (${search} = '' OR id::text = ${search} OR EXISTS (
        SELECT 1 FROM jsonb_each_text(details) AS field
        WHERE strpos(lower(field.value), lower(${search})) > 0
      ))
    ORDER BY id DESC LIMIT 51
  `;
  return { enquiries: rows.slice(0, 50), next: rows.length > 50 ? rows[49].id : null };
}

export async function updateEnquiryStatus({ id, status, previousStatus }) {
  const sql = await getDatabase();
  const [updated] = await sql`
    UPDATE enquiries
    SET status = ${status}, status_changed_at = CASE WHEN status <> ${status} THEN now() ELSE status_changed_at END
    WHERE id = ${id}::bigint AND status = ${previousStatus}
    RETURNING id::text, status, status_changed_at AS "statusChangedAt"
  `;
  return updated;
}
