#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';

import { createVtkPlugins } from '../../Utilities/build/plugins.mjs';

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
    exampleScript = isModule
      ? `<script type="module">${inlineScript}</script>`
      : `<script>${inlineScript}</script>`;
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
        const relDir = path
          .relative(config.root, fullPath)
          .replace(/\\/g, '/');
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

// Standalone example HTML files have a single inline script (no <link>
// to a separate CSS asset), so any CSS Vite extracts must be inlined into
// the JS chunk. This plugin takes Vite's normal CSS Modules output and
// prepends a <style> injection IIFE per chunk, then drops the orphan asset.
function inlineExtractedCssPlugin() {
  return {
    name: 'vtk-inline-extracted-css',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        const importedCss = item.viteMetadata?.importedCss;
        if (!importedCss || importedCss.size === 0) continue;

        const cssTexts = [];
        for (const cssFile of importedCss) {
          const cssAsset = bundle[cssFile];
          if (cssAsset?.type === 'asset') {
            cssTexts.push(String(cssAsset.source));
            delete bundle[cssFile];
          }
        }
        if (cssTexts.length === 0) continue;

        const cssPayload = JSON.stringify(cssTexts.join('\n'));
        item.code =
          `if (typeof document !== 'undefined') {\n` +
          `  var __vtkStyle = document.createElement('style');\n` +
          `  __vtkStyle.textContent = ${cssPayload};\n` +
          `  (document.head || document.getElementsByTagName('head')[0]).appendChild(__vtkStyle);\n` +
          `}\n` +
          item.code;
      }
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

/**
 * Shared Vite config for building doc examples.
 */
function createSharedViteConfig() {
  return {
    configFile: false,
    root: REPO_ROOT,
    logLevel: 'warn',
    resolve: {
      alias: {
        '@kitware/vtk.js': path.resolve(REPO_ROOT, 'Sources'),
        'vtk.js': REPO_ROOT,
      },
    },
    define: {
      __BASE_PATH__: JSON.stringify('/vtk-js'),
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
  };
}

function createExamplePlugins() {
  return [
    ...createVtkPlugins({ includeCjson: true }),
    inlineExtractedCssPlugin(),
  ];
}

async function build() {
  const entries = await collectEntries();
  const distDir = path.resolve(DOCS_ROOT, '.vitepress', 'dist', 'examples');

  await fs.mkdir(distDir, { recursive: true });

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

  // Build ES module examples
  if (Object.keys(esEntries).length) {
    await viteBuild({
      ...createSharedViteConfig(),
      plugins: createExamplePlugins(),
      build: {
        outDir: distDir,
        emptyOutDir: false,
        minify: false,
        // Inline CSS-referenced assets as data URIs. The CSS itself is
        // inlined into the JS chunk by inlineExtractedCssPlugin; any
        // extracted asset (e.g. background-image url()) would otherwise
        // be served from an absolute path that doesn't resolve under
        // VitePress's base prefix.
        assetsInlineLimit: Infinity,
        rollupOptions: {
          input: esEntries,
          output: {
            format: 'es',
            entryFileNames: '[name]/index.js',
            chunkFileNames: '_shared/[name]-[hash].js',
            assetFileNames: '_assets/[name]-[hash][extname]',
          },
        },
      },
    });

    await Promise.all(
      Object.entries(esEntries).map(async ([chunkName, entryPath]) => {
        const outDir = path.resolve(distDir, chunkName);
        await fs.mkdir(outDir, { recursive: true });
        await copyApplicationStaticAssets(entryPath, outDir);
      })
    );
  }

  // Build Application examples (single file inline bundles)
  for (const [chunkName, entryPath] of Object.entries(applicationEntries)) {
    const outDir = path.resolve(distDir, chunkName);
    await fs.mkdir(outDir, { recursive: true });

    const result = await viteBuild({
      ...createSharedViteConfig(),
      plugins: createExamplePlugins(),
      build: {
        write: false,
        minify: 'esbuild',
        assetsInlineLimit: Infinity,
        rollupOptions: {
          input: entryPath,
          output: {
            format: 'es',
            codeSplitting: false,
          },
        },
      },
    });

    const output = Array.isArray(result) ? result[0].output : result.output;
    const appChunk = output.find((item) => item.type === 'chunk');
    if (!appChunk) {
      throw new Error(`Failed to generate inline module for ${chunkName}`);
    }

    const inlineScript = appChunk.code.replace(/<\/script>/gi, '<\\/script>');
    await fs.writeFile(
      path.resolve(outDir, 'index.html'),
      buildHtml(chunkName, './index.js', true, inlineScript),
      'utf8'
    );
  }

  // Write HTML wrappers for ES module examples
  await Promise.all(
    Object.keys(entries).map(async (chunkName) => {
      if (Object.hasOwn(applicationEntries, chunkName)) {
        return;
      }

      const outDir = path.resolve(distDir, chunkName);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(
        path.resolve(outDir, 'index.html'),
        buildHtml(chunkName, './index.js', true),
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
