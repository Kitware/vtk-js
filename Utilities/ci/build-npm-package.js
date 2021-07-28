const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const importRegex = /(?:import|from) ['"]([^'"]*)['"]/g;
const rootdir = 'pkg';

// assumes src and dst are directories
// copyDirSync('/a/b/c', 'd/e/f') results in d/e/f/c
function copyDirSync(src, dst) {
  const dirname = path.basename(src);
  return fs.copySync(src, path.join(dst, dirname));
}

function applyMacroShim(srcRoot) {
  fs.copySync(path.join('Utilities', 'ci', 'macro-shim.js'), path.join(srcRoot, 'macro.js'));
  fs.copySync(path.join('Utilities', 'ci', 'macro-shim.d.ts'), path.join(srcRoot, 'macro.d.ts'));
}

function prepareESM() {
  const pkgdir = path.join(rootdir, 'esm');
  fs.ensureDirSync(pkgdir);

  copyDirSync('./Utilities', pkgdir);

  // make ESM exports available at top-level
  fs.copySync('./dist/esm', pkgdir);

  // copy typescript defs
  for (const entry of glob.sync('Sources/**/*.d.ts')) {
    const parentPath = path.dirname(entry);
    let sourceCode = fs.readFileSync(entry, 'utf8');
    let m;

    let target = entry.replace(/^Sources\//, '');
    if (path.basename(entry) === 'index.d.ts') {
      const parentName = path.dirname(path.dirname(target));
      const moduleName = path.basename(path.dirname(target));
      target = path.join(parentName, `${moduleName}.d.ts`);
    }

    const moduleDest = path.join(pkgdir, target);

    while ((m = importRegex.exec(sourceCode)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === importRegex.lastIndex) {
        importRegex.lastIndex++;
      }

      if (m[1].startsWith('../') || m[1].startsWith('./')) {
        // Join parent folder with the relative path then replace 'Sources' with '@kitware/vtk.js'
        const modulePath = path.join(parentPath, m[1]).replace('Sources', '@kitware/vtk.js');
        sourceCode = sourceCode.replace(m[0], `from '${modulePath}'`);
      }
    }
    fs.writeFileSync(moduleDest, sourceCode);
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

  applyMacroShim(pkgdir);
}

function prepareUMD() {
  const pkgdir = path.join(rootdir, 'umd');
  fs.ensureDirSync(pkgdir);

  copyDirSync('./Sources', pkgdir);
  copyDirSync('./Utilities', pkgdir);

  fs.copySync('./dist/umd', pkgdir);

  // copy typescript defs
  for (const entry of glob.sync(`${pkgdir}/Sources/**/*.d.ts`)) {
    const parentPath = path.dirname(entry);
    let sourceCode = fs.readFileSync(entry, 'utf8');
    let m;

    while ((m = importRegex.exec(sourceCode)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === importRegex.lastIndex) {
        importRegex.lastIndex++;
      }

      if (m[1].startsWith('../') || m[1].startsWith('./')) {
        // Join parent folder with the relative path then replace pkgdir with 'vtk.js'
        const modulePath = path.join(parentPath, m[1]).replace(pkgdir,'vtk.js')
        sourceCode = sourceCode.replace(m[0], `from '${modulePath}'`);
      }
    }
    fs.writeFileSync(entry, sourceCode);
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

  pkgInfo.name = 'vtk.js';
  pkgInfo.main = './vtk.js';
  delete pkgInfo.module;

  fs.writeFileSync(packageJson, JSON.stringify(pkgInfo, null, 2));

  applyMacroShim(path.join(pkgdir, 'Sources'));
}

fs.removeSync(rootdir);
fs.ensureDirSync(rootdir);

prepareESM();
prepareUMD();
