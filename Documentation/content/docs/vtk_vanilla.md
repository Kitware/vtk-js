title: Starting a vtk.js project from scratch
---

This is a quickstart tutorial for using vanilla vtk.js.

## Initialize your project

Let's start by initializing a new project.

```sh
$ mkdir my-vtkjs-app
$ cd my-vtkjs-app
$ npm init
...
```

Now install `@kitware/vtk.js` as a dependency.

```sh
$ npm install @kitware/vtk.js
```

For this example, we will be using webpack to build our application.
If you are using other bundlers (e.g. parcel, rollup, etc.), please refer to the "Getting Started" tutorials there before skipping down to [how to use vtk.js](#Using-vtk-js-in-your-app).

```sh
$ npm install -D webpack-cli webpack webpack-dev-server
```

## Project scaffolding

We need to take care of some project scaffolding first. Let's first create some directories.

```sh
$ mkdir dist/ src/
```

Inside `dist/`, we will create an `index.html`.

```html ./dist/index.html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <script src="./main.js"></script>
  </body>
</html>
```

Additionally, we will add some scripts to make our lives easier for running build commands.
Inside `package.json`, add the following lines in the scripts object.

```diff
   "scripts": {
+    "build": "webpack --progress --mode=development",
+    "start": "webpack serve --progress --mode=development --static=dist",
     "test": "echo \"Error: no test specified\" && exit 1"
   }
```

## Using vtk.js in your app

Add the following code to `src/index.js`.

```js
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor           from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper          from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkCalculator      from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource      from '@kitware/vtk.js/Filters/Sources/ConeSource';
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';

const controlPanel = `
<table>
  <tr>
    <td>
      <select class="representations" style="width: 100%">
        <option value="0">Points</option>
        <option value="1">Wireframe</option>
        <option value="2" selected>Surface</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <input class="resolution" type="range" min="4" max="80" value="6" />
    </td>
  </tr>
</table>
`;

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

## Running the app

After adding the source file, run the app with the webpack dev server.

```sh
$ npm run start
```

Navigate to `http://localhost:8080`, and you should have an interactive 3D visualization of a cone, similar to the [SimpleCone](../examples/SimpleCone.html) example.

## Where to go next

Check out the [tutorials](./tutorial.html), or if you know what you want but need API docs, check out the [API](../api).
