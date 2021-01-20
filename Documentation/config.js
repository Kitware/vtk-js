const path = require('path');

/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-useless-escape */

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
  parallelWebpack: {
    maxConcurrentWorkers: 2,
    rootPath: path.resolve(path.join(__dirname, '..')),
    templatePath: path.resolve(
      path.join(__dirname, '../Utilities/ExampleRunner/template.html')
    ),
    plugins: [],
    rules: [
      `
      { test: /\\.glsl$/i, loader: 'shader-loader' },
      {
        test: /\\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [["@babel/preset-env", { useBuiltIns: false }]]
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
        test: /\\.svg$/,
        use: [{ loader: 'raw-loader' }],
      },
      {
        test: /\\.worker\\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: { inline: 'no-fallback' },
          },
        ],
      },
      { test: /\\.(png|jpg)$/, use: 'url-loader?limit=81920' },
      { test: /\\.html$/, loader: 'html-loader' },
      { test: /\\.cjson$/, loader: 'hson-loader' },
      { test: /\\.hson$/, loader: 'hson-loader' },
      `,
    ],
    // Since vtk.js examples are written as if the vtk.js package is a dependency,
    // we need to resolve example imports as if they were referencing vtk.js/Sources.
    // the Examples/Utilities hack allows for imports from those folders, since our
    // last alias overrides vtk.js/* paths to point to vtk.js/Sources/*.
    alias: [
      "'vtk.js/Examples': `${rootPath}/Examples`,",
      "'vtk.js/Utilities': `${rootPath}/Utilities`,",
      "'vtk.js/Sources': `${rootPath}/Sources`,",
      "'vtk.js': `${rootPath}/Sources`,",
    ],
  },
  copy: [{ src: '../Data/*', dest: './build-tmp/public/data' }],
};
