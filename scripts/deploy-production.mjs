// Run manually from the cPanel terminal after activating its Node environment.
// Build outside the serving directory; never restore runtime data from Git.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';

const root=path.resolve(process.argv[2]||'.'), target=process.argv[3];
if(!/^[a-f0-9]{40}$/.test(target||''))throw new Error('Supply the reviewed full commit SHA');
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const before=git('rev-parse','HEAD');
git('merge-base','--is-ancestor',target,'origin/main');
if(git('diff','--cached','--name-only'))throw new Error('Staged server changes need review');
const protectedPath=name=>name==='.htaccess'||name.startsWith('.env')||['data','node_modules','.next','tmp','nomade-src'].some(prefix=>name===prefix||name.startsWith(prefix+'/'));
const changes=git('diff','--name-only',before,target).split('\n').filter(Boolean);
if(!changes.length)throw new Error('This commit is already deployed');
if(changes.some(protectedPath))throw new Error('Commit changes protected server paths; deploy those separately after review');
if(git('diff','--name-only').split('\n').filter(Boolean).some(name=>!protectedPath(name)))throw new Error('Unexpected source changes on server');
const existingPaths=git('ls-tree','-r','--name-only',before,'--',...changes).split('\n');
for(const name of changes.filter(name=>!existingPaths.includes(name))){
  try{await fs.lstat(path.join(root,name));throw new Error(`New source path already exists on server: ${name}`);}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
if(!(await fs.lstat(path.join(root,'node_modules'))).isSymbolicLink())throw new Error('Expected cPanel node_modules symlink');
const modules=await fs.realpath(path.join(root,'node_modules'));
const parent=path.resolve(process.argv[4]||path.join(os.homedir(),'.nomade-deployments'));
if(parent===root||parent.startsWith(root+path.sep))throw new Error('Deployments must be private and outside the web root');
await fs.mkdir(parent,{recursive:true,mode:0o700});await fs.chmod(parent,0o700);
const release=await fs.mkdtemp(path.join(parent,target.slice(0,10)+'-'));
const stage=path.join(release,'stage'), backup=path.join(release,'backup');
await fs.mkdir(stage,{mode:0o700});await fs.mkdir(backup,{mode:0o700});
await fs.mkdir(path.join(root,'tmp'),{recursive:true});
const lockPath=path.join(root,'tmp','nomade-deploy.lock');
const lock=await fs.open(lockPath,'wx',0o600);
let modulesMoved=false, buildMoved=false, sourceTouched=false;
let probe;
let expectedScripts=[];
const run=(file,args,cwd=stage)=>new Promise((resolve,reject)=>{
  const child=spawn(file,args,{cwd,env:{...process.env,NODE_ENV:'development'},stdio:'inherit'});
  child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${file} failed (${code})`)));
});
const archive=(sha,destination)=>{
  const bytes=execFileSync('git',['-C',root,'archive','--format=tar',sha],{maxBuffer:128*1024*1024});
  execFileSync('tar',['-xf','-','-C',destination],{input:bytes});
};
async function exists(file){try{await fs.stat(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
async function check(base,withAvailability){
  for(const route of ['/fr','/en/dejeuner','/es/dejeuner']){
    const response=await fetch(base+route,{signal:AbortSignal.timeout(20000)});
    const html=await response.text();
    if(response.status!==200||!html.includes('NOMADE'))throw new Error(`Page health failed: ${route}`);
    if(route==='/fr'){
      const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1]).filter(src=>src.startsWith('/_next/static/'));
      if(!scripts.length)throw new Error('No application scripts in health response');
      if(!withAvailability)expectedScripts=scripts;
      else if(expectedScripts.some(src=>!scripts.includes(src)))throw new Error('Passenger is not serving the prepared build yet');
    }
  }
  const response=await fetch(base+'/api/dejeuner?lang=fr'+(withAvailability?'':'&availability=separate'),{signal:AbortSignal.timeout(25000)});
  if(response.status!==200)throw new Error('Lunch API health failed');
  const body=await response.json();
  if(!Array.isArray(body.dishes)||!Array.isArray(body.drinks)||!Array.isArray(body.closedDates)||body.pickupSlots?.length!==13||body.pickupSlots[0]!=='12:00'||body.pickupSlots.at(-1)!=='14:00')throw new Error('Unexpected lunch API response');
}
async function checkTwice(base,availability){
  try{await check(base,availability);}catch{await new Promise(resolve=>setTimeout(resolve,2000));await check(base,availability);}
}
async function restart(){await fs.writeFile(path.join(root,'tmp','restart.txt'),new Date().toISOString());}
try{
  console.log('BACKUP',before,'private release',release);
  archive(before,backup);
  await run(process.execPath,[path.join(root,'scripts/backup-runtime.mjs'),root,path.join(backup,'runtime')],root);
  await fs.writeFile(path.join(backup,'commit.txt'),before+'\n',{mode:0o600});
  archive(target,stage);
  await fs.rm(path.join(stage,'data'),{recursive:true}); // only the new Git archive's stale fixture
  await fs.symlink(path.join(root,'data'),path.join(stage,'data'),'dir');
  console.log('PREPARE dependencies and build; production continues serving its old build');
  await run('npm',['ci','--include=dev','--no-fund']);
  await run('npm',['run','build']);
  const probePort=3137;
  probe=spawn(process.execPath,[path.join(stage,'node_modules/next/dist/bin/next'),'start',stage,'--hostname','127.0.0.1','--port',String(probePort)],{cwd:stage,env:{...process.env,NODE_ENV:'production'},stdio:'ignore'});
  await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,1500);probe.once('error',error=>{clearTimeout(timer);reject(error);});});
  if(probe.exitCode!==null)throw new Error('Prepared application did not start');
  await checkTwice(`http://127.0.0.1:${probePort}`,false);
  probe.kill();probe=undefined;
  // Keep previous immutable chunks for visitors with an already-open page.
  execFileSync('rsync',['-a','--ignore-existing',path.join(root,'.next/static/'),path.join(stage,'.next/static/')]);
  console.log('ACTIVATE',target);
  sourceTouched=true;
  git('restore','--source',target,'--worktree','--',...changes);
  await fs.rename(modules,path.join(backup,'previous-node_modules'));modulesMoved=true;
  await fs.rename(path.join(stage,'node_modules'),modules);
  await fs.rename(path.join(root,'.next'),path.join(backup,'previous-build'));buildMoved=true;
  await fs.rename(path.join(stage,'.next'),path.join(root,'.next'));
  git('reset','--mixed',target); // updates the index/HEAD only; preserves menu and Passenger files
  await restart();
  await checkTwice('https://www.nomade-foix.fr',true);
  console.log('DEPLOY_VERIFIED',git('rev-parse','HEAD'),'rollback directory',backup);
}catch(error){
  console.error('DEPLOY_FAILED',error.message);
  if(probe)probe.kill();
  if(sourceTouched){
    if(buildMoved){
      if(await exists(path.join(root,'.next')))await fs.rename(path.join(root,'.next'),path.join(release,'failed-build'));
      await fs.rename(path.join(backup,'previous-build'),path.join(root,'.next'));
    }
    if(modulesMoved){
      if(await exists(modules))await fs.rename(modules,path.join(release,'failed-node_modules'));
      await fs.rename(path.join(backup,'previous-node_modules'),modules);
    }
    const previousFiles=git('ls-tree','-r','--name-only',before,'--',...changes).split('\n').filter(Boolean);
    if(previousFiles.length)git('restore','--source',before,'--worktree','--',...previousFiles);
    for(const name of changes.filter(name=>!previousFiles.includes(name)))await fs.rm(path.join(root,name),{force:true});
    git('reset','--mixed',before);
    await restart();
    expectedScripts=[];
    await checkTwice('https://www.nomade-foix.fr',true);
    console.error('ROLLBACK_VERIFIED',before);
  }else console.error('PREPARATION_FAILED: serving build and dependencies were not changed');
  process.exitCode=1;
}finally{
  if(probe)probe.kill();
  await lock.close();await fs.unlink(lockPath);
}
