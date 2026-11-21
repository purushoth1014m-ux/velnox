export async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'The server could not complete the request.');
    error.status = response.status;
    throw error;
  }
  return data;
}
