// Only the API consumed by @next/eslint-plugin-next's get-root-dirs is exposed.
// This is not a general-purpose fast-glob replacement.
const { globSync } = require('tinyglobby');

exports.globSync = (patterns, options = {}) => {
  // Root globs come from lint configuration. Reject pathological nesting before
  // a matcher can spend excessive CPU or recurse; normal roots need few braces.
  for (const pattern of Array.isArray(patterns) ? patterns : [patterns]) {
    let depth = 0, escaped = false;
    for (const char of pattern) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '{' && ++depth > 32) {
        const error = new RangeError('ESLint root glob exceeds 32 nested braces');
        error.code = 'ERR_NOMADE_GLOB_DEPTH';
        throw error;
      }
      if (char === '}') depth = Math.max(0, depth - 1);
    }
  }
  return globSync(patterns, {
    ...options,
    // Required for fast-glob semantics; do not recursively expand literal roots.
    // https://superchupu.dev/tinyglobby/migration#expanddirectories
    expandDirectories: false,
  });
};
