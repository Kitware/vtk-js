title: (Old approach) Transpiling vtk.js manually
---

This guide illustrates how to consume vtk.js by way of transpiling. Please note that this method is *discouraged*, and it is recommended instead to follow [the modern approach outlined in the introduction](./intro_vtk_as_es6_dependency.html).

## Which package to use

In order to take the transpilation approach, you must use the `vtk.js` package instead of `@kitware/vtk.js`. This will also impact your imports; imports will now be prefixed with `vtk.js/Sources`, as shown below.

```diff
-import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
+import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
```

## Transpiling vtk.js code

We primarily support webpack for transpiling vtk.js. The generic structure of the webpack structure is listed below, with comments.

``` js ./webpack.config.js
// Required in order to build vtk.js alongside your project
var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

// Optional if you want to load *.css and *.module.css files
// var cssRules = require('vtk.js/Utilities/config/dependency.js').webpack.css.rules;

module.exports = {
  ...
  module: {
    rules: [
      ...yourRules,
    // This is needed to include vtk.js build rules
    ].concat(vtkRules),
  },
  ...
};
```

### With vue-cli

If you are using `vue-cli`, then you will need to have the following `vue.config.js`:

```js
const vtkChainWebpack = require('vtk.js/Utilities/config/chainWebpack');

module.exports = {
  ...
  chainWebpack: (config) => {
    vtkChainWebpack(config);
    // do not cache worker files
    // https://github.com/webpack-contrib/worker-loader/issues/195
    config.module.rule('js').exclude.add(/\.worker\.js$/);
  },
  ...
};
```

### with create-react-app

If you are using `create-react-app` or `react-app-rewired`, you will need to override the default build config. Specifically, there is a `file-loader` rule that outputs assets to `static/media/*`. In order for vtk.js glsl files to not be split out (since vtk.js does dynamic shader generation), you will need to add an exclude condition to that `file-loader`, like so:

```js
{
  loader: 'file-loader',
  exclude: [
    ...,
    /node_modules[\/\\]vtk\.js[\/\\]/,
  ],
  ...
}
```
