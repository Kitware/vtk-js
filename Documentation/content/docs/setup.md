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

## Application

Here is an example of vtk.js application

```js src/index.js
import * as macro                 from 'vtk.js/Sources/macro';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera                  from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkSphereSource            from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkWarpScalar              from 'vtk.js/Sources/Filters/General/WarpScalar';

import controlPanel from './controller.html';

// Create some control UI
const rootContainer = document.querySelector('body');
rootContainer.innerHTML = controlPanel;
const renderWindowContainer = document.querySelector('.renderwidow');

const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 500);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 10);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const sphereSource = vtkSphereSource.newInstance({ thetaResolution: 40, phiResolution: 41 });
const filter = vtkWarpScalar.newInstance({ scaleFactor: 0, useNormal: false });

// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(inData[0].getPoints().getNumberOfTuples());
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = i % 2 ? 1 : 0;
      }

      const da = vtkDataArray.newInstance({ values: newArray });
      da.setName('spike');

      const outDS = inData[0].shallowCopy();
      outDS.getPointData().addArray(da);
      outDS.getPointData().setActiveScalars(da.getName());

      outData[0] = outDS;
    }
  };
})();

randFilter.setInputConnection(sphereSource.getOutputPort());
filter.setInputConnection(randFilter.getOutputPort());
mapper.setInputConnection(filter.getOutputPort());

// Select array to process
filter.setInputArrayToProcess(0, 'spike', 'PointData', 'Scalars');

// Initialize interactor and start
iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ----------------

// Warp setup
['scaleFactor'].forEach(propertyName => {
  document.querySelector(`.${propertyName}`).addEventListener('input', e => {
    const value = Number(e.target.value);
    filter.set({ [propertyName]: value });
    renWin.render();
  });
});

document.querySelector('.useNormal').addEventListener('change', e => {
  const useNormal = !!(e.target.checked);
  filter.set({ useNormal });
  renWin.render();
});

// Sphere setup
['radius', 'thetaResolution', 'phiResolution'].forEach(propertyName => {
  document.querySelector(`.${propertyName}`).addEventListener('input', e => {
    const value = Number(e.target.value);
    sphereSource.set({ [propertyName]: value });
    renWin.render();
  });
});
```
The control template:

```html src/controller.html
<table style="width: 400px;">
  <tr>
    <td>Radius</td>
    <td>
      <input class='radius' type="range" min="0.5" max="2.0" step="0.05" value="1.0" />
    </td>
  </tr>
  <tr>
    <td>Theta Resolution</td>
    <td>
      <input class='thetaResolution' type="range" min="4" max="100" step="1" value="40" />
    </td>
  </tr>
  <tr>
    <td>Phi Resolution</td>
    <td>
      <input class='phiResolution' type="range" min="4" max="100" step="1" value="41" />
    </td>
  </tr>
    <td>Warp Scale Factor</td>
    <td>
      <input class='scaleFactor' type='range' min='-1.0' max='1.0' step='0.01' value='0' />
    </td>
  </tr>
  <tr>
    <td>Warp use Normal</td>
    <td>
      <input class='useNormal' type="checkbox" />
    </td>
  </tr>
</table>
<div class='renderwidow' style="width: 400px;"></div>
```

The main web page loading the generated application.

```html dist/index.html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div class="content"></div>
  <script type="text/javascript" src="MyWebApp.js"></script></body>
</html>
```
