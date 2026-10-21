import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const windowMs=15*60_000;
type Buckets=Record<string,number[]>;

/** Shared on disk so Passenger workers and restarts use the same sliding window. */
export async function checkLunchRateLimit(file:string, ip:string, email:string, now=Date.now()) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  let lock:fs.FileHandle|undefined;
  for(let i=0;i<100;i++) {
    try {lock=await fs.open(`${file}.lock`,'wx',0o600);break;}
    catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;await new Promise(resolve=>setTimeout(resolve,30));}
  }
  if(!lock)throw new Error('Rate limiter busy');
  try {
    let buckets:Buckets={};
    try {
      const state=JSON.parse(await fs.readFile(file,'utf8'));
      if(state.version!==1 || !state.buckets || typeof state.buckets!=='object' || Array.isArray(state.buckets))throw new Error('Invalid rate state');
      buckets=state.buckets;
    } catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    for(const [key,times] of Object.entries(buckets)) {
      if(!Array.isArray(times)||times.some(time=>!Number.isFinite(time)))throw new Error('Invalid rate bucket');
      const recent=times.filter(time=>time>now-windowMs);
      if(recent.length)buckets[key]=recent;else delete buckets[key];
    }
    const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
    const limits=[{key:hash(`ip:${ip}`),max:10},{key:hash(`email:${email.toLowerCase()}`),max:3}];
    let retryAfter=0;
    for(const {key,max} of limits) {
      const times=buckets[key]||[];
      if(times.length>=max)retryAfter=Math.max(retryAfter,Math.ceil((times[0]+windowMs-now)/1000));
    }
    if(retryAfter)return {allowed:false,retryAfter};
    // Bound storage without discarding active limits under an abuse burst.
    if(Object.keys(buckets).length>10_000)return {allowed:false,retryAfter:900};
    for(const {key} of limits)(buckets[key] ||= []).push(now);
    const temp=`${file}.${randomUUID()}.tmp`;
    try {await fs.writeFile(temp,JSON.stringify({version:1,buckets})+'\n',{mode:0o600});await fs.rename(temp,file);}
    finally {await fs.rm(temp,{force:true});}
    return {allowed:true,retryAfter:0};
  } finally {await lock.close();await fs.rm(`${file}.lock`,{force:true});}
}
