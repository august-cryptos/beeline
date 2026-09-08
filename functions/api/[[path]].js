// Live-run forensic fix (2026-09-08, round 7): confirmed live via a raw packet capture on the origin
// server - the customer's browser reaches the server fine (SYN arrives, server answers with SYN-ACK),
// but the server's reply never makes it back (one-way packet loss, seen on every one of ~18 parallel
// connection attempts in the capture). This is a routing/peering problem between the origin's hosting
// network and this customer's mobile carrier, not anything in the app or in nginx - no code change on
// the origin side can fix a broken path between two networks.
//
// The static site itself (this same beeline.pages.dev / Cloudflare Pages deployment) has never had this
// problem for this customer - Cloudflare's network has a completely different, much larger set of
// peering paths than a direct connection to the origin's IP does. So instead of the browser talking to
// the origin directly, it now talks to THIS function (same origin as the page - no CORS needed either),
// which runs on Cloudflare's edge and does the origin fetch itself. That fetch leaves from Cloudflare's
// network, not the customer's ISP, so it never touches the broken path at all.
export async function onRequest(context) {
 const { request, params } = context;
 const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
 const url = new URL(request.url);
 const targetUrl = `https://qwertyxyz.com/v2-staging/customer-api/${path}${url.search}`;

 const init = { method: request.method, headers: {} };
 const contentType = request.headers.get('content-type');
 if (contentType) init.headers['content-type'] = contentType;
 const authorization = request.headers.get('authorization');
 if (authorization) init.headers['authorization'] = authorization;
 if (request.method !== 'GET' && request.method !== 'HEAD') {
  init.body = await request.arrayBuffer();
 }

 let resp;
 try {
  resp = await fetch(targetUrl, init);
 } catch (e) {
  return new Response(JSON.stringify({ error: 'UPSTREAM_UNREACHABLE' }), {
   status: 502,
   headers: { 'content-type': 'application/json' },
  });
 }
 const body = await resp.arrayBuffer();
 return new Response(body, {
  status: resp.status,
  headers: { 'content-type': resp.headers.get('content-type') || 'application/json' },
 });
}
