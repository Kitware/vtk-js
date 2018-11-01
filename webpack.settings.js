// load local environment variables
require('dotenv').config();

// Webpack settings exports
module.exports = {
  name: 'vtk.js',
  copyright: 'Kitware, Inc.',
  paths: {
    src: {
      base: './Sources/',
    },
    dist: {
      base: './dist/',
    },
  },
  urls: {
    publicPath: '/dist/',
  },
  entries: {
    vtk: 'index.js',
  },
  devServerConfig: {
    public: () => process.env.DEVSERVER_PUBLIC || 'http://localhost:8080',
    host: () => process.env.DEVSERVER_HOST || 'localhost',
    port: () => process.env.DEVSERVER_PORT || 9999,
  },
  options: {
    openAnalyzer: () => process.env.BUNDLE_ANALYZER || false,
  },
};
