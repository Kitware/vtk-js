const vtkLoaders = require('../Utilities/config/webpack.loaders.js');
const path = require('path');

module.exports = {
  baseUrl: '/vtk-js',
  work: './build-tmp',
  api: ['../Sources'],
  examples: [{ path: '../Examples', regexp: 'index.js' }, '../Sources'],
  config: {
    title: 'vtk.js',
    description: '"Visualization Toolkit for the Web."',
    subtitle: '"Enable scientific visualization to the Web."',
    author: 'Kitware Inc.',
    timezone: 'UTC',
    url: 'https://kitware.github.io/vtk-js',
    root: '/vtk-js/',
    github: 'kitware/vtk-js',
    google_analytics: 'UA-90338862-1',
  },
  webpack: {
    module: {
      loaders: vtkLoaders,
    },
    resolve: {
      alias: {
        'vtk.js': path.resolve('.'),
      },
    },
  },
  copy: [
    { src: '../Data/*', dest: './build-tmp/public/data' },
  ],
};
