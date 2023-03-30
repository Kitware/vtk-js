// node modules
const path = require('path');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');

// webpack plugins
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// config files
const common = require('./webpack.common.js');
const settings = require('./webpack.settings.js');

// Configure Bundle Analyzer
function configureBundleAnalyzer(name) {
  return {
    analyzerMode: 'static',
    reportFilename: `${name}-bundle.html`,
    openAnalyzer: settings.options.openAnalyzer(),
    generateStatsFile: false,
  };
}

// Configure optimization
function configureOptimization() {
  return {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions:{
          output:{
            comments: /@license/i
          }
        },
        exclude: [
          // do not minify Sources/ and Utilities/ dirs
          /Sources\//,
          /Utilities\//,
        ],
        extractComments: false,
      }),
    ],
  };
}

// Production module exports
module.exports = [
  merge(common.baseConfig, {
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(),
    plugins: [
      new webpack.BannerPlugin(
        `@license\n ${fs.readFileSync(path.resolve(__dirname, './LICENSE'), 'utf8')}`
      ),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new BundleAnalyzerPlugin(configureBundleAnalyzer('vtk')),
    ],
  }),
  merge(common.liteConfig, {
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(),
    plugins: [
      new webpack.BannerPlugin(
        `@license\n ${fs.readFileSync(path.resolve(__dirname, './LICENSE'), 'utf8')}`
      ),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new BundleAnalyzerPlugin(configureBundleAnalyzer('vtk-lite')),
    ],
  }),
];
