import * as path from 'path';
import * as glob from 'glob';

import autoprefixer from 'autoprefixer';
import MagicString from 'magic-string';

import alias from '@rollup/plugin-alias';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import ignore from 'rollup-plugin-ignore';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import replace from 'rollup-plugin-re';
import { string } from 'rollup-plugin-string';
import svgo from 'rollup-plugin-svgo';
import webworkerLoader from 'rollup-plugin-web-worker-loader';

const IGNORE_LIST = [
  /(\/|\\)example_?(\/|\\)/,
  /(\/|\\)test/,
  /^Sources(\/|\\)(Testing|ThirdParty)/,
];

/**
 * find: RegExp | String
 * replace: String
 */
function rewriteFilenames(pluginOptions) {
  const opts = {
    ...pluginOptions,
    find: new RegExp(pluginOptions.find),
  };
  return {
    name: 'rewrite-filenames',
    generateBundle(outputOptions, bundle, isWrite) {
      const files = Object.keys(bundle);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const info = bundle[file];

        if (opts.find.test(file)) {
          const newFileName = file.replace(opts.find, opts.replace);
          info.fileName = newFileName;
          bundle[newFileName] = info;
          delete bundle[file];
        }

        // search contents for offending import filenames
        const importRe = new RegExp(
          '(import .+? from\\s*["\'])(.+?)(["\']\\s*;?)',
          'g'
        );

        let match;
        do {
          match = importRe.exec(info.code);
          if (match) {
            const target = match[2];
            const start = match.index + match[1].length;
            const end = start + target.length;
            if (opts.find.test(target)) {
              const magicCode = new MagicString(info.code);
              const newTarget = target.replace(opts.find, opts.replace);
              magicCode.overwrite(start, end, newTarget);
              info.code = magicCode.toString();
            }
          }
        } while (match);
      }
    },
  };
}

function ignoreFile(name, ignoreList = IGNORE_LIST) {
  return ignoreList.some((toMatch) => {
    if (toMatch instanceof RegExp) {
      return toMatch.test(name);
    }
    if (toMatch instanceof String) {
      return toMatch === name;
    }
    return false;
  });
}

const entries = glob.sync('Sources/**/index.js').reduce((acc, file) => {
  if (!ignoreFile(file)) {
    acc[file] = path.resolve(__dirname, file);
  }
  return acc;
}, {});

['Sources/macro.js', 'Sources/vtk.js', 'Sources/favicon.js'].forEach((file) =>
  Object.assign(entries, {
    [file]: path.resolve(__dirname, file),
  })
);

export default {
  input: entries,
  output: {
    dir: 'dist/esm/',
    format: 'es',
    entryFileNames: (chunkInfo) => path.basename(chunkInfo.name),
    preserveModules: true,
    preserveModulesRoot: 'Sources',
  },
  external: [/@babel\/runtime/],
  plugins: [
    // should be before commonjs
    replace({
      patterns: [
        {
          // match against jszip/lib/load.js
          // Workaround until https://github.com/Stuk/jszip/pull/731 is merged
          include: path.resolve(
            __dirname,
            'node_modules',
            'jszip',
            'lib',
            'load.js'
          ),
          test: /'use strict';\nvar utils = require\('.\/utils'\);/m,
          replace: "'use strict'",
        },
        {
          // match against jszip/lib/compressedObject.js
          // Workaround until https://github.com/Stuk/jszip/pull/731 is merged
          include: path.resolve(
            __dirname,
            'node_modules',
            'jszip',
            'lib',
            'compressedObject.js'
          ),
          test: /Crc32Probe'\);\nvar DataLengthProbe = require\('.\/stream\/DataLengthProbe'\);/m,
          replace: "Crc32Probe');\n",
        },
      ],
    }),
    alias({
      entries: [
        { find: 'vtk.js', replacement: path.resolve(__dirname) },
        { find: 'stream', replacement: require.resolve('stream-browserify') },
      ],
    }),
    // ignore crypto module
    ignore(['crypto']),
    // needs to be before nodeResolve
    webworkerLoader({
      targetPlatform: 'browser',
      // needs to match the full import statement path
      pattern: /^.+\.worker(?:\.js)?$/,
      inline: false,
      preserveFileNames: true,
      outputFolder: 'WebWorkers',
    }),
    nodeResolve({
      // don't rely on node builtins for web
      preferBuiltins: false,
      browser: true,
    }),
    !process.env.NOLINT &&
      eslint({
        include: '**/*.js',
        exclude: 'node_modules/**',
      }),
    // commonjs should be before babel
    commonjs({
      dynamicRequireTargets: [
        // handle a dynamic require circular dependency in readable-stream
        'node_modules/readable-stream/lib/_stream_duplex.js',
      ],
      // dynamicRequireTargets implies transformMixedEsModules because
      // dynamicRequireTargets generates mixed modules
      transformMixedEsModules: true,
    }),
    babel({
      include: 'Sources/**',
      exclude: 'node_modules/**',
      extensions: ['.js'],
      babelHelpers: 'runtime',
    }),
    string({
      include: '**/*.glsl',
    }),
    json(),
    svgo(),
    postcss({
      modules: true,
      plugins: [autoprefixer],
    }),
    // windows ntfs hates colons in filenames,
    // and node-resolve and web-worker-loader are notorious for
    // inserting them into virtual modules that are written out
    // to the filesystem via preserveModules: true.
    rewriteFilenames({
      find: /:/g,
      replace: '_',
    }),
  ],
};
