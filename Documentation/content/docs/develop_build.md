title: Building vtk.js
---

VTK.js is a library and should be used as ES6 dependency. However, it is worth building vtk.js to validate the style and to generate the JavaScript file for external script usage as described [here](intro_vtk_as_external_script.html).

The library can be built with webpack automatically. Webpack can either gather all the source files and concatenate them with little modification, or it can build it for production which will minify the generated file.

## Building vtk.js

In order to build the library you can run `npm run build` for quick development usage or `npm run build:release` for production usage.

{% note warn For Windows users %}
You cannot use the previous command line for building a production ready bundle.
Instead you will need to run: `npm run build -- -p`
{% endnote %}

Either of these commands will generate a `dist/vtk.js` file that can then be used as an external script.

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

`ExampleNameThatDoesNotExist` can be replaced by multilpe real example names and the doc tool will only build those examples.
