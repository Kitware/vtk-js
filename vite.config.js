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
const projectRoot = path.resolve('.');
const esmOutputDir = path.resolve('dist', 'esm');
const umdOutputDir = path.resolve('dist', 'umd');

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

const entryPoints = [
  path.join('Sources', 'macros.js'),
  path.join('Sources', 'vtk.js'),
  path.join('Sources', 'favicon.js'),
  ...glob.sync('Sources/**/*.js').filter((file) => !ignoreFile(file)),
];

const esmEntries = {};
entryPoints.forEach((entry) => {
  esmEntries[entry.replace(/^Sources[/\\]/, '')] = entry;
});

const dependencies = Object.keys(pkgJSON.dependencies || {});
const peerDependencies = Object.keys(pkgJSON.peerDependencies || {});

function copyEsmAssetsPlugin() {
  return {
    name: 'vtk-copy-esm-assets',
    closeBundle() {
      const dtsFiles = glob.sync('Sources/**/*.d.ts');
      for (const file of dtsFiles) {
        if (ignoreFile(file)) continue;

        const filename = path.basename(file);
        const dirname = path.dirname(file);

        if (filename === 'index.d.ts' && dirname !== 'Sources') {
          const moduleName = path.basename(dirname);
          const destPath = path.join(
            esmOutputDir,
            path.relative('Sources', path.dirname(dirname)),
            `${moduleName}.d.ts`
          );

          let content = fs.readFileSync(file, 'utf-8');
          content = rewriteImports(content, (relImport) => {
            const baseDir = dirname;

            if (relImport === '..') {
              return `../${path.basename(path.dirname(baseDir))}`;
            }

            if (relImport.startsWith('../') || relImport.startsWith('./')) {
              const resolvedImportPath = path.resolve(`${baseDir}/${relImport}`);
              return `./${path
                .relative(`${baseDir}/..`, resolvedImportPath)
                .replace(/\\/g, '/')}`;
            }

            return relImport;
          });

          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, content);
        } else {
          const destPath = path.join(esmOutputDir, path.relative('Sources', file));
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(file, destPath);
        }
      }

      copyDir('Utilities/XMLConverter', `${esmOutputDir}/Utilities/XMLConverter`);
      copyDir('Utilities/DataGenerator', `${esmOutputDir}/Utilities/DataGenerator`);
      fs.mkdirSync(`${esmOutputDir}/Utilities`, { recursive: true });
      fs.copyFileSync('Utilities/prepare.js', `${esmOutputDir}/Utilities/prepare.js`);

      fs.copyFileSync('Utilities/build/macro-shim.d.ts', `${esmOutputDir}/macro.d.ts`);
      fs.copyFileSync('Utilities/build/macro-shim.js', `${esmOutputDir}/macro.js`);

      for (const f of glob.sync('*.txt')) {
        fs.copyFileSync(f, `${esmOutputDir}/${f}`);
      }
      for (const f of glob.sync('*.md')) {
        fs.copyFileSync(f, `${esmOutputDir}/${f}`);
      }
      fs.copyFileSync('tsconfig.json', `${esmOutputDir}/tsconfig.json`);
      if (fs.existsSync('.npmignore')) {
        fs.copyFileSync('.npmignore', `${esmOutputDir}/.npmignore`);
      }
      fs.copyFileSync('LICENSE', `${esmOutputDir}/LICENSE`);

      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      pkg.name = '@kitware/vtk.js';
      pkg.type = 'module';
      pkg.main = './index.js';
      pkg.module = './index.js';
      pkg.types = './index.d.ts';
      fs.writeFileSync(
        `${esmOutputDir}/package.json`,
        JSON.stringify(pkg, null, 2)
      );
    },
  };
}

