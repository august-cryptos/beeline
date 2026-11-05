// Owner request (2026-11-05): geomasterkz.com/r/<personal code> - the short invite link a buyer sends to a friend.
// It turns into the site with the buyer's invite code (?ref=ref_...); the site then opens our WhatsApp with
// the friend's code already typed in, so the bot knows who invited him.
export async function onRequest(context) {
 const code = String(context.params.code || '').trim();
 let ref = null;
 if (/^[A-Za-z]{3}[0-9]{3}$/.test(code)) {
  try {
   const r = await fetch(`https://qwertyxyz.com/v2-staging/customer-api/ref-start?t=${encodeURIComponent(code)}`);
   if (r.ok) ref = (await r.json()).ref || null;
  } catch (e) { /* the site without a code still works */ }
 }
 const target = 'https://geomasterkz.com/' + (ref && /^ref_[0-9a-f]{10}$/i.test(ref) ? `?ref=${ref}` : '');
 return Response.redirect(target, 302);
}
