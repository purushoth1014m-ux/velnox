import { isShipmentStatus } from '../src/shipment-status.js';
import { isEnquiryId } from './admin-auth.js';
import { getDatabase } from './enquiries.js';

const limits = { origin: 100, destination: 100, carrier: 120, trackingNumber: 120, trackingUrl: 1500, note: 1200 };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let database;

export function parseShipment(body, editing) {
  if (!isShipmentStatus(body?.status)) return null;
  if (editing ? !isEnquiryId(body.id) || !Number.isSafeInteger(body.version) || body.version < 1
    : typeof body.submissionId !== 'string' || !uuid.test(body.submissionId)) return null;
  const details = {};
  for (const [field, limit] of Object.entries(limits)) {
    const value = body[field] ?? '';
    if (typeof value !== 'string' || value.trim().length > limit) return null;
    details[field] = value.trim();
  }
  if (!details.origin || !details.destination) return null;
  if (details.trackingUrl) {
    try {
      const url = new URL(details.trackingUrl);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      details.trackingUrl = url.href;
    } catch { return null; }
  }
  const enquiryId = body.enquiryId || null;
  if (enquiryId !== null && !isEnquiryId(enquiryId)) return null;
  return { details, enquiryId, status: body.status, id: body.id, version: body.version, submissionId: body.submissionId };
}

function shipmentDatabase() {
  if (!database) {
    database = getDatabase().then(async sql=>{
      await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(20382616)`,
        sql`CREATE TABLE IF NOT EXISTS shipments (
          id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          submission_id uuid NOT NULL UNIQUE,
          enquiry_id bigint REFERENCES enquiries(id),
          details jsonb NOT NULL,
          status text NOT NULL CHECK (status IN ('booked','in_transit','customs','delivered','exception')),
          version integer NOT NULL DEFAULT 1,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`,
      ]);
      return sql;
    }).catch(error=>{
      database = undefined;
      throw error;
    });
  }
  return database;
}

export async function listShipments({ before, status }) {
  const sql = await shipmentDatabase();
  const rows = await sql`
    SELECT id::text, enquiry_id::text AS "enquiryId", details, status, version, updated_at AS "updatedAt"
    FROM shipments
    WHERE (${before}::bigint IS NULL OR id < ${before}::bigint)
      AND (${status}::text IS NULL OR status = ${status})
    ORDER BY id DESC LIMIT 51
  `;
  return { shipments: rows.slice(0,50), next: rows.length > 50 ? rows[49].id : null };
}

export async function createShipment({ submissionId, enquiryId, details, status }) {
  const sql = await shipmentDatabase();
  const [created] = await sql`
    INSERT INTO shipments (submission_id, enquiry_id, details, status)
    VALUES (${submissionId}::uuid, ${enquiryId}::bigint, ${JSON.stringify(details)}::jsonb, ${status})
    ON CONFLICT (submission_id) DO NOTHING
    RETURNING id::text
  `;
  if (created) return created;
  const [existing] = await sql`SELECT id::text FROM shipments WHERE submission_id = ${submissionId}::uuid`;
  return existing;
}

export async function updateShipment({ id, version, enquiryId, details, status }) {
  const sql = await shipmentDatabase();
  const [updated] = await sql`
    UPDATE shipments SET enquiry_id = ${enquiryId}::bigint, details = ${JSON.stringify(details)}::jsonb,
      status = ${status}, version = version + 1, updated_at = now()
    WHERE id = ${id}::bigint AND version = ${version}
    RETURNING id::text
  `;
  return updated;
}
