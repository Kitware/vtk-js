import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkPaintFilter from 'vtk.js/Sources/Filters/General/PaintFilter';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import baseline from './baseline.png';

test.onlyIfWebGL(
  'Test vtkPaintFilter ellipse on images with large spacing',
  (t) => {
    const spacing = 1000;
    const zSlice = 400;
    const radius = 10;
    const size = 50;
    const ellipseCenter = [(size / 2) * spacing, (size / 2) * spacing, zSlice];
    const ellipseScale = [radius * spacing, 2 * radius * spacing, 10];

    const gc = testUtils.createGarbageCollector(t);

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

    const backgroundSource = gc.registerResource(
      vtkRTAnalyticSource.newInstance()
    );
    backgroundSource.setWholeExtent([0, size, 0, size, 0, size]);
    backgroundSource.update();
    const backgroundImage = backgroundSource.getOutputData();
    backgroundImage.setSpacing([spacing, spacing, spacing]);
    const backgroundMapper = gc.registerResource(
      vtkImageMapper.newInstance({
        interpolateScalarsBeforeMapping: true,
      })
    );
    backgroundMapper.setSlicingMode(vtkImageMapper.SlicingMode.Z);
    backgroundMapper.setInputData(backgroundImage);
    backgroundMapper.setZSlice(zSlice);

    const backgroundActor = gc.registerResource(vtkImageSlice.newInstance());
    backgroundActor.setMapper(backgroundMapper);
    backgroundActor.getProperty().setInterpolationTypeToNearest();

    const paintFilter = gc.registerResource(vtkPaintFilter.newInstance());
    paintFilter.setBackgroundImage(backgroundSource.getOutputData());
    paintFilter.update();
    paintFilter.setLabel(1);
    paintFilter.startStroke();
    paintFilter.paintEllipse(ellipseCenter, ellipseScale);

    const labelMapMapper = gc.registerResource(vtkImageMapper.newInstance());
    labelMapMapper.setSlicingMode(vtkImageMapper.SlicingMode.Z);
    labelMapMapper.setInputConnection(paintFilter.getOutputPort());
    labelMapMapper.setZSlice(zSlice);

    const labelMapActor = gc.registerResource(vtkImageSlice.newInstance());
    labelMapActor.setMapper(labelMapMapper);
    labelMapActor.getProperty().setInterpolationTypeToNearest();

    const colorFunction = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    colorFunction.addRGBPoint(1, 1.0, 0.0, 0.0);

    const opacityFunction = gc.registerResource(
      vtkPiecewiseFunction.newInstance()
    );
    opacityFunction.addPoint(0, 0);
    opacityFunction.addPoint(1, 1);

    labelMapActor.getProperty().setRGBTransferFunction(colorFunction);
    labelMapActor.getProperty().setScalarOpacity(opacityFunction);
    labelMapActor.getProperty().setOpacity(0.65);

    renderer.addViewProp(backgroundActor);
    renderer.addViewProp(labelMapActor);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    paintFilter.endStroke().then(() => {
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Filters/General/PaintFilter/test/testPaintEllipse',
          t,
          1,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  }
);
