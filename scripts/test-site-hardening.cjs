// Isolated fixtures only: no real credentials, external requests, bookings or mail.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),req=createRequire(path.join(root,'package.json'));
const ts=req('typescript'),{NextRequest}=req('next/server');
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomade-hardening-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const env={NODE_ENV:'production',NOMADE_MENU_FILE:path.join(dir,'menu.json'),NOMADE_ADMIN_RATE_LIMIT_FILE:path.join(dir,'login.json'),NOMADE_ADMIN_SECRET:'isolated-test-secret-with-at-least-32-characters',NOMADE_ADMIN_PASSWORD:'isolated-test-password',NOMADE_SMTP_PASSWORD:'isolated-mail-stub',NOMADE_RESERVATIONS_TOKEN:'isolated-calendar-stub'};
  const state={clock:'2026-10-21T08:00:00Z',sent:[],closed:[],available:true,sheetWrites:0};
  const cache=new Map();
  class Clock extends Date{constructor(...args){super(...(args.length?args:[state.clock]));}static now(){return new Date(state.clock).getTime();}}
  function load(file){
    if(cache.has(file))return cache.get(file).exports;
    const mod={exports:{}};cache.set(file,mod);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
    const localRequire=name=>name==='nodemailer'?{createTransport:()=>({sendMail:async message=>{state.sent.push(message);}})}:name.startsWith('.')?load(path.resolve(path.dirname(file),`${name}.ts`)):req(name);
    vm.runInNewContext(code,{require:localRequire,module:mod,exports:mod.exports,process:{env,cwd:()=>root},Date:Clock,Buffer,console,crypto:crypto.webcrypto,Intl,URL,AbortSignal,setTimeout,clearTimeout,fetch:async(_url,options)=>{
      if(options?.method==='POST'){state.sheetWrites++;return {ok:true,status:200};}
      return {ok:state.available,status:state.available?200:503,json:async()=>({ok:state.available,closedDates:state.closed})};
    }},{filename:file});return mod.exports;
  }
  const getModule=name=>load(path.join(root,name));
  async function post(route,body,lang='fr',headers={}){
    return getModule(`app/api/${route}/route.ts`).POST(new NextRequest(`https://qa.invalid/api/${route}?lang=${lang}`,{method:'POST',headers:{origin:'https://qa.invalid',host:'qa.invalid','content-type':'application/json','x-forwarded-for':'192.0.2.1',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));
  }
  return {dir,env,state,module:getModule,post,reload:()=>cache.clear()};
}

test('one consent validator rejects expired, future, malformed and previous-version choices',t=>{
  const q=fixture(t),c=q.module('lib/cookie-consent.ts'),now=Date.now();
  const raw=patch=>JSON.stringify({value:'accepted',timestamp:now-1000,analyticsConsentVersion:1,...patch});
  assert.equal(c.parseCookieConsent(raw(),now).value,'accepted');assert.equal(c.parseCookieConsent(raw({value:'refused'}),now).value,'refused');
  for(const value of [null,'{','null','[]',raw({timestamp:now-c.CONSENT_MAX_AGE_MS}),raw({timestamp:now+1}),raw({timestamp:'1'}),raw({analyticsConsentVersion:0}),raw({value:'yes'})])assert.equal(c.parseCookieConsent(value,now),null);
  assert.equal(c.readCookieConsent({getItem(){throw new Error('storage blocked');}}),null);
  assert.equal(c.browserCookieConsent(),null);
});
test('analytics defaults to denied, grants only analytics, and disables an already-loaded tag on revocation',t=>{
  const q=fixture(t),a=q.module('lib/analytics-consent.ts'),runtime={};
  a.applyAnalyticsConsent(runtime,false);assert.equal(runtime[`ga-disable-${a.MEASUREMENT_ID}`],true);
  let calls=runtime.dataLayer.map(value=>Array.from(value));assert.equal(calls[0][0],'consent');assert.equal(calls[0][1],'default');assert.equal(calls[0][2].analytics_storage,'denied');
  a.applyAnalyticsConsent(runtime,true);assert.equal(runtime[`ga-disable-${a.MEASUREMENT_ID}`],false);
  calls=runtime.dataLayer.map(value=>Array.from(value));assert.equal(calls.at(-1)[2].analytics_storage,'granted');assert.equal(calls.at(-1)[2].ad_storage,'denied');
  runtime.gtag=(...args)=>{assert.equal(runtime[`ga-disable-${a.MEASUREMENT_ID}`],true);assert.equal(args[2].analytics_storage,'denied');};
  a.applyAnalyticsConsent(runtime,false);
});
test('revocation expires only GA cookies on host and parent domains, and tolerates blocked cookies',t=>{
  const q=fixture(t),a=q.module('lib/analytics-consent.ts'),writes=[];
  const doc={get cookie(){return '_ga=one; _ga_TEST=two; nomade_admin=keep; other=keep';},set cookie(value){writes.push(value);}};
  a.clearAnalyticsCookies(doc,'www.nomade-foix.fr');assert.equal(writes.length,6);
  assert.ok(writes.every(value=>value.startsWith('_ga')&&value.includes('Max-Age=0')));assert.ok(writes.every(value=>!value.includes('nomade_admin')&&!value.includes('domain=fr;')));
  assert.doesNotThrow(()=>a.clearAnalyticsCookies({get cookie(){throw new Error('blocked');}},'localhost'));
});
test('document language follows localized paths and leaves administration French',t=>{
  const q=fixture(t),{languageFromPathname:f}=q.module('lib/site-language.ts');
  for(const [pathname,lang] of [['/fr','fr'],['/en/dejeuner','en'],['/es/anything','es'],['/admin/reservations','fr'],['/enough','fr'],[null,'fr']])assert.equal(f(pathname),lang);
});
const reservation={name:'Isolated Guest',phone:'0000000000',email:'guest@example.invalid',date:'2026-10-22',time:'12:00',guests:2};
test('booking customers receive FR/EN/ES mail; restaurant mail stays French; legacy requests default to FR',async t=>{
  for(const [lang,subject,greeting] of [['fr','Confirmation de votre réservation','Bonjour'],['en','Confirmation of your booking','Hello'],['es','Confirmación de tu reserva','Hola']]){
    const q=fixture(t),response=await q.post('reservations',{...reservation,lang},lang);
    assert.equal(response.status,200);assert.equal(q.state.sent.length,2);assert.equal(q.state.sheetWrites,1);
    assert.match(q.state.sent[0].subject,/Nouvelle réservation/);assert.ok(q.state.sent[1].subject.includes(subject));assert.ok(q.state.sent[1].text.includes(`${greeting} Isolated Guest`));
  }
  const q=fixture(t);assert.equal((await q.post('reservations',reservation,'unknown')).status,200);assert.match(q.state.sent[1].subject,/Confirmation de votre réservation/);
});
test('booking validation, closed days and unavailable calendars localize without sending',async t=>{
  for(const [lang,word,closed,unavailable] of [['fr','Requête','fermé','disponib'],['en','Invalid','closed','Availability'],['es','Solicitud','cerrado','disponibilidad']]){
    const q=fixture(t);let r=await q.post('reservations','{',lang);assert.equal(r.status,400);assert.ok((await r.json()).error.includes(word));
    q.state.closed=['2026-10-22'];r=await q.post('reservations',reservation,lang);assert.equal(r.status,409);assert.ok((await r.json()).error.includes(closed));
    q.state.available=false;r=await q.post('reservations',reservation,lang);assert.equal(r.status,503);assert.ok((await r.json()).error.includes(unavailable));assert.equal(q.state.sent.length,0);assert.equal(q.state.sheetWrites,0);
  }
});
test('login limit survives workers/restart, returns Retry-After and expires without storing credentials/IP',async t=>{
  const q=fixture(t);for(let i=0;i<5;i++)assert.equal((await q.post('admin/session',{password:'wrong'})).status,401);
  q.reload();const denied=await q.post('admin/session',{password:q.env.NOMADE_ADMIN_PASSWORD});assert.equal(denied.status,429);assert.equal(denied.headers.get('retry-after'),'900');assert.equal(denied.headers.has('set-cookie'),false);
  const saved=fs.readFileSync(q.env.NOMADE_ADMIN_RATE_LIMIT_FILE,'utf8');assert.ok(!saved.includes('192.0.2.1')&&!saved.includes('password')&&!saved.includes(q.env.NOMADE_ADMIN_SECRET));assert.equal(fs.statSync(q.env.NOMADE_ADMIN_RATE_LIMIT_FILE).mode&0o777,0o600);
  q.state.clock='2026-10-21T08:15:00Z';assert.equal((await q.post('admin/session',{password:q.env.NOMADE_ADMIN_PASSWORD})).status,200);
});
test('parallel login attempts cannot bypass the shared five-attempt limit',async t=>{
  const q=fixture(t),replies=await Promise.all(Array.from({length:10},()=>q.post('admin/session',{password:'wrong'})));
  assert.equal(replies.filter(r=>r.status===401).length,5);assert.equal(replies.filter(r=>r.status===429).length,5);
});
test('login has a global ceiling even when addresses are varied',async t=>{
  const q=fixture(t);for(let i=1;i<=60;i++)assert.equal((await q.post('admin/session',{password:'wrong'},'fr',{'x-forwarded-for':`192.0.2.${i}`})).status,401);
  assert.equal((await q.post('admin/session',{password:'wrong'},'fr',{'x-forwarded-for':'192.0.2.100'})).status,429);
});
test('successful login keeps Secure HttpOnly SameSite session; origin rejection does not consume quota',async t=>{
  const q=fixture(t);assert.equal((await q.post('admin/session',{password:q.env.NOMADE_ADMIN_PASSWORD},'fr',{origin:'https://other.invalid'})).status,403);assert.equal(fs.existsSync(q.env.NOMADE_ADMIN_RATE_LIMIT_FILE),false);
  const response=await q.post('admin/session',{password:q.env.NOMADE_ADMIN_PASSWORD});assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie');for(const value of ['HttpOnly','Secure','SameSite=strict','Path=/api/admin'])assert.ok(cookie.includes(value));
  const api=q.module('app/api/admin/session/route.ts');let r=await api.GET(new NextRequest('https://qa.invalid/api/admin/session',{headers:{cookie:cookie.split(';')[0]}}));assert.equal((await r.json()).authenticated,true);
  q.state.clock='2026-10-21T20:01:00Z';r=await api.GET(new NextRequest('https://qa.invalid/api/admin/session',{headers:{cookie:cookie.split(';')[0]}}));assert.equal((await r.json()).authenticated,false);
});
test('corrupt login limiter fails closed; oversized bodies do not create sessions',async t=>{
  const q=fixture(t);fs.writeFileSync(q.env.NOMADE_ADMIN_RATE_LIMIT_FILE,'{');const r=await q.post('admin/session',{password:q.env.NOMADE_ADMIN_PASSWORD});assert.equal(r.status,503);assert.equal(r.headers.has('set-cookie'),false);
  const large=await q.post('admin/session','x'.repeat(5000));assert.equal(large.status,413);assert.equal(large.headers.has('set-cookie'),false);
});
