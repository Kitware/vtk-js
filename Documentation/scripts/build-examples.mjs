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

function buildHtml(
  exampleName,
  bundleFile,
  isModule = false,
  inlineScript = null
) {
  let exampleScript = `<script src="${bundleFile}"></script>`;
  if (isModule) {
    exampleScript = `<script type="module" src="${bundleFile}"></script>`;
  }
  if (inlineScript) {
    exampleScript = `<script>${inlineScript}</script>`;
  }

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
    <script>
      window.global = window.global || {};
    </script>
    ${exampleScript}
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

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeByExt = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return mimeByExt[ext] || 'application/octet-stream';
}

function toDataUri(filePath, source) {
  return `data:${getMimeType(filePath)};base64,${source.toString('base64')}`;
}

function assetLoader({ inline = false } = {}) {
  const assetRegex = /\.(png|jpe?g)$/i;

  return {
    name: inline ? 'asset-loader-inline' : 'asset-loader',
    async load(id) {
      if (!assetRegex.test(id)) {
        return null;
      }

      const source = await fs.readFile(id);
      if (inline) {
        return `export default ${JSON.stringify(toDataUri(id, source))};`;
      }
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

function inlineCssUrls() {
  const cssFileRegex = /\.css$/i;
  const urlRegex = /url\((['"]?)([^'")]+)\1\)/g;
  return {
    name: 'inline-css-urls',
    async transform(code, id) {
      if (!cssFileRegex.test(id)) {
        return null;
      }

      const matches = Array.from(code.matchAll(urlRegex));
      if (!matches.length) {
        return null;
      }

      const replacements = await Promise.all(
        matches.map(async ([fullMatch, quote, rawUrl]) => {
          const assetUrl = rawUrl.trim();
          if (
            assetUrl.startsWith('data:') ||
            assetUrl.startsWith('http://') ||
            assetUrl.startsWith('https://') ||
            assetUrl.startsWith('//')
          ) {
            return { fullMatch, replacement: fullMatch };
          }

          const assetPath = path.resolve(path.dirname(id), assetUrl);
          try {
            const source = await fs.readFile(assetPath);
            const dataUrl = toDataUri(assetPath, source);
            return {
              fullMatch,
              replacement: `url(${quote}${dataUrl}${quote})`,
            };
          } catch (err) {
            return { fullMatch, replacement: fullMatch };
          }
        })
      );

      let transformed = code;
      replacements.forEach(({ fullMatch, replacement }) => {
        transformed = transformed.replace(fullMatch, replacement);
      });

      return {
        code: transformed,
        map: null,
      };
    },
  };
}

async function walkFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkFiles(fullPath, results);
      } else {
        results.push(fullPath);
      }
    })
  );
  return results;
}

async function copyApplicationStaticAssets(entryPath, outDir) {
  const sourceDir = path.dirname(entryPath);
  const assetRegex = /\.(png|jpe?g|gif|svg|webp)$/i;
  const files = await walkFiles(sourceDir);

  await Promise.all(
    files
      .filter((filePath) => assetRegex.test(filePath))
      .map(async (filePath) => {
        const relPath = path.relative(sourceDir, filePath);
        const destPath = path.resolve(outDir, relPath);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(filePath, destPath);
      })
  );
}

async function build() {
  const entries = await collectEntries();
  const distDir = path.resolve(DOCS_ROOT, '.vitepress', 'dist', 'examples');

  await fs.mkdir(distDir, { recursive: true });

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

  function createPlugins({ forInlineIife = false } = {}) {
    return [
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
      ...(forInlineIife ? [inlineCssUrls()] : []),
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
      assetLoader({ inline: forInlineIife }),
      replaceBasePath('/vtk-js'),
    ];
  }

  const applicationEntries = {};
  const esEntries = {};

  Object.entries(entries).forEach(([chunkName, entryPath]) => {
    const relPath = path.relative(REPO_ROOT, entryPath).replace(/\\/g, '/');
    console.log(`Processing example: ${chunkName} (${relPath})`);
    if (relPath.startsWith('Examples/Applications/')) {
      applicationEntries[chunkName] = entryPath;
    } else {
      esEntries[chunkName] = entryPath;
    }
  });

  if (Object.keys(esEntries).length) {
    const esBundle = await rollup({
      input: esEntries,
      plugins: createPlugins(),
    });

    await esBundle.write({
      dir: distDir,
      format: 'es',
      entryFileNames: '[name]/index.js',
      chunkFileNames: '_shared/[name]-[hash].js',
      assetFileNames: '_assets/[name]-[hash][extname]',
    });
    await esBundle.close();

    await Promise.all(
      Object.entries(esEntries).map(async ([chunkName, entryPath]) => {
        const outDir = path.resolve(distDir, chunkName);
        await fs.mkdir(outDir, { recursive: true });
        await copyApplicationStaticAssets(entryPath, outDir);
      })
    );
  }

  await Object.entries(applicationEntries).reduce(
    (chain, [chunkName, entryPath]) =>
      chain.then(async () => {
        const outDir = path.resolve(distDir, chunkName);

        await fs.mkdir(outDir, { recursive: true });
        const bundle = await rollup({
          input: entryPath,
          plugins: createPlugins({ forInlineIife: true }),
        });
        const { output } = await bundle.generate({
          format: 'iife',
          name: `${chunkName.replace(/[^\w$]/g, '_')}`,
          inlineDynamicImports: true,
        });
        await bundle.close();

        const appChunk = output.find((item) => item.type === 'chunk');
        if (!appChunk) {
          throw new Error(`Failed to generate inline IIFE for ${chunkName}`);
        }
        const inlineScript = appChunk.code.replace(
          /<\/script>/gi,
          '<\\/script>'
        );
        await fs.writeFile(
          path.resolve(outDir, 'index.html'),
          buildHtml(chunkName, './index.js', false, inlineScript),
          'utf8'
        );
      }),
    Promise.resolve()
  );

  await Promise.all(
    Object.keys(entries).map(async (chunkName) => {
      const outDir = path.resolve(distDir, chunkName);
      const bundleFile = './index.js';
      const isModule = !Object.hasOwn(applicationEntries, chunkName);
      if (!isModule) {
        return;
      }

      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(
        path.resolve(outDir, 'index.html'),
        buildHtml(chunkName, bundleFile, isModule),
        'utf8'
      );
    })
  );

  console.log(`Built ${Object.keys(entries).length} example(s) in ${distDir}`);

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
