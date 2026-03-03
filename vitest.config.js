import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';
import {
  glslPlugin,
  svgRawPlugin,
  cjsonPlugin,
  workerInlinePlugin,
  ignorePlugin,
  serveStaticDataPlugin,
} from './Utilities/rollup/plugins.js';

const noWebGL = !!process.env.NO_WEBGL;
const webGPU = !!process.env.WEBGPU;
const testBrowser = process.env.TEST_BROWSER || 'chrome';
const ci = !!process.env.CI;

function buildBrowserInstances() {
  if (ci) {
    console.log('Running tests in CI mode');
    return [
      {
        browser: 'chromium',
        launch: {
          headless: true,
          args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
        },
      },
      { browser: 'firefox', launch: { headless: true } },
    ];
  }
  const launchOptions = {};
  return [{ browser: testBrowser, launch: launchOptions }];
}

export default defineConfig({
  resolve: {
    alias: {
      'vtk.js': path.resolve(import.meta.dirname),
    },
  },
  optimizeDeps: {
    include: ['webworker-promise/lib/register'],
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  define: {
    __BASE_PATH__: JSON.stringify(''),
    __VTK_TEST_NO_WEBGL__: JSON.stringify(noWebGL),
    __VTK_TEST_WEBGPU__: JSON.stringify(webGPU),
    global: 'globalThis',
  },
  plugins: [
    workerInlinePlugin(),
    glslPlugin(),
    svgRawPlugin(),
    cjsonPlugin(),
    ignorePlugin(['crypto']),
    serveStaticDataPlugin(import.meta.dirname),
  ],
  test: {
    include: ['Sources/**/test*.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'Sources/Testing/testUtils.js',
      'Sources/Testing/setupTestEnv.js',
    ],
    setupFiles: ['Sources/Testing/setupTestEnv.js'],
    testTimeout: 60000,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'Utilities/TestResults/junit-report.xml',
    },
    browser: {
      enabled: true,
      provider: playwright(),
      instances: buildBrowserInstances(),
    },
  },
});
