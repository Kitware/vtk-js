import { defineConfig } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';
import {
  glslPlugin,
  svgRawPlugin,
  workerInlinePlugin,
  ignorePlugin,
} from './Utilities/rollup/plugins.js';

import rewriteImports from './Utilities/build/rewrite-imports.js';

const pkgJSON = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

const IGNORE_LIST = [
  /[/\\]example_?[/\\]/,
  /[/\\]test/,
  /^Sources[/\\](Testing|ThirdParty)/,
];

function ignoreFile(name, ignoreList = IGNORE_LIST) {
  return ignoreList.some((toMatch) => {
    if (toMatch instanceof RegExp) return toMatch.test(name);
    if (typeof toMatch === 'string') return toMatch === name;
    return false;
  });
}

const entryPoints = [
  path.join('Sources', 'macros.js'),
  path.join('Sources', 'vtk.js'),
  path.join('Sources', 'favicon.js'),
  ...glob.sync('Sources/**/*.js').filter((file) => !ignoreFile(file)),
];

const entries = {};
entryPoints.forEach((entry) => {
  entries[entry.replace(/^Sources[/\\]/, '')] = entry;
});

const outputDir = path.resolve('dist', 'esm');

const dependencies = Object.keys(pkgJSON.dependencies || {});
const peerDependencies = Object.keys(pkgJSON.peerDependencies || {});

// ---------------------------------------------------------------------------
// Plugin: copy assets (.d.ts, package.json, utilities) to dist/esm
// ---------------------------------------------------------------------------
function copyAssetsPlugin() {

  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'vtk-copy-assets',
    closeBundle() {
      // --- Copy and transform .d.ts files ---
      const dtsFiles = glob.sync('Sources/**/*.d.ts');
      for (const file of dtsFiles) {
        if (ignoreFile(file)) continue;

        const filename = path.basename(file);
        const dirname = path.dirname(file);

        if (filename === 'index.d.ts' && dirname !== 'Sources') {
          const moduleName = path.basename(dirname);
          const destPath = path.join(
            outputDir,
            path.relative('Sources', path.dirname(dirname)),
            `${moduleName}.d.ts`
          );

          let content = fs.readFileSync(file, 'utf-8');
          content = rewriteImports(content, (relImport) => {
            const baseDir = dirname;

            if (relImport === '..') {
              return `../${path.basename(path.dirname(baseDir))}`;
            }

            if (
              relImport.startsWith('../') ||
              relImport.startsWith('./')
            ) {
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
          // Non-index d.ts files: copy preserving structure
          const destPath = path.join(
            outputDir,
            path.relative('Sources', file)
          );
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(file, destPath);
        }
      }

      // --- Copy utility dirs/files ---
      copyDir('Utilities/XMLConverter', `${outputDir}/Utilities/XMLConverter`);
      copyDir(
        'Utilities/DataGenerator',
        `${outputDir}/Utilities/DataGenerator`
      );
      fs.mkdirSync(`${outputDir}/Utilities`, { recursive: true });
      fs.copyFileSync(
        'Utilities/prepare.js',
        `${outputDir}/Utilities/prepare.js`
      );

      // --- Copy macro shims ---
      fs.copyFileSync(
        'Utilities/build/macro-shim.d.ts',
        `${outputDir}/macro.d.ts`
      );
      fs.copyFileSync(
        'Utilities/build/macro-shim.js',
        `${outputDir}/macro.js`
      );

      // --- Copy root files ---
      for (const f of glob.sync('*.txt')) {
        fs.copyFileSync(f, `${outputDir}/${f}`);
      }
      for (const f of glob.sync('*.md')) {
        fs.copyFileSync(f, `${outputDir}/${f}`);
      }
      fs.copyFileSync('tsconfig.json', `${outputDir}/tsconfig.json`);
      if (fs.existsSync('.npmignore')) {
        fs.copyFileSync('.npmignore', `${outputDir}/.npmignore`);
      }
      fs.copyFileSync('LICENSE', `${outputDir}/LICENSE`);

      // --- Transform and copy package.json ---
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      pkg.name = '@kitware/vtk.js';
      pkg.type = 'module';
      pkg.main = './index.js';
      pkg.module = './index.js';
      pkg.types = './index.d.ts';
      fs.writeFileSync(
        `${outputDir}/package.json`,
        JSON.stringify(pkg, null, 2)
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: generate index.d.ts with triple-slash references
// ---------------------------------------------------------------------------
function generateDtsReferencesPlugin() {
  return {
    name: 'vtk-generate-dts-references',
    closeBundle() {
      const dtsReferences = [
        '/// <reference path="./types.d.ts" />',
        '/// <reference path="./interfaces.d.ts" />',
      ];

      const jsFiles = glob.sync('**/*.js', { cwd: outputDir });
      for (const file of jsFiles) {
        const dtsFile = file.replace(/\.js$/, '.d.ts');
        const dtsPath = path.join(outputDir, dtsFile);

        // Also check flattened path: Module/index.js → Module.d.ts
        const flatMatch = /^(.*[/\\])([A-Z]\w+)[/\\]index\.js$/.exec(file);
        const flatDtsFile = flatMatch
          ? `${flatMatch[1]}${flatMatch[2]}.d.ts`
          : null;
        const flatDtsPath = flatDtsFile
          ? path.join(outputDir, flatDtsFile)
          : null;

        if (fs.existsSync(dtsPath) && dtsFile !== 'index.d.ts') {
          dtsReferences.push(
            `/// <reference path="./${dtsFile.replace(/\\/g, '/')}" />`
          );
        } else if (flatDtsPath && fs.existsSync(flatDtsPath)) {
          const ref = flatDtsFile.replace(/\\/g, '/');
          dtsReferences.push(`/// <reference path="./${ref}" />`);
        }
      }

      fs.writeFileSync(
        path.join(outputDir, 'index.d.ts'),
        dtsReferences.join('\r\n')
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: post-build cleanup (remove stray worker sourcemap assets)
// ---------------------------------------------------------------------------
function cleanupPlugin() {
  return {
    name: 'vtk-cleanup',
    closeBundle() {
      const assetsDir = path.join(outputDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.rmSync(assetsDir, { recursive: true, force: true });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Vite configuration
// ---------------------------------------------------------------------------
export default defineConfig({
  resolve: {
    alias: {
      'vtk.js': path.resolve(import.meta.dirname),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  worker: {
    rollupOptions: {
      output: {
        sourcemap: false,
      },
    },
  },
  build: {
    outDir: outputDir,
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      input: entries,
      preserveEntrySignatures: 'strict',
      external: [
        ...dependencies.map((name) => new RegExp(`^${name}`)),
        ...peerDependencies.map((name) => new RegExp(`^${name}`)),
      ],
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'Sources',
        entryFileNames(chunkInfo) {
          let name = chunkInfo.name;
          if (name.endsWith('.js')) name = name.slice(0, -3);
          // Flatten Module/index → Module.js to match old Rollup output
          const match = /^((?:.*\/)?)([A-Z]\w+)\/index$/.exec(name);
          if (match) {
            return `${match[1]}${match[2]}.js`;
          }
          return `${name}.js`;
        },
        assetFileNames(assetInfo) {
          const name = assetInfo.names?.[0] || assetInfo.name || '';
          return name.replace(/^Sources\//, '');
        },
      },
    },
  },
  plugins: [
    workerInlinePlugin(),
    glslPlugin(),
    svgRawPlugin(),
    ignorePlugin(['crypto']),
    copyAssetsPlugin(),
    generateDtsReferencesPlugin(),
    cleanupPlugin(),
  ],
});
