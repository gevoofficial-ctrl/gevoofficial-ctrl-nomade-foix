import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { menuFile } from './menu';

const windowMs=15*60_000;
export const adminLoginRateFile=()=>process.env.NOMADE_ADMIN_RATE_LIMIT_FILE||path.join(path.dirname(menuFile()),'admin-login-rate-limit.json');

/** Atomic, shared between Passenger workers. Never stores passwords or raw IPs. */
export async function checkAdminLoginRateLimit(address:string,now=Date.now()) {
  const file=adminLoginRateFile();
  const secret=process.env.NOMADE_ADMIN_SECRET;
  if(!secret)throw new Error('Login limiter configuration unavailable');
  const ip=isIP(address)?address:'unknown';
  const key=createHmac('sha256',secret).update(`login:${ip}`).digest('hex');
  await fs.mkdir(path.dirname(file),{recursive:true});
  let lock:fs.FileHandle|undefined;
  for(let i=0;i<100;i++) {
    try{lock=await fs.open(`${file}.lock`,'wx',0o600);break;}
    catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;await new Promise(resolve=>setTimeout(resolve,30));}
  }
  if(!lock)throw new Error('Login limiter busy');
  try {
    let buckets:Record<string,number[]>={};
    try{
      const state=JSON.parse(await fs.readFile(file,'utf8'));
      if(state.version!==1||!state.buckets||typeof state.buckets!=='object'||Array.isArray(state.buckets))throw new Error('Invalid login limiter state');
      buckets=state.buckets;
    }catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    for(const [bucket,times] of Object.entries(buckets)){
      if(!Array.isArray(times)||times.some(time=>!Number.isFinite(time)))throw new Error('Invalid login limiter bucket');
      const recent=times.filter(time=>time>now-windowMs);
      if(recent.length)buckets[bucket]=recent;else delete buckets[bucket];
    }
    // The global ceiling also bounds attempts if forwarded addresses are spoofed.
    const limits=[{key,max:5},{key:'global',max:60}];
    let retryAfter=0;
    for(const {key:bucket,max} of limits){const times=buckets[bucket]||[];if(times.length>=max)retryAfter=Math.max(retryAfter,Math.ceil((times[0]+windowMs-now)/1000));}
    if(retryAfter)return {allowed:false,retryAfter};
    if(Object.keys(buckets).length>10000)return {allowed:false,retryAfter:900};
    for(const {key:bucket} of limits)(buckets[bucket] ||= []).push(now);
    const temp=`${file}.${randomUUID()}.tmp`;
    try{await fs.writeFile(temp,JSON.stringify({version:1,buckets})+'\n',{mode:0o600});await fs.rename(temp,file);}
    finally{await fs.rm(temp,{force:true});}
    return {allowed:true,retryAfter:0};
  }finally{await lock.close();await fs.rm(`${file}.lock`,{force:true});}
}
