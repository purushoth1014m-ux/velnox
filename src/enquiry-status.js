export const enquiryStatuses = {
  new: 'New',
  follow_up: 'Follow-up',
  closed: 'Closed',
};

export function isEnquiryStatus(value) {
  return typeof value === 'string' && Object.hasOwn(enquiryStatuses, value);
}
