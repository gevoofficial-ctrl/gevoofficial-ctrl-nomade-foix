// Isolated checkout tests: temporary data, mocked availability and captured mail only.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'), req=createRequire(path.join(root,'package.json'));
const ts=req('typescript'),{NextRequest}=req('next/server');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomade-checkout-'));
  const main={id:id(1),category:'Plats',translations:{fr:{name:'Poulet',description:'Plat',ingredients:''},en:{name:'Chicken',description:'Main',ingredients:''},es:{name:'Pollo',description:'Plato',ingredients:''}},imageUrl:'',available:true,signature:false,order:0,regularPriceCents:1600,lunchIncluded:true,lunchPriceCents:1400};
  const drink={...main,id:id(2),category:'Boissons',translations:{fr:{name:'Boisson',description:'',ingredients:''},en:{name:'Drink',description:'',ingredients:''},es:{name:'Bebida',description:'',ingredients:''}},regularPriceCents:500,lunchPriceCents:450};
  const env={NODE_ENV:'production',NOMADE_MENU_FILE:path.join(dir,'menu.json'),NOMADE_LUNCH_STATE_FILE:path.join(dir,'orders.json'),NOMADE_SMTP_PASSWORD:'local-stub',NOMADE_RESERVATIONS_TOKEN:'local-stub'};
  fs.writeFileSync(env.NOMADE_MENU_FILE,JSON.stringify([main,drink]));
  const state={clock:'2026-10-21T08:00:00Z',closed:[],availability:true,sent:[],calls:0,failAt:0,closureCalls:0,transientFailures:0,closureHook:null};
  const cache=new Map();
  class Clock extends Date {constructor(...args){super(...(args.length?args:[state.clock]));}static now(){return new Date(state.clock).getTime();}}
  function load(file) {
    if(cache.has(file))return cache.get(file).exports;
    const mod={exports:{}};cache.set(file,mod);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
    const localRequire=name=>name==='nodemailer'?{createTransport:()=>({sendMail:async message=>{state.calls++;if(state.calls===state.failAt)throw new Error('simulated delivery failure');state.sent.push(message);}})}:name.startsWith('.')?load(path.resolve(path.dirname(file),`${name}.ts`)):req(name);
    vm.runInNewContext(code,{require:localRequire,module:mod,exports:mod.exports,process:{env,cwd:()=>root},Date:Clock,Buffer,console,crypto:crypto.webcrypto,Intl,URL,AbortSignal,setTimeout,clearTimeout,fetch:async()=>{
      state.closureCalls++;
      if(state.closureHook)return state.closureHook();
      const ok=state.availability&&state.transientFailures--<=0;
      return {ok,status:ok?200:503,json:async()=>({ok,closedDates:state.closed})};
    }},{filename:file});
    return mod.exports;
  }
  let api=load(path.join(root,'app/api/dejeuner/route.ts'));
  const payload=(patch={})=>({idempotencyKey:crypto.randomUUID(),firstName:'Local <test>',lastName:'Checkout',phone:'0000000000',email:'guest@example.invalid',date:'2026-10-22',time:'12:00',comment:'<img src=x onerror=alert(1)>',dishes:[{id:id(1),quantity:4}],drinks:[{id:id(2),quantity:2}],...patch});
  async function post(body,lang='fr',headers={}) {
    const response=await api.POST(new NextRequest(`https://qa.invalid/api/dejeuner?lang=${lang}`,{method:'POST',headers:{origin:'https://qa.invalid',host:'qa.invalid','content-type':'application/json','x-forwarded-for':'192.0.2.1',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));
    return {status:response.status,headers:response.headers,body:await response.json()};
  }
  return {dir,env,state,payload,post,api:()=>api,catalog:async lang=>load(path.join(root,'lib/lunch-catalog.ts')).lunchCatalog(await load(path.join(root,'lib/menu.ts')).readMenu(),lang),availability:()=>load(path.join(root,'lib/reservation-availability.ts')),reload:()=>{cache.clear();api=load(path.join(root,'app/api/dejeuner/route.ts'));}};
}

test('customer email, names, totals and errors follow FR/EN/ES; restaurant mail stays French',async()=>{
  for(const [lang,title,name,subject,invalid] of [['fr','Déjeuner à emporter','Poulet','Confirmation de votre commande','Identifiant'],['en','Takeaway lunch','Chicken','Confirmation of your order','identifier'],['es','Almuerzo para llevar','Pollo','Confirmación de tu pedido','Identificador']]) {
    const q=fixture(),result=await q.post(q.payload(),lang);
    assert.equal(result.status,200);assert.equal(q.state.sent.length,2);
    const [restaurant,customer]=q.state.sent;
    assert.match(restaurant.subject,/Nouvelle commande/);assert.match(restaurant.text,/Poulet/);assert.match(restaurant.text,/66,00/);
    assert.ok(customer.subject.includes(subject));assert.ok(customer.html.includes(`<html lang="${lang}">`));assert.ok(customer.html.includes(title));assert.ok(customer.text.includes(name));assert.ok(customer.text.includes('66'));
    assert.ok(!customer.html.includes('<img src=x'));assert.ok(customer.html.includes('&lt;img'));assert.ok(customer.html.includes('Local &lt;test&gt;'));assert.ok(customer.html.includes('tel:+33745262823'));assert.ok(customer.html.includes('google.com/maps/'));
    const bad=await q.post({},lang);assert.equal(bad.status,400);assert.ok(bad.body.error.includes(invalid));
  }
});

test('all pricing boundaries remain correct in the server-generated restaurant email',async()=>{
  for(const [m,d,total] of [[3,1,'53,00'],[4,2,'66,00'],[3,5,'70,50'],[4,4,'74,00']]) {
    const q=fixture(),r=await q.post(q.payload({dishes:[{id:id(1),quantity:m}],drinks:[{id:id(2),quantity:d}]}),'en');
    assert.equal(r.status,200);assert.ok(q.state.sent[0].text.includes(`Total : ${total} €`));
  }
});

test('email limit persists across workers; existing attempts replay without resending at the limit',async()=>{
  const q=fixture(),first=q.payload();assert.equal((await q.post(first,'en')).status,200);
  for(let i=0;i<2;i++)assert.equal((await q.post(q.payload(),'en')).status,200);
  q.reload();const denied=await q.post(q.payload(),'es');
  assert.equal(denied.status,429);assert.equal(denied.body.code,'RATE_LIMITED');assert.match(denied.body.error,/Demasiadas/);assert.equal(denied.headers.get('retry-after'),'900');
  const again=await q.post(first,'es');assert.equal(again.status,200);assert.equal(again.body.duplicate,true);assert.equal(q.state.sent.length,6);
  const mismatch=await q.post({...first,time:'12:10'},'en');assert.equal(mismatch.status,409);assert.match(mismatch.body.error,/different order/);
  q.state.clock='2026-10-21T08:15:00Z';assert.equal((await q.post(q.payload(),'en')).status,200);
  const stored=fs.readFileSync(path.join(q.dir,'dejeuner-rate-limit.json'),'utf8');assert.ok(!stored.includes('guest@'));assert.ok(!stored.includes('192.0.2.1'));
});

test('per-IP limit permits ten distinct customers then blocks the eleventh',async()=>{
  const q=fixture();for(let i=0;i<10;i++)assert.equal((await q.post(q.payload({email:`guest${i}@example.invalid`}))).status,200);
  assert.equal((await q.post(q.payload({email:'other@example.invalid'}))).status,429);assert.equal(q.state.sent.length,20);
});

test('parallel new attempts cannot exceed the shared IP limit',async()=>{
  const q=fixture();const replies=await Promise.all(Array.from({length:14},(_,i)=>q.post(q.payload({email:`parallel${i}@example.invalid`}),'en')));
  assert.equal(replies.filter(r=>r.status===200).length,10);assert.equal(replies.filter(r=>r.status===429).length,4);assert.equal(q.state.sent.length,20);
});

test('parallel retries produce one order and two messages',async()=>{
  const q=fixture(),body=q.payload();const replies=await Promise.all([q.post(body,'en'),q.post(body,'en')]);
  assert.ok(replies.every(r=>[200,202].includes(r.status)));assert.equal(q.state.sent.length,2);
  assert.equal(new Set(replies.map(r=>r.body.orderNumber)).size,1);
});

test('SMTP uncertainty and customer failure do not cause duplicate delivery on retry',async()=>{
  const q=fixture(),body=q.payload();q.state.failAt=1;
  const first=await q.post(body,'es');assert.equal(first.status,502);assert.match(first.body.error,/Es necesario/);
  const replay=await q.post(body,'en');assert.equal(replay.status,409);assert.match(replay.body.error,/needs to be checked/);assert.equal(q.state.calls,1);
  const p=fixture(),b=p.payload();p.state.failAt=2;
  const partial=await p.post(b,'en');assert.equal(partial.status,200);assert.equal(partial.body.confirmationEmailSent,false);
  const repeat=await p.post(b,'es');assert.equal(repeat.status,200);assert.equal(repeat.body.confirmationEmailSent,false);assert.equal(p.state.calls,2);
});

test('closed days, availability failure, invalid input and malformed JSON localize without mail',async()=>{
  for(const [lang,closed,availability,invalid] of [['fr','fermé','disponibilité','Requête'],['en','closed','Availability','Invalid'],['es','cerrado','disponibilidad','Solicitud']]) {
    const q=fixture();q.state.closed=['2026-10-22'];let r=await q.post(q.payload(),lang);assert.equal(r.status,409);assert.ok(r.body.error.includes(closed));
    q.state.availability=false;r=await q.post(q.payload(),lang);assert.equal(r.status,503);assert.ok(r.body.error.includes(availability));
    const g=await q.api().GET(new NextRequest(`https://qa.invalid/api/dejeuner?lang=${lang}`));assert.equal(g.status,503);assert.ok((await g.json()).error.includes(availability));
    r=await q.post('{',lang);assert.equal(r.status,400);assert.ok(r.body.error.includes(invalid));assert.equal(q.state.sent.length,0);
    r=await q.post({},lang,{origin:'https://other.invalid'});assert.equal(r.status,403);
  }
});

test('legacy payload remains accepted; corrupt limiter fails closed without sending',async()=>{
  const q=fixture(),body=q.payload();delete body.firstName;delete body.lastName;body.name='Legacy Guest';assert.equal((await q.post(body)).status,200);
  fs.writeFileSync(path.join(q.dir,'dejeuner-rate-limit.json'),'{broken');const r=await q.post(q.payload(),'en');assert.equal(r.status,503);assert.match(r.body.error,/Keep this attempt/);assert.equal(q.state.sent.length,2);
});

test('menu-only endpoint stays available without contacting the failed calendar',async()=>{
  const q=fixture();q.state.availability=false;
  const response=await q.api().GET(new NextRequest('https://qa.invalid/api/dejeuner?lang=en&availability=separate'));
  assert.equal(response.status,200);const body=await response.json();
  assert.equal(body.availabilityReady,false);assert.equal(body.dishes[0].name,'Chicken');
  assert.equal(body.drinks.length,1);assert.equal(body.pickupSlots[0],'12:00');
  assert.equal(q.state.closureCalls,0);assert.equal(q.state.sent.length,0);
});

test('a transient availability error is retried once; parallel calendars share the request',async()=>{
  const q=fixture();q.state.transientFailures=1;q.state.closed=['2026-10-22'];
  const a=q.availability();
  const dates=await Promise.all([a.lunchReservationClosedDates(),a.lunchReservationClosedDates()]);
  assert.deepEqual(Array.from(dates[0]),['2026-10-22']);assert.equal(q.state.closureCalls,2);
  dates[0].push('2026-10-23');
  assert.deepEqual(Array.from(await a.lunchReservationClosedDates()),['2026-10-22']);
  assert.equal(q.state.closureCalls,2);
});

test('expired cache fails closed instead of serving stale dates; checkout bypasses cached availability',async()=>{
  const q=fixture(),a=q.availability();await a.lunchReservationClosedDates();
  q.state.closed=['2026-10-22'];
  const denied=await q.post(q.payload(),'en');assert.equal(denied.status,409);
  assert.equal(q.state.closureCalls,2);assert.equal(q.state.sent.length,0);
  q.state.clock='2026-10-21T08:00:21Z';q.state.availability=false;
  await assert.rejects(a.lunchReservationClosedDates(),/Availability service failed/);
  assert.equal(q.state.closureCalls,4);
});

test('admin invalidation prevents an older in-flight response from repopulating the cache',async()=>{
  const q=fixture(),a=q.availability();let resolve;
  q.state.closureHook=()=>new Promise(done=>{resolve=done;});
  const old=a.lunchReservationClosedDates();
  a.invalidateReservationAvailability();q.state.closureHook=null;q.state.closed=['2026-10-22'];
  assert.deepEqual(Array.from(await a.lunchReservationClosedDates()),['2026-10-22']);
  resolve({ok:true,json:async()=>({ok:true,closedDates:[]})});await old;
  assert.deepEqual(Array.from(await a.lunchReservationClosedDates()),['2026-10-22']);
  assert.equal(q.state.closureCalls,2);
});

test('authorization and invalid closure responses fail closed without retry or mail',async()=>{
  for(const response of [{ok:false,status:403},{ok:true,json:async()=>({ok:false})},{ok:true,json:async()=>({ok:true,closedDates:null})}]) {
    const q=fixture();q.state.closureHook=async()=>response;
    await assert.rejects(q.availability().reservationClosedDates(),/Availability service failed/);
    assert.equal(q.state.closureCalls,1);assert.equal(q.state.sent.length,0);
  }
});

test('server-rendered catalog and fallback API expose identical public data in all languages',async()=>{
  const q=fixture();q.state.availability=false;
  for(const lang of ['fr','en','es']) {
    const initial=await q.catalog(lang);
    const response=await q.api().GET(new NextRequest(`https://qa.invalid/api/dejeuner?lang=${lang}&availability=separate`));
    assert.equal(response.status,200);
    assert.deepEqual(JSON.parse(JSON.stringify(initial)),await response.json());
    assert.equal(initial.availabilityReady,false);assert.equal(initial.closedDates.length,0);
    assert.equal(initial.dishes[0].regularPriceCents,1600);assert.equal(initial.drinks[0].lunchPriceCents,450);
    assert.equal(q.state.closureCalls,0);assert.equal(q.state.sent.length,0);
  }
});

test('initial catalog reads current menu changes, filters unavailable items and omits admin-only fields',async()=>{
  const q=fixture();const menu=JSON.parse(fs.readFileSync(q.env.NOMADE_MENU_FILE,'utf8'));
  menu[0].regularPriceCents=1800;menu[0].translations.fr.ingredients='private-field-not-in-catalog';
  menu[1].available=false;fs.writeFileSync(q.env.NOMADE_MENU_FILE,JSON.stringify(menu));
  const initial=await q.catalog('fr');
  assert.equal(initial.dishes[0].regularPriceCents,1800);assert.equal(initial.drinks.length,0);
  assert.ok(!JSON.stringify(initial).includes('private-field-not-in-catalog'));assert.equal(q.state.closureCalls,0);
});
