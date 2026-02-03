#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { rollup } from 'rollup';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import ignore from 'rollup-plugin-ignore';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import postcss from 'rollup-plugin-postcss';
import svgo from 'rollup-plugin-svgo';
import webworkerLoader from 'rollup-plugin-web-worker-loader';
import { string } from 'rollup-plugin-string';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(DOCS_ROOT, '..');
const SOURCES_ROOT = path.resolve(REPO_ROOT, 'Sources');
const EXAMPLES_ROOT = path.resolve(REPO_ROOT, 'Examples');

const EXAMPLE_SOURCES = [
  {
    root: SOURCES_ROOT,
    shouldSkipDir: (relDir) =>
      relDir === 'Testing' || relDir.startsWith('Testing/'),
    isExampleFile: (relPath) => /\/example\/index\.js$/.test(relPath),
    getExampleName: (fullPath) =>
      path.basename(path.dirname(path.dirname(fullPath))),
  },
  {
    root: EXAMPLES_ROOT,
    shouldSkipDir: () => false,
    isExampleFile: (relPath) => {
      const segments = relPath.split('/');
      return segments.length === 3 && segments[2] === 'index.js';
    },
    getExampleName: (fullPath) => path.basename(path.dirname(fullPath)),
  },
];

function buildHtml(exampleName, bundleFile) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VTK.js | Example - ${exampleName}</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      body { font-family: sans-serif; }
    </style>
  </head>
  <body>
    <div id="vtk-root" style="height:100%; width:100%;"></div>
    <script type="module">
      window.global = window.global || {};
      const exampleFile = "${bundleFile}";
      import(exampleFile);
    </script>
  </body>
</html>
`;
}

async function walkExamples(config, dir = config.root, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const relDir = path.relative(config.root, fullPath).replace(/\\/g, '/');
        if (relDir && config.shouldSkipDir(relDir)) {
          return;
        }
        await walkExamples(config, fullPath, results);
      } else if (entry.name === 'index.js') {
        const relPath = path
          .relative(config.root, fullPath)
          .replace(/\\/g, '/');
        if (!config.isExampleFile(relPath)) return;
        const exampleName = config.getExampleName(fullPath, relPath);
        results.push({
          name: exampleName,
          entryPath: fullPath,
        });
      }
    })
  );
  return results;
}

async function collectEntries() {
  const entriesByRoot = await Promise.all(
    EXAMPLE_SOURCES.map((config) => walkExamples(config))
  );
  const entries = {};
  entriesByRoot.flat().forEach(({ name, entryPath }) => {
    entries[name] = entryPath;
  });
  return entries;
}

function assetLoader() {
  const assetRegex = /\.(png|jpe?g)$/i;
  return {
    name: 'asset-loader',
    async load(id) {
      if (!assetRegex.test(id)) {
        return null;
      }

      const source = await fs.readFile(id);
      const refId = this.emitFile({
        type: 'asset',
        name: path.basename(id),
        source,
      });

      return `export default import.meta.ROLLUP_FILE_URL_${refId};`;
    },
  };
}

function replaceBasePath(basePath) {
  return {
    name: 'replace-base-path',
    transform(code, id) {
      if (!id.endsWith('.js')) {
        return null;
      }

      if (!code.includes('__BASE_PATH__')) {
        return null;
      }

      return {
        code: code.replace(/\b__BASE_PATH__\b/g, JSON.stringify(basePath)),
        map: null,
      };
    },
  };
}

async function build() {
  const entries = await collectEntries();
  const distDir = path.resolve(DOCS_ROOT, '.vitepress', 'dist', 'examples');

  const aliasPlugin = alias.default ? alias.default : alias;
  const commonjsPlugin = commonjs.default ? commonjs.default : commonjs;
  const jsonPlugin = json.default ? json.default : json;
  const nodePolyfillsPlugin = nodePolyfills.default
    ? nodePolyfills.default
    : nodePolyfills;
  const postcssPlugin = postcss.default ? postcss.default : postcss;
  const svgoPlugin = svgo.default ? svgo.default : svgo;
  const webworkerPlugin = webworkerLoader.default
    ? webworkerLoader.default
    : webworkerLoader;
  const stringPlugin = string.default ? string.default : string;
  const ignorePlugin = ignore.default ? ignore.default : ignore;

  const bundle = await rollup({
    input: entries,
    plugins: [
      aliasPlugin({
        entries: [
          {
            find: '@kitware/vtk.js',
            replacement: path.resolve(REPO_ROOT, 'Sources'),
          },
          { find: 'vtk.js', replacement: REPO_ROOT },
        ],
      }),
      ignorePlugin(['crypto']),
      webworkerPlugin({
        targetPlatform: 'browser',
        pattern: /^.+\.worker(?:\.js)?$/,
        external: [],
        inline: true,
        preserveSource: true,
      }),
      nodeResolve({
        preferBuiltins: false,
        browser: true,
      }),
      commonjsPlugin({
        transformMixedEsModules: true,
      }),
      nodePolyfillsPlugin(),
      babel({
        include: ['Sources/**', 'Examples/**'],
        exclude: 'node_modules/**',
        extensions: ['.js'],
        babelHelpers: 'runtime',
      }),
      stringPlugin({
        include: ['**/*.glsl', '**/*.svg'],
      }),
      jsonPlugin(),
      svgoPlugin(),
      postcssPlugin({
        inject: true,
        modules: {
          auto: /\.module\.css$/i,
        },
        plugins: [autoprefixer],
      }),
      assetLoader(),
      replaceBasePath('/vtk-js'),
    ],
  });

  await bundle.write({
    dir: distDir,
    format: 'es',
    entryFileNames: '[name]/index.js',
    chunkFileNames: '_shared/[name]-[hash].js',
    assetFileNames: '_assets/[name]-[hash][extname]',
  });

  await bundle.close();

  await fs.mkdir(distDir, { recursive: true });

  await Promise.all(
    Object.keys(entries).map(async (chunkName) => {
      const outDir = path.resolve(distDir, chunkName);
      const bundleFile = './index.js';

      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(
        path.resolve(outDir, 'index.html'),
        buildHtml(chunkName, bundleFile),
        'utf8'
      );
    })
  );

  console.log(
    `Wrote ${Object.keys(entries).length} example pages to ${distDir}`
  );

  const dataSrc = path.resolve(REPO_ROOT, 'Data');
  const dataDest = path.resolve(DOCS_ROOT, '.vitepress', 'dist', 'data');
  try {
    await fs.access(dataSrc);
    await fs.mkdir(dataDest, { recursive: true });
    await fs.cp(dataSrc, dataDest, { recursive: true, force: true });
    console.log(`Copied Data assets to ${dataDest}`);
  } catch (err) {
    console.warn(`Skipping Data copy: ${err.message}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
