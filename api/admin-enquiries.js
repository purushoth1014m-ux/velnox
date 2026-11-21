import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { hasDatabase, listEnquiries, updateEnquiryStatus } from '../server/enquiries.js';
import { isSameOrigin, json, readJson } from '../server/http.js';
import { isEnquiryStatus } from '../src/enquiry-status.js';

const cookieName = '__Host-velnox-admin';
const sessionSeconds = 60 * 60 * 8;
const password = () => process.env.ADMIN_PASSWORD;
const hash = value => createHash('sha256').update(value).digest();
const sign = expiry => createHmac('sha256', password()).update(`velnox-admin:${expiry}`).digest('base64url');
const cookie = (value, seconds) => `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
const unavailable = () => json({ error: 'The admin password or enquiry database is not configured.' }, 503);
const isEnquiryId = id => typeof id === 'string' && /^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n;

function isSignedIn(request) {
  const session = request.headers.get('Cookie')?.split('; ').find(value => value.startsWith(cookieName + '='));
  const token = session?.slice(cookieName.length + 1);
  const [expiry, signature] = token?.split('.') ?? [];
  return /^\d{10}$/.test(expiry ?? '') && /^[-\w]{43}$/.test(signature ?? '')
    && Number(expiry) > Math.floor(Date.now() / 1000)
    && timingSafeEqual(Buffer.from(signature), Buffer.from(sign(expiry)));
}

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  if (!password() || !hasDatabase()) return unavailable();
  const credentials = await readJson(request, 4096);
  const supplied = credentials?.password;
  if (typeof supplied !== 'string' || !timingSafeEqual(hash(supplied), hash(password()))) {
    return json({ error: 'Incorrect admin password.' }, 401);
  }
  const expiry = Math.floor(Date.now() / 1000) + sessionSeconds;
  return json({ signedIn: true }, 200, { 'Set-Cookie': cookie(`${expiry}.${sign(expiry)}`, sessionSeconds) });
}

export async function GET(request) {
  if (!password() || !hasDatabase()) return unavailable();
  if (!isSignedIn(request)) return json({ error: 'Sign in to view enquiries.' }, 401);
  const params = new URL(request.url).searchParams;
  const before = params.get('before');
  const status = params.get('status');
  const search = (params.get('q') ?? '').trim();
  if (before !== null && !isEnquiryId(before)) return json({ error: 'Invalid page.' }, 400);
  if ((status !== null && !isEnquiryStatus(status)) || search.length > 180) return json({ error: 'Invalid enquiry filter.' }, 400);
  try {
    return json(await listEnquiries({ before, status, search }));
  } catch {
    console.error('Could not read enquiries from Postgres');
    return json({ error: 'Could not load enquiries. Please try again.' }, 503);
  }
}

export async function PATCH(request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  if (!password() || !hasDatabase()) return unavailable();
  if (!isSignedIn(request)) return json({ error: 'Sign in to update enquiries.' }, 401);
  const update = await readJson(request, 4096);
  if (!isEnquiryId(update?.id) || !isEnquiryStatus(update.status) || !isEnquiryStatus(update.previousStatus)) {
    return json({ error: 'Invalid enquiry or status.' }, 400);
  }
  try {
    const saved = await updateEnquiryStatus(update);
    return saved ? json(saved) : json({ error: 'This enquiry changed. Refresh the inbox before updating it.' }, 409);
  } catch {
    console.error('Could not update enquiry status in Postgres');
    return json({ error: 'Could not save the status. Please try again.' }, 503);
  }
}

export function DELETE(request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  return json({ signedIn: false }, 200, { 'Set-Cookie': cookie('', 0) });
}
