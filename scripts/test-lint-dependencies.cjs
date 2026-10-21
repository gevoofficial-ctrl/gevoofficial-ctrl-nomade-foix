// Local temporary fixtures only; no website data, network calls or form submissions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
const replacementPath = pluginRequire.resolve('fast-glob');
const { getRootDirs } = pluginRequire('./utils/get-root-dirs');
const normalized = dirs => dirs.map(dir => path.resolve(dir)).sort();

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nomade-lint-deps-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const name of ['one', 'two']) {
    fs.mkdirSync(path.join(dir, 'packages', name, 'pages'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'packages', name, 'pages', 'news.js'), 'export default function News() {}');
  }
  fs.writeFileSync(path.join(dir, 'packages', 'not-a-directory.txt'), 'fixture');
  return dir;
}

test('lockfile removes braces/micromatch and limits the pinned replacement to the Next ESLint plugin', () => {
  const pkg = require('../package.json');
  const lock = require('../package-lock.json');
  assert.equal(pkg.devDependencies['fast-glob'], 'file:tools/next-eslint-glob');
  assert.deepEqual(pkg.overrides, { '@next/eslint-plugin-next': { 'fast-glob': '$fast-glob' } });
  assert.ok(!Object.keys(lock.packages).some(key => /node_modules\/(braces|micromatch)$/.test(key)));
  const resolved = pluginRequire('fast-glob/package.json');
  assert.equal(resolved.name, '@nomade/next-eslint-glob');
  assert.equal(resolved.version, require('../tools/next-eslint-glob/package.json').version);
  assert.equal(resolved.version, lock.packages['node_modules/fast-glob'].version);
  assert.equal(resolved.dependencies.tinyglobby, '0.2.17');
  assert.equal(typeof pluginRequire('fast-glob').globSync, 'function');
});

test('Next root discovery supports default cwd, literal/glob/brace roots, arrays and directory-only results', t => {
  const dir = fixture(t);
  const one = path.join(dir, 'packages', 'one');
  const two = path.join(dir, 'packages', 'two');
  const discover = rootDir => normalized(getRootDirs({ cwd: dir, settings: { next: { rootDir } } }));
  assert.deepEqual(discover(undefined), [dir]);
  assert.deepEqual(discover(one), [one]);
  assert.deepEqual(discover(`${dir}/packages/*`), [one, two]);
  assert.deepEqual(discover(`${dir}/packages/{one,two}`), [one, two]);
  assert.deepEqual(discover([one, two, null]), [one, two]);
  assert.deepEqual(discover(`${dir}/missing/*`), []);
});

test('Core Web Vitals rules stay active and catch internal HTML links through literal and glob roots', async t => {
  const dir = fixture(t);
  const { ESLint } = require('eslint');
  for (const rootDir of [path.join(dir, 'packages', 'one'), `${dir}/packages/*`]) {
    const eslint = new ESLint({ cwd: root, overrideConfig: { settings: { next: { rootDir } } } });
    const filePath = path.join(root, 'app', 'lint-dependency-fixture.tsx');
    const config = await eslint.calculateConfigForFile(filePath);
    assert.notEqual(config.rules['@next/next/no-html-link-for-pages'][0], 0);
    assert.notEqual(config.rules['@next/next/no-img-element'][0], 0);
    const [bad] = await eslint.lintText('export default function Page() { return <a href="/news">News</a>; }', { filePath });
    assert.ok(bad.messages.some(message => message.ruleId === '@next/next/no-html-link-for-pages'));
    const [good] = await eslint.lintText('import Link from "next/link"; export default function Page() { return <Link href="/news">News</Link>; }', { filePath });
    assert.equal(good.errorCount, 0);
    assert.equal(good.warningCount, 0);
  }
});

test('deep brace input is rejected before matching, without stack exhaustion or excessive CPU', t => {
  const dir = fixture(t);
  const result = spawnSync(process.execPath, ['-e', `
    const { globSync } = require(${JSON.stringify(replacementPath)});
    const assert = require('node:assert/strict');
    const pattern = '{'.repeat(10000) + 'nomade' + '}'.repeat(10000);
    assert.throws(() => globSync(pattern, { cwd: ${JSON.stringify(dir)}, onlyDirectories: true }), { code: 'ERR_NOMADE_GLOB_DEPTH' });
    assert.throws(() => globSync([pattern], { cwd: ${JSON.stringify(dir)}, onlyDirectories: true }), { code: 'ERR_NOMADE_GLOB_DEPTH' });
    assert.doesNotThrow(() => globSync('packages/{one,two}', { cwd: ${JSON.stringify(dir)}, onlyDirectories: true }));
  `], { encoding: 'utf8', timeout: 5000, maxBuffer: 65536 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
