#!/usr/bin/env node
// Patches boost/container_hash/hash.hpp and RCT-Folly-prefix.pch in ios/Pods/
// if they exist (e.g. from EAS pod cache restored before npm install).
// Also patches RCTTurboModule.mm in node_modules/react-native/ to fix iOS 26 crash.
// Safe to run when files don't exist — it's a no-op.

const fs = require('fs');
const path = require('path');

const iosPodsDir = path.join(__dirname, '..', 'ios', 'Pods');
const rnDir = path.join(__dirname, '..', 'node_modules', 'react-native');

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
  {
    // iOS 26 crash fix (old architecture, newArchEnabled: false):
    // RCTNativeModule::invokeInner calls RCTFatalException on any uncaught ObjC
    // exception from a native module. RCTFatalException does @throw exception in
    // release builds, which propagates through GCD's C++ dispatch stack with no
    // outer ObjC handler and triggers objc_exception_rethrow -> abort on iOS 26.
    // Swallow the exception so invokeInner returns std::nullopt and the app
    // continues. The JS caller sees the method call complete with no result.
    file: path.join(
      rnDir,
      'React',
      'CxxModule',
      'RCTNativeModule.mm'
    ),
    check: 'RCTFatalException(exception)',
    guard: 'fix_ios26_v3',
    patch: (src) =>
      src.replace(
        '#else\n    RCTFatalException(exception);\n#endif\n  } @finally {',
        '#else\n    (void)exception; // fix_ios26_v3: swallow — RCTFatalException @throws which terminates on iOS 26\n#endif\n  } @finally {'
      ),
  },
];

for (const { file, check, guard, patch } of targets) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes(guard)) continue;
  if (check && !src.includes(check)) continue;
  const patched = patch(src);
  if (patched === src) {
    console.error('[patchBoost] ERROR: patch had no effect on', path.relative(process.cwd(), file));
    process.exit(1);
  }
  fs.writeFileSync(file, patched);
  console.log('[patchBoost] patched', path.relative(process.cwd(), file));
}
