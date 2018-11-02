// node modules
const path = require('path');
const merge = require('webpack-merge');

// webpack plugins
const WebpackNotifierPlugin = require('webpack-notifier');

// config files
const pkg = require('./package.json');
const settings = require('./webpack.settings.js');

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
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
      enforce: 'pre',
      options: { configFile: path.join(__dirname, '.eslintrc.js') },
    },
    {
      test: /\.glsl$/i,
      loader: 'shader-loader',
    },
    {
      test: /\.js$/,
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
            localIdentName: '[name]-[local]_[sha512:hash:base64:5]',
            modules: true,
          },
        },
        { loader: 'postcss-loader' },
      ],
    },
    {
      test: /\.svg$/,
      use: [{ loader: 'raw-loader' }],
    },
    {
      test: /\.worker\.js$/,
      use: [
        { loader: 'worker-loader', options: { inline: true, fallback: false } },
      ],
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
  },
  module: {
    rules: configureVtkRules(),
  },
  plugins: [
    new WebpackNotifierPlugin({
      title: 'Webpack - vtk.js',
      excludeWarnings: true,
      alwaysNotify: true,
    }),
  ],
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
