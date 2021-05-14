const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const rootdir = 'pkg';

// assumes src and dst are directories
// copyDirSync('/a/b/c', 'd/e/f') results in d/e/f/c
function copyDirSync(src, dst) {
  const dirname = path.basename(src);
  return fs.copySync(src, path.join(dst, dirname));
}

function prepareESM() {
  const pkgdir = path.join(rootdir, 'esm');
  fs.ensureDirSync(pkgdir);

  copyDirSync('./Utilities', pkgdir);

  // make ESM exports available at top-level
  fs.copySync('./dist/esm', pkgdir);

  // copy typescript defs
  for (const entry of glob.sync('Sources/**/*.ts')) {
    let target = entry.replace(/^Sources\//, '');
    if (path.basename(entry) === 'index.d.ts') {
      const parentName = path.dirname(path.dirname(target));
      const moduleName = path.basename(path.dirname(target));
      target = path.join(parentName, `${moduleName}.d.ts`);
    }
    fs.copyFileSync(entry, path.join(pkgdir, target));
  }

  // copy misc files
  for (const entry of [
    ...glob.sync('*.txt'),
    ...glob.sync('*.md'),
    'LICENSE',
    'package.json',
    '.npmignore',
  ]) {
    fs.copyFileSync(entry, path.join(pkgdir, entry));
  }

  // modify package.json
  const packageJson = path.join(pkgdir, 'package.json');
  const pkgInfo = JSON.parse(
    fs.readFileSync(packageJson, { encoding: 'utf8' })
  );

  pkgInfo.name = '@kitware/vtk.js';
  pkgInfo.main = './index.js';
  pkgInfo.module = './index.js';

  fs.writeFileSync(packageJson, JSON.stringify(pkgInfo, null, 2));
}

function prepareUMD() {
  const pkgdir = path.join(rootdir, 'umd');
  fs.ensureDirSync(pkgdir);

  copyDirSync('./Sources', pkgdir);
  copyDirSync('./Utilities', pkgdir);

  fs.copySync('./dist/umd', pkgdir);

  // copy misc files
  for (const entry of [
    ...glob.sync('*.txt'),
    ...glob.sync('*.md'),
    'LICENSE',
    'package.json',
    '.npmignore',
  ]) {
    fs.copyFileSync(entry, path.join(pkgdir, entry));
  }

  // modify package.json
  const packageJson = path.join(pkgdir, 'package.json');
  const pkgInfo = JSON.parse(
    fs.readFileSync(packageJson, { encoding: 'utf8' })
  );

  pkgInfo.name = 'vtk.js';
  pkgInfo.main = './vtk.js';
  delete pkgInfo.module;

  fs.writeFileSync(packageJson, JSON.stringify(pkgInfo, null, 2));
}

fs.removeSync(rootdir);
fs.ensureDirSync(rootdir);

prepareESM();
prepareUMD();
