import path from 'path';
import {
  glslPlugin,
  svgRawPlugin,
  cjsonPlugin,
  workerInlinePlugin,
  ignorePlugin,
  serveStaticDataPlugin,
} from '../build/plugins.mjs';

function toViteFsPath(filePath) {
  return `/@fs/${filePath.replace(/\\/g, '/')}`;
}

/**
 * Build a Vite inline config for serving a single vtk.js example.
 */
export function createExampleConfig({
  repoRoot,
  entry,
  name = 'Example',
  host = '0.0.0.0',
  port = 3000,
  openBrowser = false,
  useHttps = false,
}) {
  if (!entry) {
    throw new Error('createExampleConfig: `entry` is required');
  }
  if (!repoRoot) {
    throw new Error('createExampleConfig: `repoRoot` is required');
  }

  return {
    configFile: false,
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
            return `import ${JSON.stringify(toViteFsPath(entry))};`;
          }
          return null;
        },
        transformIndexHtml(html) {
          return html.replace(/__EXAMPLE_TITLE__/g, name);
        },
      },
    ],
  };
}
