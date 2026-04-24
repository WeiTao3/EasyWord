const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Fixes "no template named 'unary_function' in namespace 'std'" (Xcode 15+/C++17).
//
// Critical: inject AFTER expo_patch_react_imports!(installer) so that
// react_native_post_install and expo_patch_react_imports! cannot overwrite our patches.
//
// Two fixes applied in the post_install hook:
//   1. Regex-gsub boost/container_hash/hash.hpp to remove the unary_function base class
//      (regex handles single-line AND multi-line struct definitions across boost versions)
//   2. Prepend #define _LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION to
//      RCT-Folly-prefix.pch which is force-included (-include flag) in every
//      RCT-Folly compile unit, re-enabling std::unary_function in libc++

module.exports = function withCxxFlags(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      console.log('[withCxxFlags] plugin running — will inject fix_cxx17_v4');
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes('fix_cxx17_v4')) {
        console.log('[withCxxFlags] fix_cxx17_v4 already present, skipping');
        return config;
      }

      // Ruby code injected into Podfile (escaped for JS template literal)
      const injection = `

  # fix_cxx17_v4 — runs after react_native_post_install & expo_patch_react_imports!
  begin
    sb = installer.sandbox.root.to_s

    # Fix 1: gsub boost/container_hash/hash.hpp (regex handles multi-line struct too)
    bh = File.join(sb, 'boost', 'boost', 'container_hash', 'hash.hpp')
    if File.exist?(bh)
      src = File.read(bh)
      if src.include?('unary_function') && !src.include?('fix_cxx17_v4')
        patched = src.gsub(/struct hash_base[^;]*std::unary_function[^;]*;/, 'struct hash_base {};')
        File.write(bh, "// fix_cxx17_v4\\n" + patched)
        puts "[fix_cxx17] patched boost hash.hpp"
      end
    else
      puts "[fix_cxx17] WARN: boost hash.hpp not found at \#{bh}"
    end

    # Fix 2: prepend define to RCT-Folly force-include prefix header
    pch = File.join(sb, 'Target Support Files', 'RCT-Folly', 'RCT-Folly-prefix.pch')
    if File.exist?(pch)
      src = File.read(pch)
      unless src.include?('fix_cxx17_v4')
        File.write(pch, "// fix_cxx17_v4\\n#define _LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION\\n" + src)
        puts "[fix_cxx17] patched RCT-Folly-prefix.pch"
      end
    else
      puts "[fix_cxx17] WARN: RCT-Folly-prefix.pch not found at \#{pch}"
    end
  rescue => e
    puts "[fix_cxx17] ERROR: \#{e.message}"
    puts e.backtrace.first(3).join("\\n")
  end`;

      // Inject AFTER expo_patch_react_imports!(installer) so react_native_post_install
      // cannot overwrite our changes. Fall back to beginning if anchor not found.
      const anchor = 'expo_patch_react_imports!(installer)';
      if (podfile.includes(anchor)) {
        podfile = podfile.replace(anchor, anchor + injection);
      } else {
        // Fallback: inject at beginning of post_install block
        const postInstallRegex = /(post_install do \|installer\|)/;
        if (postInstallRegex.test(podfile)) {
          podfile = podfile.replace(postInstallRegex, `$1${injection}`);
        } else {
          podfile += `\npost_install do |installer|${injection}\nend\n`;
        }
      }

      fs.writeFileSync(podfilePath, podfile);
      console.log('[withCxxFlags] Podfile written with fix_cxx17_v4 injection');
      return config;
    },
  ]);
};
