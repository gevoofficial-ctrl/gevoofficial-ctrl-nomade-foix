# Next ESLint glob dependency override

The Next ESLint plugin 16.3.8 uses `fast-glob` only through `globSync(pattern,
{ onlyDirectories: true })` in `dist/utils/get-root-dirs.js`. Its transitive
`micromatch -> braces@3.0.3` dependency is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
On 2026-10-21 the advisory still lists no patched braces release; updating the
plugin to the current stable release also retains fast-glob.

`package.json` therefore scopes an npm override to **this plugin only**:
`fast-glob` resolves to `tools/next-eslint-glob`, a small checked-in adapter over
the official npm `tinyglobby@0.2.17` package. This removes
braces and micromatch from the installed/locked tree, rather than suppressing
audit findings, disabling lint rules, patching node_modules or downgrading Next.
The direct dev-only `fast-glob` file dependency and scoped `$fast-glob` override
preserve the import name used by the plugin. `.npmrc` sets `install-links=true`
so npm packs the adapter as an ordinary dependency instead of a relative
symlink. This also supports the hosting platform's external node_modules path.

[tinyglobby](https://superchupu.dev/tinyglobby) provides the required `globSync`
and `onlyDirectories` API. The adapter explicitly disables `expandDirectories`
as required by the [migration guide](https://superchupu.dev/tinyglobby/migration)
to preserve fast-glob's literal directory semantics. This is not a claim of complete fast-glob API parity;
compatibility is verified for the plugin's actual consumer, including literal,
glob and brace roots, arrays, directory filtering and enabled Core Web Vitals
rules. Existing uses of tinyglobby elsewhere in the toolchain are unaffected.

Run after a clean installation and whenever upgrading the Next ESLint plugin:

```sh
npm ci --include=dev
npm run test:lint-dependencies
npm run lint
npm run build
npm audit
```

The adapter rejects patterns deeper than 32 unescaped nested braces before
calling the matcher. This avoids both stack exhaustion and excessive matcher
CPU for pathological configuration input. Ordinary brace alternatives remain
supported. The regression test checks this fail-fast behavior in an isolated
process, as well as the absence of braces/micromatch in the lockfile.
If the plugin adds other fast-glob API
usage, re-evaluate this override before upgrading. Remove the override when an
upstream compatible release no longer needs the vulnerable dependency chain.

No runtime Next/React versions, menu data, orders, booking settings or website
features are changed by this mitigation.
