const path = require('path');
const glob = require('glob');
const WebpackHtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const settings = require('./webpack.settings.js');

const rootPath = path.resolve('.');
const distDir = path.resolve(rootPath, settings.paths.examples.base);
const templatePath = path.resolve(
  rootPath,
  'Utilities/ExampleRunner/template.html'
);
const baseURL = settings.paths.examples.base;

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

function configureEntries() {
  const entries = {};

  glob.sync('Examples/**/index.js').forEach((entry) => {
    const exampleName = path.basename(path.dirname(entry));
    entries[exampleName] = path.resolve(rootPath, entry);
  });

  glob.sync('Sources/**/example/index.js').forEach((entry) => {
    const exampleName = path.basename(path.dirname(path.dirname(entry)));
    entries[exampleName] = path.resolve(rootPath, entry);
  });

  return entries;
}

function configureHtmlPlugins(entries) {
  return Object.keys(entries).map((chunkName) => {
    const entry = entries[chunkName];
    return new WebpackHtmlPlugin({
      filename: path.resolve(distDir, chunkName, 'index.html'),
      template: templatePath,
      chunks: [chunkName],
    });
  });
}

const entries = configureEntries();
const htmlPlugins = configureHtmlPlugins(entries);
const webpackConfig = {
  mode: 'production',
  entry: entries,
  output: {
    path: distDir,
    filename: '[name]/[name].js',
  },
  resolve: {
    alias: {
      '@kitware/vtk.js': path.resolve(__dirname, 'Sources'),
      'vtk.js': __dirname,
    },
    fallback: { stream: require.resolve('stream-browserify') },
  },
  module: {
    rules: [
      ...configureVtkRules(),
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.(png|jpg)$/i,
        type: 'asset',
      },
      {
        test: /\.(cj|h)son$/i,
        loader: 'hson-loader',
      },
    ],
  },
  plugins: [
    ...htmlPlugins,
    new webpack.DefinePlugin({
      __BASE_PATH__: "'" + baseURL + "'",
    }),
  ],
};

module.exports = webpackConfig;
