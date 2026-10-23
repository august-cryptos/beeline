// Owner request (2026-10-23): geomasterkz.com/go/<personal code> - a WhatsApp buyer's way into the Telegram bot.
// The link stays on our own domain (friendlier for WhatsApp than a bare t.me link); here it turns into the bot
// link carrying his signed start code, so the bot already knows who he is and gives his referral link.
const BOT = 'GeoMaster1_bot';
export async function onRequest(context) {
 const code = String(context.params.code || '').trim();
 let start = null;
 if (/^[A-Za-z]{3}[0-9]{3}$/.test(code)) {
  try {
   const r = await fetch(`https://qwertyxyz.com/v2-staging/customer-api/tg-start?t=${encodeURIComponent(code)}`);
   if (r.ok) start = (await r.json()).start || null;
  } catch (e) { /* the bot without a code still works */ }
 }
 const target = `https://t.me/${BOT}` + (start && /^[A-Za-z0-9_-]{1,64}$/.test(start) ? `?start=${start}` : '');
 return Response.redirect(target, 302);
}
