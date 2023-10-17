import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkView2DProxy from 'vtk.js/Sources/Proxy/Core/View2DProxy';

import baseline from './viewProxy2D.png';

test.onlyIfWebGL(
  'Test vtkProxy2D Rendering with vtkImageSlice representation',
  (t) => {
    const gc = testUtils.createGarbageCollector(t);
    t.ok('rendering', 'vtkView2DProxy Rendering');

    const source = gc.registerResource(vtkRTAnalyticSource.newInstance());
    const size = 50;
    source.setWholeExtent([0, size, 0, size, 0, size]);
    source.update();

    const image = source.getOutputData();
    const spacing = 0.7;
    image.setSpacing([spacing, spacing, spacing]);

    const reslice = gc.registerResource(vtkImageReslice.newInstance());
    reslice.setInputData(image);

    const mapper = gc.registerResource(vtkImageMapper.newInstance());
    mapper.setInputConnection(reslice.getOutputPort());

    const actor = gc.registerResource(vtkImageSlice.newInstance());
    actor.setMapper(mapper);

    const viewProxy = gc.registerResource(
      vtkView2DProxy.newInstance({
        useParallelRendering: true,
        axis: undefined,
        fitProps: true,
      })
    );
    viewProxy.addRepresentation(actor);

    const container = gc.registerDOMElement(document.createElement('div'));
    document.body.appendChild(container);

    viewProxy.setContainer(container);
    viewProxy.resize();
    viewProxy.resetCamera();

    const glWindow = viewProxy.getRenderer().getRenderWindow().getViews()[0];
    glWindow.setSize(400, 400);
    glWindow.captureNextImage().then((capturedImage) => {
      testUtils.compareImages(
        capturedImage,
        [baseline],
        'Proxy/Core/View2DProxy/testView2DProxy',
        t,
        5,
        gc.releaseResources
      );
    });
    glWindow.render();
  }
);
