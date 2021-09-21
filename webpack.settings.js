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
      base: './dist/umd/',
    },
  },
  urls: {
    publicPath: '/dist/umd/',
  },
  entries: {
    vtk: 'index.js',
  },
  devServerConfig: {
    host: () => process.env.DEVSERVER_HOST || '0.0.0.0',
    port: () => process.env.DEVSERVER_PORT || 9999,
    ws: {
      hostname: 'localhost',
      pathname: '/ws',
      port: 8080,
    },
  },
  options: {
    openAnalyzer: () => process.env.BUNDLE_ANALYZER || false,
  },
};
