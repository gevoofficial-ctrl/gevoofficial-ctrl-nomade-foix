import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const app=path.resolve(process.argv[2]||'.');
const destination=process.argv[3]&&path.resolve(process.argv[3]);
if(!destination || destination==='/' || destination===os.homedir() || destination===app || destination.startsWith(app+'/') || app.startsWith(destination+'/'))throw new Error('Use a dedicated private backup directory outside the application');
await fs.mkdir(destination,{recursive:true,mode:0o700});
await fs.chmod(destination,0o700);
const marker=path.join(destination,'.nomade-runtime-backups');
try {await fs.writeFile(marker,'NOMADE_RUNTIME_BACKUPS_V1\n',{flag:'wx',mode:0o600});}
catch(error){if(error.code!=='EEXIST')throw error;if((await fs.readFile(marker,'utf8'))!=='NOMADE_RUNTIME_BACKUPS_V1\n')throw new Error('Backup directory marker mismatch');}

async function hashes(root,prefix='') {
  const entries={};
  for(const item of await fs.readdir(path.join(root,prefix),{withFileTypes:true})) {
    const relative=path.posix.join(prefix,item.name);
    if(item.isDirectory())Object.assign(entries,await hashes(root,relative));
    else if(item.isFile() && relative!=='manifest.json')entries[relative]=createHash('sha256').update(await fs.readFile(path.join(root,relative))).digest('hex');
    else if(!item.isFile())throw new Error('Unsupported snapshot entry');
  }
  return entries;
}
async function verify(archive) {
  const names=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).split('\n').filter(Boolean);
  if(names.some(name=>name.startsWith('/') || name.split('/').includes('..')))throw new Error('Unsafe archive path');
  const restored=await fs.mkdtemp(path.join(destination,'.restore-'));
  try {
    execFileSync('tar',['-xzf',archive,'--no-same-owner','-C',restored]);
    const manifest=JSON.parse(await fs.readFile(path.join(restored,'manifest.json'),'utf8'));
    const actual=await hashes(restored);
    if(Object.keys(actual).length!==Object.keys(manifest.files).length || Object.entries(manifest.files).some(([name,hash])=>actual[name]!==hash))throw new Error('Restored backup checksum mismatch');
    JSON.parse(await fs.readFile(path.join(restored,'data','menu.json'),'utf8'));
    try {JSON.parse(await fs.readFile(path.join(restored,'data','dejeuner-orders.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
    return Object.keys(actual).length;
  } finally {await fs.rm(restored,{recursive:true,force:true});}
}
const archivePattern=/^nomade-runtime-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.tar\.gz$/;
const archives=async()=>(await fs.readdir(destination)).filter(name=>archivePattern.test(name)).sort().reverse();
if(process.argv.includes('--verify-latest')) {
  const latest=(await archives())[0];
  if(!latest)throw new Error('No runtime backup found');
  console.log('RESTORE_VERIFIED',latest,'files',await verify(path.join(destination,latest)));
} else {
  const snapshot=await fs.mkdtemp(path.join(destination,'.snapshot-'));
  const filename=`nomade-runtime-${new Date().toISOString().replaceAll(':','-').replace('.','-')}.tar.gz`;
  const temporary=path.join(destination,filename+'.tmp');
  try {
    await fs.cp(path.join(app,'data'),path.join(snapshot,'data'),{recursive:true,filter:async source=>!source.endsWith('.lock')&&!source.endsWith('.tmp')&&!(await fs.lstat(source)).isSymbolicLink()});
    for(const name of ['.htaccess','.env','.env.local','.env.production','.env.production.local']) {
      try {await fs.copyFile(path.join(app,name),path.join(snapshot,name));}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
    let commit=null;
    try {commit=execFileSync('git',['-C',app,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
    await fs.writeFile(path.join(snapshot,'manifest.json'),JSON.stringify({version:1,createdAt:new Date().toISOString(),commit,files:await hashes(snapshot)})+'\n',{mode:0o600});
    execFileSync('tar',['-czf',temporary,'-C',snapshot,'.']);
    await fs.chmod(temporary,0o600);
    const count=await verify(temporary);
    await fs.rename(temporary,path.join(destination,filename));
    // Rotate only archives created by this script in its marked private directory.
    for(const old of (await archives()).slice(30))await fs.unlink(path.join(destination,old));
    console.log('BACKUP_AND_RESTORE_VERIFIED',filename,'files',count);
  } finally {await fs.rm(snapshot,{recursive:true,force:true});await fs.rm(temporary,{force:true});}
}