function copyUmdAssetsPlugin() {
  return {
    name: 'vtk-copy-umd-assets',
    closeBundle() {
      const sourceFiles = glob
        .sync('Sources/**/*', { nodir: true })
        .filter((file) => !ignoreFile(file) && !file.endsWith('.md'));

      for (const file of sourceFiles) {
        const destPath = path.join(umdOutputDir, file);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        if (file.endsWith('.d.ts')) {
          const content = rewriteImports(fs.readFileSync(file, 'utf-8'), (relImport) => {
            const importPath = path.join(path.dirname(file), relImport);
            return path.join('vtk.js', path.relative(projectRoot, importPath)).replace(/\\/g, '/');
          });
          fs.writeFileSync(destPath, content);
        } else {
          fs.copyFileSync(file, destPath);
        }
      }

      fs.mkdirSync(path.join(umdOutputDir, 'Utilities'), { recursive: true });
      copyDir('Utilities/XMLConverter', `${umdOutputDir}/Utilities/XMLConverter`);
      copyDir('Utilities/DataGenerator', `${umdOutputDir}/Utilities/DataGenerator`);
      copyDir('Utilities/config', `${umdOutputDir}/Utilities/config`);
      fs.copyFileSync('Utilities/prepare.js', `${umdOutputDir}/Utilities/prepare.js`);

      fs.copyFileSync(
        'Utilities/build/macro-shim.d.ts',
        `${umdOutputDir}/Sources/macro.d.ts`
      );
      fs.copyFileSync(
        'Utilities/build/macro-shim.js',
        `${umdOutputDir}/Sources/macro.js`
      );

      for (const f of glob.sync('*.txt')) {
        fs.copyFileSync(f, `${umdOutputDir}/${f}`);
      }
      for (const f of glob.sync('*.md')) {
        fs.copyFileSync(f, `${umdOutputDir}/${f}`);
      }
      if (fs.existsSync('.npmignore')) {
        fs.copyFileSync('.npmignore', `${umdOutputDir}/.npmignore`);
      }
      fs.copyFileSync('LICENSE', `${umdOutputDir}/LICENSE`);

      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      pkg.name = 'vtk.js';
      pkg.main = './vtk.js';
      delete pkg.module;
      delete pkg.type;
      delete pkg.types;
      fs.writeFileSync(
        `${umdOutputDir}/package.json`,
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

      const jsFiles = glob.sync('**/*.js', { cwd: esmOutputDir });
      for (const file of jsFiles) {
        const dtsFile = file.replace(/\.js$/, '.d.ts');
        const dtsPath = path.join(esmOutputDir, dtsFile);

        const flatMatch = /^(.*[/\\])([A-Z]\w+)[/\\]index\.js$/.exec(file);
        const flatDtsFile = flatMatch ? `${flatMatch[1]}${flatMatch[2]}.d.ts` : null;
        const flatDtsPath = flatDtsFile ? path.join(esmOutputDir, flatDtsFile) : null;

        if (fs.existsSync(dtsPath) && dtsFile !== 'index.d.ts') {
          dtsReferences.push(`/// <reference path="./${dtsFile.replace(/\\/g, '/')}" />`);
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

function cleanupPlugin(outputDir) {
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

function createSharedConfig() {
  return {
    resolve: {
      alias: {
        'vtk.js': projectRoot,
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
  };
}

function createEsmConfig() {
  return {
    ...createSharedConfig(),
    build: {
      outDir: esmOutputDir,
      emptyOutDir: true,
      minify: false,
      sourcemap: false,
      cssCodeSplit: true,
      lib: {
        entry: esmEntries,
        formats: ['es'],
      },
      rollupOptions: {
        input: esmEntries,
        preserveEntrySignatures: 'strict',
        external: [
          ...dependencies.map((name) => new RegExp(`^${name}`)),
          ...peerDependencies.map((name) => new RegExp(`^${name}`)),
        ],
        output: {
          format: 'es',
          compact: false,
          preserveModules: true,
          preserveModulesRoot: 'Sources',
          entryFileNames(chunkInfo) {
            let name = chunkInfo.name;
            if (name.endsWith('.js')) name = name.slice(0, -3);
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
      copyEsmAssetsPlugin(),
      generateDtsReferencesPlugin(),
      cleanupPlugin(esmOutputDir),
    ],
  };
}

function createUmdConfig() {
  const umdEntry = path.resolve('Utilities/build/umd-entry.js');

  return {
    ...createSharedConfig(),
    build: {
      outDir: umdOutputDir,
      emptyOutDir: true,
      sourcemap: true,
      cssCodeSplit: false,
      lib: {
        entry: umdEntry,
        name: 'vtk',
        formats: ['umd'],
        fileName: () => 'vtk.js',
      },
      rollupOptions: {
        input: umdEntry,
        output: {
          exports: 'default',
        },
      },
    },
    plugins: [
      workerInlinePlugin(),
      glslPlugin(),
      svgRawPlugin(),
      ignorePlugin(['crypto']),
      copyUmdAssetsPlugin(),
      cleanupPlugin(umdOutputDir),
    ],
  };
}

const buildTarget = process.env.BUILD_TARGET || 'esm';

let selectedConfig;

if (buildTarget === 'esm') {
  selectedConfig = createEsmConfig();
} else if (buildTarget === 'umd') {
  selectedConfig = createUmdConfig();
} else {
  throw new Error(`Unsupported BUILD_TARGET: ${buildTarget}`);
}

export default defineConfig(selectedConfig);
