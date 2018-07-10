title: Creating a new example in vtk.js
---

This guide illustrates how to add an example to the vtk.js repository and how to run and debug it.

First each VTK class can have one example but many examples can be added using the standalone approach.

## Class example

In order to add an example to a specific class, you need to create an __example__ directory underneath the class directory and add an __index.js__ to it.

That example will be automatically picked up when building the website and will be gathered underneath the __kit/module__ group of the class with the name of the class being the name of the example.

## Standalone example

Sometime, we want to build an example to illustrate a more complex usage that should not be necessarely associated with a vtkClass. For that you can create your own container that should be underneath the __Examples__ directory at the root of the repository.

Our current structure is as follows:

- Examples
  - Serialization
    - Actor
      - index.js
  - WebGL
    - Cone
      - index.js
    - StandaloneSceneLoader
      - index.js
    - Texture
      - index.js

Those examples will be automatically picked up when building the website and will be gathered in groups like described below:

- Examples/Serialization
  - Actor
- Examples/WebGL
  - Cone
  - StandaloneSceneLoader
  - Texture

Which means the sub-directory of the __Examples__ directory correspond to a group name and each directory underneath it correspond to an example where the name of that directory correspond to the name of that example.

## Running an example

To simplify the development and execution of examples we have a script that let you list all the examples and run a given one using the webpack dev server which will automatically rebuild the code while running when you are editing any file that get involved in it.

To list the examples you can run the following command:

```sh
$ npm run example
```

Then, based on the list of examples you get, you can run a given one by providing its name as argument like the following:

```sh
$ npm run example -- ConeSource
```

Then the example could be seen at the following URL where standard debug tools could be used within your browser:

```sh
http://localhost:9999/
```
