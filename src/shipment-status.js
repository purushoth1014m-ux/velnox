export const shipmentStatuses = {
  booked: 'Booked',
  in_transit: 'In transit',
  customs: 'Customs',
  delivered: 'Delivered',
  exception: 'Exception',
};

export function isShipmentStatus(value) {
  return typeof value === 'string' && Object.hasOwn(shipmentStatuses, value);
}
