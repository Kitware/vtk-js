import { defineConfig } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'glob';
import nodePolyfills from '@rolldown/plugin-node-polyfills';
import { createVtkPlugins } from './Utilities/build/plugins.mjs';
import {
  ignoreSourceFile,
  flattenIndexEntry,
  copyEsmAssetsPlugin,
  copyUmdAssetsPlugin,
  generateDtsReferencesPlugin,
  cleanupAssetsPlugin,
  injectEsmCssPlugin,
  inlineUmdCssPlugin,
} from './Utilities/build/vtk-plugins.mjs';

const pkgJSON = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const projectRoot = path.resolve('.');
const esmOutputDir = path.resolve('dist', 'esm');
const umdOutputDir = path.resolve('dist', 'umd');

const entryPoints = [
  path.join('Sources', 'macros.js'),
  path.join('Sources', 'vtk.js'),
  path.join('Sources', 'favicon.js'),
  ...glob.sync('Sources/**/*.js').filter((file) => !ignoreSourceFile(file)),
];

const esmEntries = {};
entryPoints.forEach((entry) => {
  esmEntries[entry.replace(/^Sources[/\\]/, '')] = entry;
});

const dependencies = Object.keys(pkgJSON.dependencies || {});
const peerDependencies = Object.keys(pkgJSON.peerDependencies || {});

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
      sourcemap: true,
      cssCodeSplit: true,
      lib: {
        entry: esmEntries,
        formats: ['es'],
      },
      rollupOptions: {
        input: esmEntries,
        preserveEntrySignatures: 'strict',
        external: [...dependencies, ...peerDependencies].map(
          (name) => new RegExp(`^${name}(/|$)`)
        ),
        output: {
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'Sources',
          entryFileNames(chunkInfo) {
            let name = chunkInfo.name;
            if (name.endsWith('.js')) name = name.slice(0, -3);
            return `${flattenIndexEntry(name)}.js`;
          },
          assetFileNames(assetInfo) {
            const name = assetInfo.names?.[0] || assetInfo.name || '';
            return name.replace(/^Sources\//, '');
          },
        },
      },
    },
    plugins: [
      { ...nodePolyfills(), enforce: 'pre' },
      ...createVtkPlugins(),
      injectEsmCssPlugin(),
      copyEsmAssetsPlugin({ esmOutputDir }),
      generateDtsReferencesPlugin({ esmOutputDir }),
      cleanupAssetsPlugin(esmOutputDir),
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
      { ...nodePolyfills(), enforce: 'pre' },
      ...createVtkPlugins(),
      inlineUmdCssPlugin(),
      copyUmdAssetsPlugin({ umdOutputDir, projectRoot }),
      cleanupAssetsPlugin(umdOutputDir),
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
