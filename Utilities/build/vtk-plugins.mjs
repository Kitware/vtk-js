import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import rewriteImports from './rewrite-imports.js';

export const SOURCE_IGNORE_LIST = [
  /[/\\]example_?[/\\]/,
  /[/\\]test/,
  /^Sources[/\\](Testing|ThirdParty)/,
];

export function ignoreSourceFile(name, ignoreList = SOURCE_IGNORE_LIST) {
  return ignoreList.some((toMatch) => {
    if (toMatch instanceof RegExp) return toMatch.test(name);
    if (typeof toMatch === 'string') return toMatch === name;
    return false;
  });
}

/**
 * If `name` looks like `<dir>/Foo/index`, return `<dir>/Foo` (flattening the
 * idiomatic vtk.js single-file class layout). Otherwise return `name`.
 */
export function flattenIndexEntry(name) {
  const match = /^((?:.*\/)?)([A-Z]\w+)\/index$/.exec(name);
  return match ? `${match[1]}${match[2]}` : name;
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function copyRootFiles(outputDir, patterns = ['*.txt', '*.md']) {
  patterns.forEach((pattern) => {
    for (const file of glob.sync(pattern)) {
      fs.copyFileSync(file, path.join(outputDir, file));
    }
  });
}

function copyCommonPackageAssets(outputDir) {
  copyRootFiles(outputDir);
  if (fs.existsSync('.npmignore')) {
    fs.copyFileSync('.npmignore', path.join(outputDir, '.npmignore'));
  }
  fs.copyFileSync('LICENSE', path.join(outputDir, 'LICENSE'));
}

function writePackageManifest(outputDir, transformPkg) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  transformPkg(pkg);
  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );
}

function rewriteDtsContent(file, rewriter) {
  return rewriteImports(fs.readFileSync(file, 'utf-8'), rewriter);
}

/**
 * Walks Sources/**\/*.d.ts, copies them next to the matching .js output,
 * rewriting relative imports for the flattened layout. Also copies static
 * Utilities, the macro shim, root assets, tsconfig, and writes a tailored
 * package.json into the ESM output directory.
 */
export function copyEsmAssetsPlugin({ esmOutputDir }) {
  return {
    name: 'vtk-copy-esm-assets',
    closeBundle() {
      const dtsFiles = glob.sync('Sources/**/*.d.ts');
      for (const file of dtsFiles) {
        if (ignoreSourceFile(file)) continue;

        const filename = path.basename(file);
        const dirname = path.dirname(file);

        if (filename === 'index.d.ts' && dirname !== 'Sources') {
          const moduleName = path.basename(dirname);
          const destPath = path.join(
            esmOutputDir,
            path.relative('Sources', path.dirname(dirname)),
            `${moduleName}.d.ts`
          );

          const content = rewriteDtsContent(file, (relImport) => {
            const baseDir = dirname;

            if (relImport === '..') {
              return `../${path.basename(path.dirname(baseDir))}`;
            }

            if (relImport.startsWith('../') || relImport.startsWith('./')) {
              const resolvedImportPath = path.resolve(
                `${baseDir}/${relImport}`
              );
              return `./${path
                .relative(`${baseDir}/..`, resolvedImportPath)
                .replace(/\\/g, '/')}`;
            }

            return relImport;
          });

          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, content);
        } else {
          const destPath = path.join(
            esmOutputDir,
            path.relative('Sources', file)
          );
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(file, destPath);
        }
      }

      copyDir(
        'Utilities/XMLConverter',
        `${esmOutputDir}/Utilities/XMLConverter`
      );
      copyDir(
        'Utilities/DataGenerator',
        `${esmOutputDir}/Utilities/DataGenerator`
      );
      copyDir('Utilities/config', `${esmOutputDir}/Utilities/config`);
      fs.mkdirSync(`${esmOutputDir}/Utilities`, { recursive: true });
      fs.copyFileSync(
        'Utilities/prepare.js',
        `${esmOutputDir}/Utilities/prepare.js`
      );

      // Flip these CJS subdirs back to CommonJS scope (root is type: module).
      for (const dir of [
        'Utilities/config',
        'Utilities/XMLConverter',
        'Utilities/DataGenerator',
      ]) {
        fs.writeFileSync(
          `${esmOutputDir}/${dir}/package.json`,
          `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`
        );
      }

      fs.copyFileSync(
        'Utilities/build/macro-shim.d.ts',
        `${esmOutputDir}/macro.d.ts`
      );
      fs.copyFileSync(
        'Utilities/build/macro-shim.js',
        `${esmOutputDir}/macro.js`
      );

      copyCommonPackageAssets(esmOutputDir);
      fs.copyFileSync('tsconfig.json', `${esmOutputDir}/tsconfig.json`);
      writePackageManifest(esmOutputDir, (pkg) => {
        pkg.name = '@kitware/vtk.js';
        pkg.type = 'module';
        pkg.main = './index.js';
        pkg.module = './index.js';
        pkg.types = './index.d.ts';
      });
    },
  };
}

