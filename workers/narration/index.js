/* eslint-env serviceworker */
/**
 * Serves the narration files stored in Workers KV: one MP3 per reel plus its timings JSON,
 * both uploaded by the Narration workflow.
 *   GET or HEAD /<voice>/<reel-id>-<hash>.mp3|.json   public
 *   PUT          same paths                             needs "Authorization: Bearer <UPLOAD_TOKEN>"
 * UPLOAD_TOKEN is a Worker secret (wrangler secret put UPLOAD_TOKEN), never in this repo.
 * Deploy: cd workers/narration && npx wrangler@4.163.0 deploy
 */
const FILE = /^[a-z0-9_]+\/[a-z0-9-]+\.(mp3|json)$/;
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = { mp3: 'audio/mpeg', json: 'application/json' };

function sameText(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  return x.byteLength === y.byteLength && crypto.subtle.timingSafeEqual(x, y);
}

async function upload(request, env, key) {
  const given = (request.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  if (!env.UPLOAD_TOKEN || !sameText(given, env.UPLOAD_TOKEN)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return new Response('Bad size', { status: 413 });
  }
  // A file's name changes when its text changes, so a stored file is never replaced.
  if ((await env.NARRATION.get(key, { type: 'stream' })) !== null) {
    return new Response('Already stored', { status: 409 });
  }
  await env.NARRATION.put(key, body);
  return new Response('Stored', { status: 201 });
}

export default {
  async fetch(request, env) {
    const key = new URL(request.url).pathname.slice(1);
    const match = FILE.exec(key);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }
    if (request.method === 'PUT') {
      return upload(request, env, key);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, PUT' } });
    }
    // Default KV caching (60 s): a longer one would also keep "not found" answers after an upload.
    const body = await env.NARRATION.get(key, { type: 'arrayBuffer' });
    if (body === null) {
      return new Response('Not found', { status: 404 });
    }
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: {
        'Content-Type': TYPES[match[1]],
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  },
};
