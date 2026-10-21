// Only the API consumed by @next/eslint-plugin-next's get-root-dirs is exposed.
// This is not a general-purpose fast-glob replacement.
const { globSync } = require('tinyglobby');

exports.globSync = (patterns, options = {}) => globSync(patterns, {
  ...options,
  // Required for fast-glob semantics; do not recursively expand literal roots.
  // https://superchupu.dev/tinyglobby/migration#expanddirectories
  expandDirectories: false,
});
