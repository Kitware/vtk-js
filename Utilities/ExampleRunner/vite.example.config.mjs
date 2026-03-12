import { defineConfig } from 'vite';
import path from 'path';
import {
  glslPlugin,
  svgRawPlugin,
  cjsonPlugin,
  workerInlinePlugin,
  ignorePlugin,
  serveStaticDataPlugin,
} from '../rollup/plugins.js';

const repoRoot = process.env.EXAMPLE_REPO_ROOT || path.resolve(__dirname, '../..');
const exampleEntry = process.env.EXAMPLE_ENTRY;
const exampleName = process.env.EXAMPLE_NAME || 'Example';
const host = process.env.EXAMPLE_HOST || '0.0.0.0';
const port = Number(process.env.EXAMPLE_PORT || '3000');
const openBrowser = process.env.EXAMPLE_OPEN === '1';
const useHttps = process.env.EXAMPLE_HTTPS === '1';

if (!exampleEntry) {
  throw new Error(
    'Missing EXAMPLE_ENTRY. Run examples through Utilities/ExampleRunner/example-runner-cli.js'
  );
}

function toViteFsPath(filePath) {
  return `/@fs/${filePath.replace(/\\/g, '/')}`;
}

export default defineConfig({
  root: path.resolve(repoRoot, 'Utilities/ExampleRunner'),
  resolve: {
    alias: {
      'vtk.js': repoRoot,
      '@kitware/vtk.js': path.resolve(repoRoot, 'Sources'),
    },
  },
  define: {
    __BASE_PATH__: JSON.stringify(''),
    global: 'globalThis',
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    host,
    port,
    open: openBrowser,
    https: useHttps,
    fs: {
      allow: [repoRoot],
    },
  },
  plugins: [
    workerInlinePlugin(),
    glslPlugin(),
    svgRawPlugin(),
    cjsonPlugin(),
    ignorePlugin(['crypto']),
    serveStaticDataPlugin(repoRoot),
    {
      name: 'vtk-example-runner-entry',
      resolveId(id) {
        if (id === 'virtual:vtk-example-entry') {
          return '\0virtual:vtk-example-entry';
        }
        return null;
      },
      load(id) {
        if (id === '\0virtual:vtk-example-entry') {
          return `import ${JSON.stringify(toViteFsPath(exampleEntry))};`;
        }
        return null;
      },
      transformIndexHtml(html) {
        return html.replace(/__EXAMPLE_TITLE__/g, exampleName);
      },
    },
  ],
});
