import { defineConfig } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';

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
// Plugin: load .glsl files as raw strings
// ---------------------------------------------------------------------------
function glslPlugin() {
  return {
    name: 'vtk-glsl',
    load(id) {
      if (id.endsWith('.glsl')) {
        const content = fs.readFileSync(id, 'utf-8');
        return {
          code: `export default ${JSON.stringify(content)};`,
          moduleType: 'js',
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: load .svg files as raw strings
// ---------------------------------------------------------------------------
function svgRawPlugin() {
  return {
    name: 'vtk-svg-raw',
    load(id) {
      if (id.endsWith('.svg')) {
        const content = fs.readFileSync(id, 'utf-8');
        return {
          code: `export default ${JSON.stringify(content)};`,
          moduleType: 'js',
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: resolve .worker imports using Vite native inline workers
// ---------------------------------------------------------------------------
function workerInlinePlugin() {
  return {
    name: 'vtk-worker-inline',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (/\.worker(?:\.js)?$/.test(source) && !source.includes('?')) {
        const actualSource = source.endsWith('.js') ? source : `${source}.js`;
        const resolved = await this.resolve(actualSource, importer, {
          ...options,
          skipSelf: true,
        });
        if (resolved) {
          return `${resolved.id}?worker&inline`;
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: ignore specific modules (e.g. crypto)
// ---------------------------------------------------------------------------
function ignorePlugin(modules) {
  return {
    name: 'vtk-ignore',
    resolveId(source) {
      if (modules.includes(source)) {
        return { id: `\0ignore:${source}`, moduleSideEffects: false };
      }
    },
    load(id) {
      if (id.startsWith('\0ignore:')) {
        return { code: 'export default {};', moduleType: 'js' };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin: copy assets (.d.ts, package.json, utilities) to dist/esm
// ---------------------------------------------------------------------------
function copyAssetsPlugin() {
  const relatifyImports =
    typeof require !== 'undefined'
      ? require('./Utilities/build/rewrite-imports')
      : null;

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

        if (
          filename === 'index.d.ts' &&
          dirname !== 'Sources'
        ) {
          const moduleName = path.basename(dirname);
          const destPath = path.join(
            outputDir,
            path.relative('Sources', path.dirname(dirname)),
            `${moduleName}.d.ts`
          );

          let content = fs.readFileSync(file, 'utf-8');
          if (relatifyImports) {
            content = relatifyImports(content, (relImport) => {
              let importPath = relImport;
              const baseDir = dirname;

              if (importPath === '..') {
                return `../${path.basename(path.dirname(baseDir))}`;
              }

              if (
                importPath.startsWith('../') ||
                importPath.startsWith('./')
              ) {
                const resolvedImportPath = path.resolve(
                  `${baseDir}/${importPath}`
                );
                importPath = `./${path
                  .relative(`${baseDir}/..`, resolvedImportPath)
                  .replace(/\\/g, '/')}`;
              }

              return importPath;
            });
          }

          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, content);
        } else {
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
      copyDir('Utilities/config', `${outputDir}/Utilities/config`);

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
        if (fs.existsSync(dtsPath) && dtsFile !== 'index.d.ts') {
          dtsReferences.push(
            `/// <reference path="./${dtsFile.replace(/\\/g, '/')}" />`
          );
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
    rolldownOptions: {
      output: {
        sourcemap: false,
      },
    },
  },
  build: {
    outDir: outputDir,
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rolldownOptions: {
      external: [
        ...dependencies.map((name) => new RegExp(`^${name}`)),
        ...peerDependencies.map((name) => new RegExp(`^${name}`)),
      ],
      output: {
        entryFileNames(chunkInfo) {
          const name = chunkInfo.name;
          // rewrite Sources/.../<NAME>/index.js to .../<NAME>.js
          const sourcesMatch = /^(.*?)[/\\]([A-Z]\w+)[/\\]index\.js$/.exec(
            name
          );
          if (sourcesMatch) {
            return path.join(sourcesMatch[1], `${sourcesMatch[2]}.js`);
          }
          return name;
        },
        // Force each module into its own chunk named after its file path,
        // preserving the directory structure in the output (like preserveModules).
        manualChunks(id) {
          if (id.includes('\0')) return undefined;
          const projectRoot =
            path.resolve(import.meta.dirname).replace(/\\/g, '/') + '/';
          const normalizedId = id.replace(/\\/g, '/');
          if (normalizedId.startsWith(projectRoot)) {
            return normalizedId.slice(projectRoot.length);
          }
          return undefined;
        },
        chunkFileNames(chunkInfo) {
          let name = chunkInfo.name;
          // Rolldown runtime goes in _virtual/
          if (name === 'rolldown-runtime') {
            return '_virtual/rolldown-runtime.js';
          }
          if (!name.endsWith('.js')) {
            name += '.js';
          }
          if (name.includes('node_modules')) {
            return name.replace(/node_modules/g, 'vendor');
          }
          if (name.startsWith('_')) {
            return name.replace(/^_/, '_virtual/');
          }
          return name.replace(/^Sources\//, '');
        },
        assetFileNames(assetInfo) {
          const name = assetInfo.names?.[0] || assetInfo.name || '';
          // Strip Sources/ prefix from CSS and other assets
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
