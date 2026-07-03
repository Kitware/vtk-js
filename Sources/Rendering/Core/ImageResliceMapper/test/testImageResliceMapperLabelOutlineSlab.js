import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/OpenGL/Profiles/All';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import { SlabTypes } from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';

import baseline from './testImageResliceMapperLabelOutlineSlab.png';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test ImageResliceMapper LabelOutline with slab projection',
  async () => {
    const gc = testUtils.createGarbageCollector();
    expect(
      'rendering',
      'vtkImageResliceMapper testImageResliceMapperLabelOutlineSlab'
    ).toBeTruthy();

    const bodyElem = document.querySelector('body');
    const container = gc.registerDOMElement(document.createElement('div'));
    bodyElem.appendChild(container);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(container);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0.3, 0.3, 0.3);

    const imageDimension = 48;

    // Background image with gradient, rendered as a full-extent MAX slab
    const bgImage = gc.registerResource(vtkImageData.newInstance());
    bgImage.setDimensions(imageDimension, imageDimension, imageDimension);
    bgImage.setSpacing(1, 1, 1);
    bgImage.setOrigin(0, 0, 0);

    const bgValues = new Uint8Array(imageDimension ** 3);
    for (let k = 0; k < imageDimension; k++) {
      for (let j = 0; j < imageDimension; j++) {
        for (let i = 0; i < imageDimension; i++) {
          const idx = i + imageDimension * (j + imageDimension * k);
          bgValues[idx] = Math.floor(((i + j) / (2 * imageDimension)) * 255);
        }
      }
    }

    const bgScalars = gc.registerResource(
      vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: bgValues,
      })
    );
    bgImage.getPointData().setScalars(bgScalars);

    // Labelmap with two spherical segments placed AWAY from the slice plane
    // (z = 10): label 1 around z = 5, label 2 around z = 15. Their outlines can
    // only appear through the slab projection of label presence.
    const labelImage = gc.registerResource(vtkImageData.newInstance());
    labelImage.setDimensions(imageDimension, imageDimension, imageDimension);
    labelImage.setSpacing(1, 1, 1);
    labelImage.setOrigin(0, 0, 0);

    const sphereCenters = [
      { c: [15, 24, 12], r: 9, label: 1 },
      { c: [33, 24, 36], r: 9, label: 2 },
    ];
    const labelValues = new Uint8Array(imageDimension ** 3);
    sphereCenters.forEach(({ c, r, label }) => {
      for (let k = 0; k < imageDimension; k++) {
        for (let j = 0; j < imageDimension; j++) {
          for (let i = 0; i < imageDimension; i++) {
            const dx = i - c[0];
            const dy = j - c[1];
            const dz = k - c[2];
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= r) {
              const idx = i + imageDimension * (j + imageDimension * k);
              labelValues[idx] = label;
            }
          }
        }
      }
    });

    const labelScalars = gc.registerResource(
      vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: labelValues,
      })
    );
    labelImage.getPointData().setScalars(labelScalars);

    // Shared slice plane through the volume center
    const slicePlane = gc.registerResource(vtkPlane.newInstance());
    slicePlane.setNormal(0, 0, 1);
    slicePlane.setOrigin(bgImage.getCenter());

    // Background pipeline
    const bgMapper = gc.registerResource(vtkImageResliceMapper.newInstance());
    bgMapper.setSlicePlane(slicePlane);
    bgMapper.setSlabType(SlabTypes.MAX);
    bgMapper.setSlabThickness(imageDimension);
    bgMapper.setInputData(bgImage);

    const bgPpty = gc.registerResource(vtkImageProperty.newInstance());
    bgPpty.setColorWindow(255);
    bgPpty.setColorLevel(127);

    const bgActor = gc.registerResource(vtkImageSlice.newInstance());
    bgActor.setMapper(bgMapper);
    bgActor.setProperty(bgPpty);
    renderer.addActor(bgActor);

    // Labelmap pipeline (single component, dependent components) over the
    // same slab
    const labelMapper = gc.registerResource(
      vtkImageResliceMapper.newInstance()
    );
    labelMapper.setSlicePlane(slicePlane);
    labelMapper.setSlabType(SlabTypes.MAX);
    labelMapper.setSlabThickness(imageDimension);
    labelMapper.setInputData(labelImage);

    const labelPpty = gc.registerResource(vtkImageProperty.newInstance());
    labelPpty.setIndependentComponents(false);
    labelPpty.setUseLookupTableScalarRange(true);
    labelPpty.setInterpolationTypeToNearest();
    labelPpty.setUseLabelOutline(true);
    labelPpty.setLabelOutlineThickness([1, 2]);
    labelPpty.setLabelOutlineOpacity(1.0);

    const labelRgb = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    labelRgb.addRGBPoint(0, 0, 0, 0);
    labelRgb.addRGBPoint(1, 1, 0, 0); // Red
    labelRgb.addRGBPoint(2, 0, 1, 0); // Green
    labelPpty.setRGBTransferFunction(0, labelRgb);

    const labelOfun = gc.registerResource(vtkPiecewiseFunction.newInstance());
    labelOfun.addPoint(0, 0);
    labelOfun.addPoint(1, 0.3);
    labelOfun.addPoint(2, 0.3);
    labelPpty.setPiecewiseFunction(0, labelOfun);

    const labelActor = gc.registerResource(vtkImageSlice.newInstance());
    labelActor.setMapper(labelMapper);
    labelActor.setProperty(labelPpty);
    renderer.addActor(labelActor);

    renderer.resetCamera();
    renderer.getActiveCamera().dolly(1.6);
    renderer.resetCameraClippingRange();

    const promise = glwindow.captureNextImage().then((image) =>
      testUtils.compareImages(
        image,
        [baseline],
        'Rendering/Core/ImageResliceMapper',
        {
          pixelThreshold: 0.005,
          mismatchTolerance: 2,
        }
      )
    );
    renderWindow.render();
    await promise;

    gc.releaseResources();
  }
);
