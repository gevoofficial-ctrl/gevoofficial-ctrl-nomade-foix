// Read-only smoke checks. Never submits an order, booking or email.
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://localhost:3128').replace(/\/$/,'');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
async function get(path) {
  const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,path);return response;
}
(async()=>{
  for(const lang of ['fr','en','es']) {
    const html=await(await get(`/${lang}/dejeuner`)).text();
    const catalog=await(await get(`/api/dejeuner?lang=${lang}&availability=separate`)).json();
    assert.ok(html.includes(`<html lang="${lang}"`));
    const items=catalog.dishes.length?[...catalog.dishes,...catalog.drinks]:[];
    assert.equal((html.match(/<article class="lunchCard">/g)||[]).length,items.length,'real cards must be in initial HTML');
    for(const item of items)assert.ok(html.includes(`<h3>${escape(item.name)}</h3>`),'translated dish name must be server rendered');
    if(items.length){assert.ok(!html.includes('class="lunchLoading"'));assert.match(html,/loading="eager"/);assert.match(html,/fetchPriority="high"/i);}
    assert.ok(!html.includes('w=3840'));
    for(const alternate of ['fr','en','es'])assert.ok(html.includes(`hrefLang="${alternate}"`));
    const home=await(await get(`/${lang}`)).text();
    assert.ok(home.includes('poster="/video/nomade-hero-poster-v2.webp"'));
    console.log(`PASS ${lang}: ${items.length} initial HTML cards, responsive first image, hreflang, optimized hero poster`);
  }
  for(const [path,limit] of [['/images/nomade-print-mobile-v1.webp',180000],['/video/nomade-hero-poster-v2.webp',75000]]) {
    const bytes=(await(await get(path)).arrayBuffer()).byteLength;assert.ok(bytes<limit,`${path}: ${bytes}`);console.log(`PASS ${path}: ${bytes} bytes`);
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
