#!/usr/bin/env node
// Patches boost/container_hash/hash.hpp and RCT-Folly-prefix.pch in ios/Pods/
// if they exist (e.g. from EAS pod cache restored before npm install).
// Safe to run when files don't exist — it's a no-op.

const fs = require('fs');
const path = require('path');

const iosPodsDir = path.join(__dirname, '..', 'ios', 'Pods');

const targets = [
  {
    file: path.join(iosPodsDir, 'boost', 'boost', 'container_hash', 'hash.hpp'),
    check: 'unary_function',
    guard: 'fix_cxx17_v4',
    patch: (src) => {
      const replaced = src.replace(
        /struct hash_base[^;]*std::unary_function[^;]*;/s,
        'struct hash_base {};'
      );
      return '// fix_cxx17_v4\n' + replaced;
    },
  },
  {
    file: path.join(
      iosPodsDir,
      'Target Support Files',
      'RCT-Folly',
      'RCT-Folly-prefix.pch'
    ),
    check: null,
    guard: 'fix_cxx17_v4',
    patch: (src) =>
      '// fix_cxx17_v4\n#define _LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION\n' + src,
  },
];

for (const { file, check, guard, patch } of targets) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes(guard)) continue;
  if (check && !src.includes(check)) continue;
  fs.writeFileSync(file, patch(src));
  console.log('[patchBoost] patched', path.relative(process.cwd(), file));
}
