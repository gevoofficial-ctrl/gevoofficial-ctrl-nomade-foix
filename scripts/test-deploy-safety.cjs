const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'deploy-production.mjs');
function fixture(t){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nomade-deploy-test-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const root=path.join(temp,'app');fs.mkdirSync(root);const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Isolated deploy fixture');
  fs.mkdirSync(path.join(root,'data'));fs.writeFileSync(path.join(root,'data/menu.json'),'[]\n');
  fs.mkdirSync(path.join(root,'scripts'));fs.copyFileSync(path.join(__dirname,'backup-runtime.mjs'),path.join(root,'scripts/backup-runtime.mjs'));
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'isolated-nomade-deploy',version:'1.0.0',scripts:{build:'node -e "process.exit(23)"'}}));
  fs.writeFileSync(path.join(root,'package-lock.json'),JSON.stringify({name:'isolated-nomade-deploy',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'isolated-nomade-deploy',version:'1.0.0'}}}));
  fs.writeFileSync(path.join(root,'code.txt'),'old version');git('add','.');git('commit','-qm','old');const before=git('rev-parse','HEAD');
  const modules=path.join(temp,'modules');fs.mkdirSync(modules);fs.writeFileSync(path.join(modules,'keep.txt'),'running dependencies');fs.symlinkSync(modules,path.join(root,'node_modules'));
  fs.mkdirSync(path.join(root,'.next'));fs.writeFileSync(path.join(root,'.next/keep.txt'),'running build');
  return {root,git,before,modules,temp,run:target=>spawnSync(process.execPath,[script,root,target||git('rev-parse','HEAD'),path.join(temp,'private-backups')],{encoding:'utf8',env:{...process.env,npm_config_cache:path.join(temp,'npm-cache')},timeout:30000})};
}
test('deploy refuses a commit modifying live menu before any dependency/build changes',t=>{
  const q=fixture(t);fs.writeFileSync(path.join(q.root,'data/menu.json'),'[{"id":"stale-git-menu"}]');q.git('add','data/menu.json');q.git('commit','-qm','unsafe menu');q.git('update-ref','refs/remotes/origin/main',q.git('rev-parse','HEAD'));
  const target=q.git('rev-parse','HEAD');q.git('checkout','--detach',q.before);const result=q.run(target);assert.notEqual(result.status,0);assert.match(result.stderr,/protected server paths/);
  assert.equal(fs.readFileSync(path.join(q.modules,'keep.txt'),'utf8'),'running dependencies');
  assert.equal(fs.readFileSync(path.join(q.root,'.next/keep.txt'),'utf8'),'running build');
});
test('failed preparation preserves live build, dependencies, admin menu, orders and HEAD',t=>{
  const q=fixture(t);fs.writeFileSync(path.join(q.root,'code.txt'),'candidate');q.git('add','code.txt');q.git('commit','-qm','candidate');const candidate=q.git('rev-parse','HEAD');q.git('update-ref','refs/remotes/origin/main',candidate);q.git('checkout','--detach',q.before);
  fs.writeFileSync(path.join(q.root,'data/menu.json'),'[{"id":"edited-in-admin"}]');fs.writeFileSync(path.join(q.root,'data/dejeuner-orders.json'),'{"nextNumber":72,"idempotency":{}}');
  const result=spawnSync(process.execPath,[script,q.root,candidate,path.join(q.temp,'private-backups')],{encoding:'utf8',env:{...process.env,npm_config_cache:path.join(q.temp,'npm-cache')},timeout:30000});
  assert.notEqual(result.status,0);assert.match(result.stderr,/PREPARATION_FAILED/);assert.match(result.stdout,/BACKUP_AND_RESTORE_VERIFIED/);
  assert.equal(q.git('rev-parse','HEAD'),q.before);assert.equal(fs.readFileSync(path.join(q.root,'code.txt'),'utf8'),'old version');
  assert.equal(fs.readFileSync(path.join(q.root,'data/menu.json'),'utf8'),'[{"id":"edited-in-admin"}]');assert.equal(JSON.parse(fs.readFileSync(path.join(q.root,'data/dejeuner-orders.json'))).nextNumber,72);
  assert.equal(fs.readFileSync(path.join(q.modules,'keep.txt'),'utf8'),'running dependencies');assert.equal(fs.readFileSync(path.join(q.root,'.next/keep.txt'),'utf8'),'running build');
  assert.equal(fs.existsSync(path.join(q.root,'tmp/nomade-deploy.lock')),false);
});
