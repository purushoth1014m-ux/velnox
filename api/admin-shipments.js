import { isEnquiryId, requireAdmin } from '../server/admin-auth.js';
import { isSameOrigin, json, readJson } from '../server/http.js';
import { createShipment, listShipments, parseShipment, updateShipment } from '../server/shipments.js';
import { isShipmentStatus } from '../src/shipment-status.js';

export async function GET(request) {
  const blocked = requireAdmin(request);
  if (blocked) return blocked;
  const params = new URL(request.url).searchParams;
  const before = params.get('before'), status = params.get('status');
  if ((before !== null && !isEnquiryId(before)) || (status !== null && !isShipmentStatus(status))) {
    return json({ error: 'Invalid shipment filter.' }, 400);
  }
  try { return json(await listShipments({ before, status })); }
  catch {
    console.error('Could not read shipments from Postgres');
    return json({ error: 'Could not load shipments. Please try again.' }, 503);
  }
}

async function save(request, editing) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid origin.' }, 403);
  const blocked = requireAdmin(request);
  if (blocked) return blocked;
  const shipment = parseShipment(await readJson(request, 16_000), editing);
  if (!shipment) return json({ error: 'Check the shipment fields. Carrier tracking links must use HTTPS.' }, 400);
  try {
    const saved = editing ? await updateShipment(shipment) : await createShipment(shipment);
    return saved ? json(saved, editing ? 200 : 201)
      : json({ error: 'This shipment changed. Reopen it before updating.' }, 409);
  } catch (error) {
    if (error.code === '23503') return json({ error: 'The enquiry reference does not exist.' }, 400);
    console.error('Could not save shipment to Postgres');
    return json({ error: 'Could not save the shipment. Please retry.' }, 503);
  }
}

export function POST(request) { return save(request, false); }
export function PATCH(request) { return save(request, true); }