/**
 * For the UMD build, ship Sources/**\/* unbundled alongside vtk.js so
 * consumers can deep-import individual modules. .d.ts imports get rewritten
 * from relative paths to absolute `vtk.js/Sources/...` paths.
 */
export function copyUmdAssetsPlugin({ umdOutputDir, projectRoot }) {
  return {
    name: 'vtk-copy-umd-assets',
    closeBundle() {
      const sourceFiles = glob
        .sync('Sources/**/*', { nodir: true })
        .filter((file) => !ignoreSourceFile(file) && !file.endsWith('.md'));

      for (const file of sourceFiles) {
        const destPath = path.join(umdOutputDir, file);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        if (file.endsWith('.d.ts')) {
          const content = rewriteDtsContent(file, (relImport) => {
            const importPath = path.join(path.dirname(file), relImport);
            return path
              .join('vtk.js', path.relative(projectRoot, importPath))
              .replace(/\\/g, '/');
          });
          fs.writeFileSync(destPath, content);
        } else {
          fs.copyFileSync(file, destPath);
        }
      }

      fs.mkdirSync(path.join(umdOutputDir, 'Utilities'), { recursive: true });
      copyDir(
        'Utilities/XMLConverter',
        `${umdOutputDir}/Utilities/XMLConverter`
      );
      copyDir(
        'Utilities/DataGenerator',
        `${umdOutputDir}/Utilities/DataGenerator`
      );
      copyDir('Utilities/config', `${umdOutputDir}/Utilities/config`);
      fs.copyFileSync(
        'Utilities/prepare.js',
        `${umdOutputDir}/Utilities/prepare.js`
      );

      fs.copyFileSync(
        'Utilities/build/macro-shim.d.ts',
        `${umdOutputDir}/Sources/macro.d.ts`
      );
      fs.copyFileSync(
        'Utilities/build/macro-shim.js',
        `${umdOutputDir}/Sources/macro.js`
      );

      copyCommonPackageAssets(umdOutputDir);
      writePackageManifest(umdOutputDir, (pkg) => {
        pkg.name = 'vtk.js';
        pkg.main = './vtk.js';
        delete pkg.module;
        delete pkg.type;
        delete pkg.types;
      });

      // vtk-lite.js is a deprecated alias of vtk.js; see BREAKING_CHANGES.md.
      const vtkBundle = path.join(umdOutputDir, 'vtk.js');
      if (fs.existsSync(vtkBundle)) {
        fs.copyFileSync(vtkBundle, path.join(umdOutputDir, 'vtk-lite.js'));
      }
    },
  };
}

/**
 * Writes dist/esm/index.d.ts with triple-slash refs to every emitted .d.ts.
 */
