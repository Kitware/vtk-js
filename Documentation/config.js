const vtkLoaders = require('../Utilities/config/webpack.loaders.js');

module.exports = {
  cname: 'kitware.github.io',
  baseUrl: '/vtk-js',
  work: './build-tmp',
  api: ['../Sources'],
  examples: ['../Sources', '../Examples'],
  config: {
    title: 'VTK.js',
    description: '"Visualization Toolkit for the Web."',
    subtitle: '"Enable scientific visualization to the Web."',
    author: 'Kitware Inc.',
    timezone: 'UTC',
    url: 'https://kitware.github.io/vtk-js',
    root: '/vtk-js/',
    github: 'kitware/vtk-js',
  },
  webpack: {
    module: {
      loaders: vtkLoaders,
    },
  },
  copy: [
    { src: '../Data/*', dest: './build-tmp/public/data' },
  ],
};
