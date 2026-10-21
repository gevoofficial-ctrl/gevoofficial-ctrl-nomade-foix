// Read-only HTTP checks for localized 404s and the lunch privacy disclosure.
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:3128').replace(/\/$/,'');
(async()=>{
  for(const [lang,title,section] of [['fr','Page introuvable','Commandes de déjeuner à emporter'],['en','Page not found','Takeaway lunch orders'],['es','Página no encontrada','Pedidos de almuerzo para llevar']]){
    const missing=await fetch(`${base}/${lang}/not-a-real-page`,{signal:AbortSignal.timeout(15000)});
    assert.equal(missing.status,404);const html=await missing.text();
    assert.ok(html.includes(`<html lang="${lang}"`));assert.ok(html.includes(`<h1>${title}</h1>`));assert.ok(html.includes(`href="/${lang}"`));
    assert.ok(html.includes(`<title>${title} | NOMADE — Foix</title>`));assert.match(html,/<meta name="robots" content="noindex"/);
    const policy=await fetch(`${base}/${lang}/confidentialite`,{signal:AbortSignal.timeout(15000)});assert.equal(policy.status,200);
    const text=await policy.text();assert.ok(text.includes(section));assert.ok(text.includes('sessionStorage'));assert.ok(text.includes('o2switch'));
    console.log(`PASS ${lang}: localized HTTP 404, correct home link, lunch privacy and draft disclosure`);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