export function generateDtsReferencesPlugin({ esmOutputDir }) {
  return {
    name: 'vtk-generate-dts-references',
    closeBundle() {
      const dtsReferences = [
        '/// <reference path="./types.d.ts" />',
        '/// <reference path="./interfaces.d.ts" />',
      ];

      const jsFiles = glob.sync('**/*.js', { cwd: esmOutputDir });
      for (const file of jsFiles) {
        const dtsFile = file.replace(/\.js$/, '.d.ts');
        const dtsPath = path.join(esmOutputDir, dtsFile);

        const flat = flattenIndexEntry(file.replace(/\.js$/, ''));
        const flatDtsFile =
          flat !== file.replace(/\.js$/, '') ? `${flat}.d.ts` : null;
        const flatDtsPath = flatDtsFile
          ? path.join(esmOutputDir, flatDtsFile)
          : null;

        if (fs.existsSync(dtsPath) && dtsFile !== 'index.d.ts') {
          dtsReferences.push(
            `/// <reference path="./${dtsFile.replace(/\\/g, '/')}" />`
          );
        } else if (flatDtsPath && fs.existsSync(flatDtsPath)) {
          dtsReferences.push(
            `/// <reference path="./${flatDtsFile.replace(/\\/g, '/')}" />`
          );
        }
      }

      fs.writeFileSync(
        path.join(esmOutputDir, 'index.d.ts'),
        dtsReferences.join('\r\n')
      );
    },
  };
}

/**
 * Removes Vite's `<outDir>/assets` directory if empty/unwanted.
 */
export function cleanupAssetsPlugin(outputDir) {
  return {
    name: `vtk-cleanup-${path.basename(outputDir)}`,
    closeBundle() {
      const assetsDir = path.join(outputDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }
    },
  };
}

/**
 * Prepends a <style> injection IIFE to `chunk.code` for the given CSS text,
 * matching the old style-loader / rollup-plugin-postcss `inject:true` behavior.
 */
function prependStyleInjection(chunk, cssText) {
  const cssPayload = JSON.stringify(cssText);
  chunk.code =
    `if (typeof document !== 'undefined') {\n` +
    `  var __vtkStyle = document.createElement('style');\n` +
    `  __vtkStyle.textContent = ${cssPayload};\n` +
    `  (document.head || document.getElementsByTagName('head')[0]).appendChild(__vtkStyle);\n` +
    `}\n` +
    chunk.code;
}

/**
 * ESM CSS module wrappers (e.g. Slider.module.css.js) only export the class
 * name map; the actual stylesheet is emitted as a sibling .module.css file
 * that nothing imports. Restore the old style-loader behavior by inlining the
 * CSS into the wrapper and injecting it as a <style> tag on first evaluation.
 */
export function injectEsmCssPlugin() {
  return {
    name: 'vtk-inject-esm-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssAssetsByName = new Map();
      for (const [key, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && item.fileName.endsWith('.module.css')) {
          cssAssetsByName.set(item.fileName, {
            key,
            source: String(item.source),
          });
        }
      }
      if (cssAssetsByName.size === 0) return;

      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk' || !item.fileName.endsWith('.module.css.js'))
          continue;
        const cssFileName = item.fileName.replace(/\.js$/, '');
        const css = cssAssetsByName.get(cssFileName);
        if (!css) continue;

        prependStyleInjection(item, css.source);
        delete bundle[css.key];
      }
    },
  };
}

/**
 * UMD has a single output chunk; concatenate all extracted CSS and inline it
 * into that chunk as a one-shot <style> injection. Run after Vite's css-post
 * plugin so the emitted CSS asset is present in the bundle.
 */
export function inlineUmdCssPlugin({ chunkFileName = 'vtk.js' } = {}) {
  return {
    name: 'vtk-inline-umd-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssAssets = Object.entries(bundle).filter(
        ([, item]) => item.type === 'asset' && item.fileName.endsWith('.css')
      );
      if (!cssAssets.length) return;

      const umdChunk = Object.values(bundle).find(
        (item) => item.type === 'chunk' && item.fileName === chunkFileName
      );
      if (!umdChunk) return;

      const cssText = cssAssets
        .map(([, item]) => String(item.source))
        .filter(Boolean)
        .join('\n');
      if (!cssText) return;

      prependStyleInjection(umdChunk, cssText);
      cssAssets.forEach(([fileName]) => {
        delete bundle[fileName];
      });
    },
  };
}
