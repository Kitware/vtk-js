const vtkRules = require('../Utilities/config/rules-vtk.js');
const linterRules = require('../Utilities/config/rules-linter.js');
const examplesRules = require('../Utilities/config/rules-examples.js');

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
      rules: [].concat(linterRules, vtkRules, examplesRules),
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
