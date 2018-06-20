title: Creating a test in vtk.js
---

This guide illustrates how to add tests to the vtk.js repository and how to run and debug them.

First each VTK class can have several tests spread among several files but we also have infrastructure for global tests which live inside __Sources/Testing/test*.js__.

## Class tests

In order to add test to vtk.js you will need to create a __test__ directory underneath your class directory.

That __test__ directory should contain as many test file as you like with their associated baselines if any. By convention we expect each test file to be prefixed with __test__ similar to *testDataArray.js*.

## Testing plain JavaScript

Some vtkClass'es don't necessarily involve rendering and can be tested without a WebGL environment. In which case a plain JavaScript test could be written as follows and an additional test() function could be added within the same file:

```js ClassName/test/testExample.js
import test from 'tape-catch';

import vtkMyClass from '..';

test('Validate vtkMyClass properties', (t) => {
  const myInstance = vtkMyClass.newInstance();
  t.ok(myInstance, 'got a vtkMyClass instance');

  // Validate default properties
  const prop1 = myInstance.getProp1();
  const prop2 = myInstance.getProp2();
  const prop3 = myInstance.getProp3();

  t.equal(prop1, 'prop1 default value', 'Prop1 has expected default');
  t.equal(prop2, 2, 'Prop2 has expected default');
  t.deepEqual(prop3, [1, 2, 3], 'Prop3 has expected default');

  // Current test done
  t.end();
});
```

## Testing rendering with image comparison

```js ClassName/test/testRendering.js
import test from 'tape-catch';

import vtkOpenGLRenderWindow from '../../../../Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../Rendering/Core/Renderer';
import vtkConeSource from '../../../../Filters/Sources/ConeSource';
import vtkActor from '../../../../Rendering/Core/Actor';
import vtkMapper from '../../../../Rendering/Core/Mapper';

import baseline from './testClassName.png';
import testUtils from '../../../../Testing/testUtils';

test.onlyIfWebGL('Test vtkClassName Rendering', (t) => {
  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = vtkActor.newInstance();
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const coneSource = vtkConeSource.newInstance({ height: 1.0 });
  mapper.setInputConnection(coneSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    // compareImages(image, baselines, testName, tapeContext, threshold = 5, nextCallback = null)
    testUtils.compareImages(image, [baseline], 'Filters/Sources/ConeSource/', t);
  });
  renderWindow.render();
});
```

## Registering a test

As opposed to examples and api documentation, tests won't be picked up automatically and it is the responsability of the author to register it on the test suite.
_This may change as the project evolves._

To add a test to the suite, you need to import it inside `Sources/tests.js`.

## Running all the tests

In order to run all the registered test, run the following command:

```sh
$ npm run test
```

That command can also be written as `npm t` or `npm test` however it will run all tests.

## Running a single test for debugging

Since we have single entry points for all the tests we run, you can comment out every file except the one you want to run inside `Sources/tests.js`.

Then executing `npm t` will only run that file, but if you want to open a browser and debug the actual code, you can do it with the following command:

```sh
$ npm run test:debug
```

This will automatically open a browser and run the test. But you can manually open `http://localhost:9876/debug.html` with any browser and start debugging.

Moreover, when doing some rendering that's a great way for building your baseline image.

## Creating a new baseline image

Follow the following procedure to create a new baseline or change an existing baseline for a test.

- Add an invalid baseline (any PNG file) and rename it as the required baseline.
  For example, to create a baseline for `testCylinder.js` copy *testCone.png* to *Sources/Filters/Sources/CylinderSource/test/testCylinder.png*.
- Run the test as per [Running a single test for debugging](#Running-a-single-test-for-debugging). The test should fail because of the invalid baseline. 
- The test execution creates a file **Documentation/content/coverage/tests.md**.
  Rename this file as **tests.html** and open it in the browser.
- The file should show the test output versus the invalid baseline image.
  Right-click on the test output image and save it as the valid baseline.
- Re-run the test to ensure that it passes with the valid baseline.
- Commit the baseline image to the git source tree. 
