title: Setup
---

This documentation will explain how to create a new Web project that can leverage vtk-js.

``` bash
$ mkdir MyWebProject
$ cd MyWebProject
$ npm init

  This utility will walk you through creating a package.json file.
  It only covers the most common items, and tries to guess sensible defaults.
  
  See `npm help json` for definitive documentation on these fields
  and exactly what they do.
  
  Use `npm install <pkg> --save` afterwards to install a package and
  save it as a dependency in the package.json file.
  
  Press ^C at any time to quit.
  name: (MyWebProject) your-project-name
  version: (1.0.0) 0.0.1
  description: vtk.js application
  entry point: (index.js) src/index.js
  test command: 
  git repository: 
  keywords: Web visualization using VTK
  author: 
  license: (ISC) BSD-2-Clause
  About to write to /Users/seb/MyWebProject/package.json:
  
  {
    "name": "your-project-name",
    "version": "0.0.1",
    "description": "vtk.js application",
    "main": "src/index.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": [
      "Web",
      "visualization",
      "using",
      "VTK"
    ],
    "author": "",
    "license": "BSD-2-Clause"
  }
  
  
  Is this ok? (yes) 

$ npm install kitware/vtk-js --save-dev
$ npm install kw-web-suite --save-dev
```

## Webpack config

``` js webpack.config.js
var path = require('path'),
    webpack = require('webpack'),
    loaders = require('./node_modules/vtk.js/Utilities/config/webpack.loaders.js'),
    plugins = [];

if(process.env.NODE_ENV === 'production') {
    console.log('==> Production build');
    plugins.push(new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify("production"),
        },
    }));
}

module.exports = {
  plugins: plugins,
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'MyWebApp.js',
  },
  module: {
        preLoaders: [{
            test: /\.js$/,
            loader: "eslint-loader",
            exclude: /node_modules/,
        }],
        loaders: [
            { test: require.resolve("./src/index.js"), loader: "expose?MyWebApp" },
        ].concat(loaders),
    },
    postcss: [
        require('autoprefixer')({ browsers: ['last 2 versions'] }),
    ],
    eslint: {
        configFile: '.eslintrc.js',
    },
};

```

## package.json

You should extend the generated **package.json** file with the following set of scripts.

``` json package.json
{
  [...]
  "scripts": {
    "build": "webpack",
    "build:debug": "webpack --display-modules",
    "build:release": "export NODE_ENV=production && webpack -p",

    "commit": "git cz",
    "semantic-release": "semantic-release pre && npm publish && semantic-release post"
  },
}
```
