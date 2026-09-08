// Live-run forensic fix (2026-09-08, round 8): the /api/* proxy (functions/api/[[path]].js) fixed the
// site's own fetch() calls, but the staging test-payment link is a real hyperlink opened in a NEW TAB
// (window.open in index.html) pointing directly at qwertyxyz.com/v2-staging/mock-pay/<token> - it never
// went through that proxy, so a customer on the same broken network path got an "about:blank" tab that
// never loads. This proxies the mock-pay checkout page (a simple GET-a-button/POST-to-confirm HTML page,
// see HealthServer.js's checkout()) the same way, from Cloudflare's edge instead of the customer's ISP.
// STAGING_PUBLIC_BASE_URL is now https://beeline.pages.dev/v2-staging so the page's own hardcoded
// relative form action (/v2-staging/mock-pay/<token>) still resolves to this same proxied path.
export async function onRequest(context) {
 const { request, params } = context;
 const targetUrl = `https://qwertyxyz.com/v2-staging/mock-pay/${params.token}`;

 const init = { method: request.method, headers: {} };
 const contentType = request.headers.get('content-type');
 if (contentType) init.headers['content-type'] = contentType;
 if (request.method !== 'GET' && request.method !== 'HEAD') {
  init.body = await request.arrayBuffer();
 }

 let resp;
 try {
  resp = await fetch(targetUrl, init);
 } catch (e) {
  return new Response('Не удалось связаться с сервером. Попробуйте ещё раз.', {
   status: 502,
   headers: { 'content-type': 'text/html; charset=utf-8' },
  });
 }
 const body = await resp.arrayBuffer();
 return new Response(body, {
  status: resp.status,
  headers: { 'content-type': resp.headers.get('content-type') || 'text/html; charset=utf-8' },
 });
}
