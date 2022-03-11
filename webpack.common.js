// node modules
const path = require('path');
const { merge } = require('webpack-merge');

// webpack plugins
const CopyPlugin = require('copy-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');

// config files
const pkg = require('./package.json');
const settings = require('./webpack.settings.js');

const absolutifyImports = require('./Utilities/build/rewrite-imports.js');

// basic regex for matching imports
const importRegex = /(?:import|from) ['"]([^'"]*)['"]/g;

// Configure Entries
const configureEntries = () => {
  const entries = {};
  const keys = Object.keys(settings.entries);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = settings.entries[key];
    entries[key] = path.resolve(__dirname, settings.paths.src.base + value);
  }
  return entries;
};

// Configure vtk rules
function configureVtkRules() {
  return [
    {
      test: /\.glsl$/i,
      loader: 'shader-loader',
    },
    {
      test: /\.js$/,
      include: path.resolve(__dirname, 'Sources'),
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      ],
    },
    {
      test: /\.css$/,
      exclude: /\.module\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
        { loader: 'postcss-loader' },
      ],
    },
    {
      test: /\.module\.css$/,
      use: [
        { loader: 'style-loader' },
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
            },
          },
        },
        { loader: 'postcss-loader' },
      ],
    },
    {
      test: /\.svg$/,
      type: 'asset/source',
    },
    {
      test: /\.worker\.js$/,
      use: [{ loader: 'worker-loader', options: { inline: 'no-fallback' } }],
    },
  ];
}

// The base webpack config
const baseConfig = {
  name: pkg.name,
  entry: configureEntries(),
  output: {
    path: path.resolve(__dirname, settings.paths.dist.base),
    publicPath: settings.urls.publicPath,
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      'vtk.js': __dirname,
    },
    fallback: { stream: require.resolve('stream-browserify') },
  },
  module: {
    rules: configureVtkRules(),
  },
  plugins: [
    !process.env.NOLINT && new ESLintWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: 'Sources/**/*',
          globOptions: {
            dot: true,
            gitignore: true,
            ignore: [
              '**/test/**',
              '**/example/**',
              '**/example_/**',
              '**/*.md',
            ],
          },
          transform(content, absoluteFrom) {
            // transforms typescript defs to use absolute imports
            if (absoluteFrom.endsWith('.d.ts')) {
              return absolutifyImports(content.toString(), (relImport) => {
                const importPath = path.join(path.dirname(absoluteFrom), relImport);
                return path.join('vtk.js', path.relative(__dirname, importPath));
              });
            }
            return content;
          }
        },
        { from: 'Utilities/prepare.js', to: 'Utilities/prepare.js' },
        { from: 'Utilities/XMLConverter', to: 'Utilities/XMLConverter' },
        { from: 'Utilities/DataGenerator', to: 'Utilities/DataGenerator' },
        { from: 'Utilities/config', to: 'Utilities/config' },
        { from: 'Utilities/build/macro-shim.d.ts', to: 'Sources/macro.d.ts' },
        { from: 'Utilities/build/macro-shim.js', to: 'Sources/macro.js' },
        { from: '*.txt' },
        { from: '*.md' },
        { from: 'LICENSE' },
        { from: '.npmignore' },
        {
          from: 'package.json',
          transform(content) {
            const pkg = JSON.parse(content);
            pkg.name = 'vtk.js';
            pkg.main = './vtk.js';
            delete pkg.module;
            return JSON.stringify(pkg, null, 2);
          }
        },
      ],
    }),
    new WebpackNotifierPlugin({
      title: 'Webpack - vtk.js',
      excludeWarnings: true,
      alwaysNotify: true,
    }),
  ].filter(Boolean),
};

// vtk-lite.js
// => Smaller list of color maps
// => Remove
//   - PDBReader
//   - MoleculeToRepresentation
//   - webvr-polyfill
//   - Logo.svg
//   - MobileVR
const liteConfig = merge(
  {
    module: {
      rules: [
        {
          test: /MobileVR/,
          loader: 'ignore-loader',
        },
        {
          test: /Logo\.svg/,
          loader: 'ignore-loader',
        },
        {
          test: /MoleculeToRepresentation/,
          loader: 'ignore-loader',
        },
        {
          test: /PDBReader/,
          loader: 'ignore-loader',
        },
        { test: /webvr-polyfill/, loader: 'ignore-loader' },
      ],
    },
    resolve: {
      alias: {
        'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json': path.join(
          __dirname,
          'Sources/Rendering/Core/ColorTransferFunction/LiteColorMaps.json'
        ),
      },
      fallback: { stream: require.resolve('stream-browserify') },
    },
  },
  baseConfig,
  {
    output: {
      filename: '[name]-lite.js',
    },
  }
);

// Common module exports
module.exports = {
  baseConfig,
  liteConfig,
};
