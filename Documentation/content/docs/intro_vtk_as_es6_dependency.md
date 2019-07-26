title: Using vtk.js as an ES6 dependency
---

This guide illustrates how to build an application using vtk.js as a dependency using a modern toolsets such as Webpack, NPM.

## Creation of the Project structure

```sh
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
  About to write to /.../MyWebProject/package.json:

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
```

Then install and save your dependencies

```sh
$ npm install vtk.js --save
$ npm install kw-web-suite --save-dev
```

## Webpack config

``` js ./webpack.config.js
var path = require('path');
var webpack = require('webpack');
var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

// Optional if you want to load *.css and *.module.css files
// var cssRules = require('vtk.js/Utilities/config/dependency.js').webpack.css.rules;

var entry = path.join(__dirname, './src/index.js');
const sourcePath = path.join(__dirname, './src');
const outputPath = path.join(__dirname, './dist');

module.exports = {
  entry,
  output: {
    path: outputPath,
    filename: 'MyWebApp.js',
  },
  module: {
    rules: [
        { test: /\.html$/, loader: 'html-loader' },
    ].concat(vtkRules),
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      sourcePath,
    ],
  },
};
```

## package.json

You should extend the generated **package.json** file with the following set of scripts.

```json ./package.json
{
  [...],
  "scripts": {
    "build": "webpack --progress --colors --mode development",
    "build:release": "webpack --progress --colors --mode production",
    "start": "webpack-dev-server --content-base ./dist",

    "commit": "git cz",
    "semantic-release": "semantic-release"
  }
}
```

## Application

Here is an example of a vtk.js application similar to an [example](https://kitware.github.io/vtk-js/examples/ConeSource.html) available within the source code.

```js ./src/index.js
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkActor           from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator      from 'vtk.js/Sources/Filters/General/Calculator';
import vtkConeSource      from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper          from 'vtk.js/Sources/Rendering/Core/Mapper';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const filter = vtkCalculator.newInstance();

filter.setInputConnection(coneSource.getOutputPort());
filter.setFormula({
  getArrays: inputDataSets => ({
    input: [],
    output: [
      { location: FieldDataTypes.CELL, name: 'Random', dataType: 'Float32Array', attribute: AttributeTypes.SCALARS },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    const [scalars] = arraysOut.map(d => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filter.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renderWindow.render();
});
```

The control template:

```html ./src/controller.html
<table>
  <tr>
    <td>
      <select class='representations' style="width: 100%">
        <option value='0'>Points</option>
        <option value='1'>Wireframe</option>
        <option value='2' selected>Surface</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <input class='resolution' type='range' min='4' max='80' value='6' />
    </td>
  </tr>
</table>
```

The main web page loading the generated application.

```html ./dist/index.html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <script type="text/javascript" src="MyWebApp.js"></script>
  </body>
</html>
```
## Build the application

```sh
$ npm run build
```

## Start a dev WebServer

```sh
$ npm start
```

Open your browser at `http://localhost:8080/`

## How to try another example

Now that you have the base structure for building ES6 code with vtk.js you may want to try out some other example.

If you want to list all the existing examples you can run the following command on any Unix base system. This is just to show where they are located.

```
$ find node_modules/vtk.js | grep -i example | grep index.js

node_modules/vtk.js/Sources/Filters/Core/Cutter/example/index.js
node_modules/vtk.js/Sources/Filters/General/OutlineFilter/example/index.js
node_modules/vtk.js/Sources/Filters/General/ScalarToRGBA/example/index.js
[...]
```

Once you figure out which one you want to try in your project, you can run the following command lines to replace your current code base with any new example.

```
$ rm -rf ./src/*
$ cp ./node_modules/vtk.js/Examples/Applications/GeometryViewer/* ./src/
```

At that point the rules that are currently defined in your `./webpack.config.js` could already be good, but it is also possible that some loaders may be missing due to other imports.

In that specific example, that is indeed the case. Therefore, the set of rules needs to be extended.

To add the missing one just edit the following section of your `./webpack.config.js`.

```./webpack.config.js
[...]

// Optional if you want to load *.css and *.module.css files
var cssRules = require('vtk.js/Utilities/config/dependency.js').webpack.css.rules;

[...]

  module: {
    rules: [
        { test: /\.html$/, loader: 'html-loader' },
        { test: /\.(png|jpg)$/, use: 'url-loader?limit=81920' },
        { test: /\.svg$/, use: [{ loader: 'raw-loader' }] },
    ].concat(vtkRules, cssRules),
  },

[...]
```

Another possible issue is the fact that some relative import can not be resolved. In which case, you should copy those files to your local `./src/` directory and fix the actual import path.

And if you didn't skip any piece you should be allset and ready to run that new code base.
