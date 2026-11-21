export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
  });
}

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

export async function readJson(request, limit) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '')) return null;
  if (Number(request.headers.get('Content-Length')) > limit || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
