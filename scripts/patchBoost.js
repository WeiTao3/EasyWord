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
    // iOS 26 crash fix: convertNSExceptionToJSError corrupts Hermes memory on iOS 26,
    // causing abort() via objc_exception_rethrow. Re-throwing the original ObjC exception
    // lets the native runtime handle it gracefully instead.
    file: path.join(
      rnDir,
      'ReactCommon',
      'react',
      'nativemodule',
      'core',
      'platform',
      'ios',
      'ReactCommon',
      'RCTTurboModule.mm'
    ),
    check: 'convertNSExceptionToJSError',
    guard: 'fix_ios26_v2',
    patch: (src) =>
      src.replace(
        '      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);\n    } @finally {',
        '      (void)exception; // fix_ios26_v2: swallow — both @throw and convertNSExceptionToJSError\n      // call objc_exception_rethrow which terminates in GCD\'s C++ stack on iOS 26.\n    } @finally {'
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
