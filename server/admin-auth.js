import { createHmac, timingSafeEqual } from 'node:crypto';
import { hasDatabase } from './enquiries.js';
import { json } from './http.js';

export const cookieName = '__Host-velnox-admin';
export const password = () => process.env.ADMIN_PASSWORD;
export const sign = expiry => createHmac('sha256', password()).update(`velnox-admin:${expiry}`).digest('base64url');
export const unavailable = () => json({ error: 'The admin password or enquiry database is not configured.' }, 503);
export const isEnquiryId = id => typeof id === 'string' && /^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n;

export function requireAdmin(request) {
  if (!password() || !hasDatabase()) return unavailable();
  const entry = request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(cookieName + '='));
  const [expiry, signature, extra] = entry?.slice(cookieName.length + 1).split('.') ?? [];
  if (extra === undefined && /^\d{10}$/.test(expiry ?? '') && /^[-\w]{43}$/.test(signature ?? '')
    && Number(expiry) > Math.floor(Date.now() / 1000)
    && timingSafeEqual(Buffer.from(signature), Buffer.from(sign(expiry)))) return null;
  return json({ error: 'Sign in to continue.' }, 401);
}
