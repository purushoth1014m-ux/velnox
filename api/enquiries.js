import { hasDatabase, parseEnquiry, saveEnquiry } from '../server/enquiries.js';
import { isSameOrigin, json, readJson } from '../server/http.js';

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  if (!hasDatabase()) return json({ error: 'The enquiry database is not connected.' }, 503);
  const enquiry = parseEnquiry(await readJson(request, 24_000));
  if (!enquiry) return json({ error: 'Check your email address and the required fields.' }, 400);
  try {
    return json(await saveEnquiry(enquiry), 201);
  } catch {
    console.error('Could not save enquiry to Postgres');
    return json({ error: 'We could not confirm your enquiry was saved. Please retry.' }, 503);
  }
}
