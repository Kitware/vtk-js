import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import baselineNoExtras from './testScalarBarNoExtras.png';
import baselineNoExtras2 from './testScalarBarNoExtras2.png';

test.onlyIfWebGL(
  'Test vtkScalarBarActor Rendering without extra colors"',
  (t) => {
    const gc = testUtils.createGarbageCollector(t);
    t.ok('rendering', 'vtkScalarBarActor Rendering');

    // Create some control UI
    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    // create what we will view
    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0.32, 0.34, 0.43);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 300);

    // Create color tf
    const colorTransferFunction = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    colorTransferFunction.setUseBelowRangeColor(true);
    colorTransferFunction.setUseAboveRangeColor(true);
    colorTransferFunction.setNanColor(0.8, 0.8, 0.6, 1.0);
    colorTransferFunction.addRGBPoint(0.0, 1.0, 0.2, 0.2);
    colorTransferFunction.addRGBPoint(0.5, 0.2, 1.0, 0.2);
    colorTransferFunction.addRGBPoint(1.0, 0.2, 0.2, 1.0);

    // Initialize scalar bar
    const scalarBarActor = gc.registerResource(vtkScalarBarActor.newInstance());
    scalarBarActor.setScalarsToColors(colorTransferFunction);
    scalarBarActor.setDrawNanAnnotation(false);
    scalarBarActor.setDrawBelowRangeSwatch(false);
    scalarBarActor.setDrawAboveRangeSwatch(false);

    renderer.addActor(scalarBarActor);

    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baselineNoExtras, baselineNoExtras2],
        'Rendering/Core/ScalarBarActor/testScalarBarActorNoExtras',
        t,
        0.5,
        gc.releaseResources
      );
    });
    renderWindow.render();
  }
);
