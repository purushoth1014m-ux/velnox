import { createHash, timingSafeEqual } from 'node:crypto';
import { hasDatabase, listEnquiries, updateEnquiryStatus } from '../server/enquiries.js';
import { isSameOrigin, json, readJson } from '../server/http.js';
import { isEnquiryStatus } from '../src/enquiry-status.js';
import { cookieName, isEnquiryId, password, requireAdmin, sign, unavailable } from '../server/admin-auth.js';

const sessionSeconds = 60 * 60 * 8;
const hash = value => createHash('sha256').update(value).digest();
const cookie = (value, seconds) => `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;

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
  const blocked = requireAdmin(request);
  if (blocked) return blocked;
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
  const blocked = requireAdmin(request);
  if (blocked) return blocked;
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
