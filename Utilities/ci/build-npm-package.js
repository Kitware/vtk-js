const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// assumes src and dst are directories
// copyDirSync('/a/b/c', 'd/e/f') results in d/e/f/c
function copyDirSync(src, dst) {
  const dirname = path.basename(src);
  return fs.copySync(src, path.join(dst, dirname));
}
const pkgdir = 'pkg';

fs.removeSync(pkgdir);
fs.ensureDirSync(pkgdir);

copyDirSync('./Sources', pkgdir);
copyDirSync('./Utilities', pkgdir);
copyDirSync('./dist', pkgdir);

// make ESM exports available at top-level
fs.copySync('./dist/esm', pkgdir);

for (const entry of [
  ...glob.sync('*.txt'),
  ...glob.sync('*.md'),
  'LICENSE',
  'package.json',
]) {
  fs.copyFileSync(entry, path.join(pkgdir, entry));
}
