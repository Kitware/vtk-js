title: Building vtk.js
---

VTK.js is a library and should be used as ES6 dependency. However, it is worth building vtk.js to validate the style and to generate the JavaScript file for external script usage as described [here](intro_vtk_as_external_script.html).

The library can be built with webpack automatically. Webpack can either gather all the source files and concatenate them with little modification, or it can build it for production which will minify the generated file.

## Building vtk.js

First, install dependencies by running `npm install`.

In order to build the library, you can run `npm run build` to build both the ES Module (`@kitware/vtk.js`) and UMD+Sources (`vtk.js`) packages for production usage. Both builds will be located in `dist/esm` and `dist/umd`, respectively. If you only want either the ESM or UMD+Sources build, you can run `npm run build:esm` or `npm run build:umd`, respectively.

For development purposes, you can run `npm run dev:esm` or `npm run dev:umd` to start a build process that watches the project for changes.

## Building the website

VTK.js comes with its tools to build the website that get published on [github.io](https://kitware.github.io/vtk-js/) which enables you to write documentation and see what it will look like once published.

In order to run the tests and build the full website with its examples you can run the following command:

```sh
$ npm run doc:www
```

You will be able to browse the content on `http://localhost:4000/vtk-js` which will contains the test results and coverage.

But if you want to skip the tests you can run the following command:

```sh
$ npm run doc -- -s
```

And if you want to skip tests and examples:

```sh
$ npm run doc -- -s -f ExampleNameThatDoesNotExist
```

`ExampleNameThatDoesNotExist` can be replaced by multiple real example names and the doc tool will only build those examples.

## Building versus installing

When you use vtk.js as a dependency in your project (e.g. [like this](https://kitware.github.io/vtk-js/docs/vtk_vanilla.html)) you are pulling a package that was put together by the continuous integration. When developing vtk.js, you will have to put that package together yourself, and we call that "building."
