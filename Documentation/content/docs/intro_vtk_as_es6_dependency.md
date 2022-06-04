title: Using vtk.js as an ES dependency
---

This guide illustrates how to consume vtk.js as an ES dependency.

This document was last updated with the following package versions:
- `@kitware/vtk.js@v19`
- `webpack@v5`

## Starting a new vtk.js project

There are several ways to start a new vtk.js project. Below lists a few ways you can begin using vtk.js with your favorite project build tool.

- [vtk.js from scratch (with webpack)](./vtk_vanilla.html)
- [vtk.js with React](./vtk_react.html)
- [vtk.js with vue](./vtk_vue.html)

## Adding vtk.js to an existing project

You can add vtk.js to an existing project as follows:

```sh
$ npm install --save @kitware/vtk.js
```

### Package differences between `vtk.js` vs `@kitware/vtk.js`

Both packages are updated to the same version, so using one or the other will not affect the features provided. They do differ in how they are consumed.

`@kitware/vtk.js` is the ES module build of vtk.js. This build is designed to remove the additional build config required to use the original `vtk.js.`. You will most likely want to use this package, as there are no extra build config steps required after installation.

**Important**: Please refer to the "Migrating from vtk.js to @kitware/vtk.js" section below on some information regarding changes to import paths.

`vtk.js` provides the UMD package, but for a while provided the older means of consuming vtk.js. The older approach required additional webpack configuration in order to process the glsl, worker, and js files in vtk.js. It is strongly recommended to instead use `@kitware/vtk.js`, but if you cannot migrate or need to use the original `vtk.js` package, then check out [how to use the old `vtk.js` package](./old_intro_vtk_es6.html).

### Migrating from `vtk.js` to `@kitware/vtk.js`

The `@kitware/vtk.js` package makes some slight, yet major, changes to how vtk.js components are imported. Instead of importing from `/Sources/`, all component paths are relative to the package root, like so:

```diff
-import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
+import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
```

**Important**: For every vtk.js example you encounter, be sure to rewrite the imports to match the vtk.js package that you are using.

Furthermore, you no longer need to require and add `vtkRules` into your webpack config.

```diff
-var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;
 module.exports = {
   module: {
-    rules: [...yourRules, ...vtkRules],
+    rules: yourRules,
  }
 }
```

## Using vtk.js

vtk.js is comprised of many different modules that are organized in several different folders. Below is an overview of where you can find certain classes.

- Common: core classes including vtkImageData and vtkPolyData
- Filters: data processing, manipulation, and generation
- Interaction: interaction helpers
- IO: reading and writing common data types
- Rendering: rendering core
- Widgets: interactive widget manipulation

For example, to use the vtkPolyData class, you will need the following import:

```js
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
```

To see actual usage of vtk.js, check out one of the [start-from-scratch links](#Starting-a-new-vtk-js-project).
To learn more about vtk.js, check out our [tutorials](./tutorial.html).

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
        { test: /\.(png|jpg)$/, type: 'asset' },
        { test: /\.svg$/, type: 'asset/source' },
    ].concat(vtkRules, cssRules),
  },

[...]
```

Another possible issue is the fact that some relative import can not be resolved. In which case, you should copy those files to your local `./src/` directory and fix the actual import path.

And if you didn't skip any piece you should be all set and ready to run that new code base.
