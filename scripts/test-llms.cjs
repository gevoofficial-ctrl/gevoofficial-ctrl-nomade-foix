// Static regression tests; the optional origin argument enables GET-only live checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'llms.txt'), 'utf8');
const origin = 'https://www.nomade-foix.fr';
const links = [...source.matchAll(/^- \[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)(?::[^\n]*)?$/gm)];
const publishedOrigin = process.argv[2]?.replace(/\/$/, '');

test('llms.txt has one H1, a summary and parseable Markdown file lists', () => {
  assert.match(source, /^# NOMADE[^\n]+\n\n> .+\n/);
  assert.equal((source.match(/^# /gm) || []).length, 1);
  assert.equal(links.length, 19);
  const sections = source.split(/^## .+$/m).slice(1);
  assert.ok(sections.length > 0);
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    assert.ok(lines.length > 0);
    for (const line of lines) assert.match(line, /^- \[[^\]]+\]\(https:\/\/[^\s)]+\)(?:: .+)?$/);
  }
  assert.doesNotMatch(source, /(?:^|\s)https?:\/\//m, 'URLs must be Markdown links, not bare addresses');
});

test('all 18 localized public pages, including takeaway lunch, have unique canonical links', () => {
  const urls = links.map(match => new URL(match[2]));
  assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
  const siteLinks = urls.filter(url => url.origin === origin);
  assert.equal(siteLinks.length, 18);
  for (const lang of ['fr', 'en', 'es']) {
    for (const suffix of ['', '/carte', '/dejeuner', '/allergenes', '/confidentialite', '/mentions-legales']) {
      assert.ok(siteLinks.some(url => url.pathname === `/${lang}${suffix}`), `Missing ${lang}${suffix}`);
    }
  }
  for (const url of urls) {
    assert.equal(url.search, '');
    assert.equal(url.hash, '');
    assert.ok(!url.pathname.includes('/admin') && !url.pathname.includes('/api/'));
  }
});

test('published llms.txt matches source and every linked site page responds successfully', { skip: !publishedOrigin }, async () => {
  const response = await fetch(`${publishedOrigin}/llms.txt`, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^text\/(plain|markdown)/);
  assert.equal((await response.text()).replaceAll('\r\n', '\n'), source);
  for (const [, , href] of links) {
    const url = new URL(href);
    if (url.origin !== origin) continue;
    const page = await fetch(`${publishedOrigin}${url.pathname}`, { signal: AbortSignal.timeout(20000) });
    assert.equal(page.status, 200, url.pathname);
    const html = await page.text();
    assert.ok(html.includes(`href="${url.href}"`), `Missing canonical ${url.href}`);
  }
});
