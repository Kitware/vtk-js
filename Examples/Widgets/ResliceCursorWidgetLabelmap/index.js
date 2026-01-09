import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkImageProperty from '@kitware/vtk.js/Rendering/Core/ImageProperty';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import { CaptureOn } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import { InterpolationType } from '@kitware/vtk.js/Rendering/Core/ImageProperty/Constants';
import { SlabTypes } from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper/Constants';
import {
  xyzToViewType,
  InteractionMethodsName,
} from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants';

import GUI from 'lil-gui';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Define main attributes
// ----------------------------------------------------------------------------

const viewColors = [
  [1, 0, 0], // sagittal
  [0, 1, 0], // coronal
  [0, 0, 1], // axial
  [0.5, 0.5, 0.5], // 3D
];

const viewAttributes = [];
window.va = viewAttributes;
const widget = vtkResliceCursorWidget.newInstance();
window.widget = widget;
const widgetState = widget.getWidgetState();
widgetState
  .getStatesWithLabel('sphere')
  .forEach((handle) => handle.setScale1(20));
const showDebugActors = true;

const appCursorStyles = {
  translateCenter: 'move',
  rotateLine: 'alias',
  translateAxis: 'pointer',
  default: 'default',
};

// ----------------------------------------------------------------------------
// Define html structure
// ----------------------------------------------------------------------------

const container = document.querySelector('body');
container.style.margin = '0';
container.style.padding = '0';
container.style.overflow = 'hidden';

const guiParams = {
  Translation: true,
  ShowRotation: true,
  Rotation: true,
  KeepOrthogonality: true,
  ScaleInPixels: true,
  Opacity: 255,
  SlabMode: 'MAX',
  SlabThickness: 0,
  Interpolation: 'Linear',
  WindowLevel: true,
  // Labelmap params
  showLabelmap: true,
  useLabelOutline: true,
  outlineThickness: 2,
  outlineOpacity: 1.0,
  fillOpacity: 0.3,
  labelmapResolution: 2,
};

// ----------------------------------------------------------------------------
// Create labelmap from source image
// ----------------------------------------------------------------------------

function createLabelMapFromImage(srcImage, resolutionFactor = 2) {
  const srcDims = srcImage.getDimensions();
  const srcSpacing = srcImage.getSpacing();
  const origin = srcImage.getOrigin();
  const direction = srcImage.getDirection();

  const dims = [
    Math.max(1, Math.floor(srcDims[0] / resolutionFactor)),
    Math.max(1, Math.floor(srcDims[1] / resolutionFactor)),
    Math.max(1, Math.floor(srcDims[2] / resolutionFactor)),
  ];
  const spacing = [
    srcSpacing[0] * resolutionFactor,
    srcSpacing[1] * resolutionFactor,
    srcSpacing[2] * resolutionFactor,
  ];

  const labelMap = vtkImageData.newInstance();
  labelMap.setDimensions(dims);
  labelMap.setSpacing(spacing);
  labelMap.setOrigin(origin);
  labelMap.setDirection(direction);

  const numVoxels = dims[0] * dims[1] * dims[2];
  const labelValues = new Uint8Array(numVoxels);

  const centerI = Math.floor(dims[0] / 2);
  const centerJ = Math.floor(dims[1] / 2);
  const centerK = Math.floor(dims[2] / 2);
  const minDim = Math.min(dims[0], dims[1], dims[2]);

  const sphereRadius = minDim * 0.35;
  const cubeHalfSize = minDim * 0.2;
  const cylinderRadius = minDim * 0.15;
  const cylinderHalfHeight = minDim * 0.3;

  const sphereCenter = [centerI, centerJ, centerK];
  const cubeCenter = [
    centerI - minDim * 0.25,
    centerJ - minDim * 0.25,
    centerK,
  ];
  const cylinderCenter = [
    centerI + minDim * 0.25,
    centerJ + minDim * 0.25,
    centerK,
  ];

  for (let k = 0; k < dims[2]; k++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const idx = i + j * dims[0] + k * dims[0] * dims[1];
        let label = 0;

        const dx = i - sphereCenter[0];
        const dy = j - sphereCenter[1];
        const dz = k - sphereCenter[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq <= sphereRadius * sphereRadius) {
          label = 1;
        } else {
          const cubeX = Math.abs(i - cubeCenter[0]);
          const cubeY = Math.abs(j - cubeCenter[1]);
          const cubeZ = Math.abs(k - cubeCenter[2]);
          if (
            cubeX <= cubeHalfSize &&
            cubeY <= cubeHalfSize &&
            cubeZ <= cubeHalfSize
          ) {
            label = 2;
          } else {
            const cylX = i - cylinderCenter[0];
            const cylY = j - cylinderCenter[1];
            const cylZ = Math.abs(k - cylinderCenter[2]);
            const cylDistSq = cylX * cylX + cylY * cylY;
            if (
              cylDistSq <= cylinderRadius * cylinderRadius &&
              cylZ <= cylinderHalfHeight
            ) {
              label = 3;
            }
          }
        }

        labelValues[idx] = label;
      }
    }
  }

  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: labelValues,
    name: 'LabelMap',
  });
  labelMap.getPointData().setScalars(dataArray);

  return labelMap;
}

// ----------------------------------------------------------------------------
// Setup rendering code
// ----------------------------------------------------------------------------

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(
    rgb[2] * 255
  ).toString()})`;
}

const initialPlanesState = { ...widgetState.getPlanes() };

// Create properties for background (input 0) and labelmap (input 1)
function createImageProperties() {
  // Background image property
  const bgPpty = vtkImageProperty.newInstance();
  const bgRgb = vtkColorTransferFunction.newInstance();
  bgRgb.addRGBPoint(0, 0, 0, 0);
  bgRgb.addRGBPoint(255, 1, 1, 1);
  bgPpty.setRGBTransferFunction(bgRgb);

  const bgOfun = vtkPiecewiseFunction.newInstance();
  bgOfun.addPoint(0, 1);
  bgOfun.addPoint(255, 1);
  bgPpty.setPiecewiseFunction(bgOfun);
  bgPpty.setColorWindow(255);
  bgPpty.setColorLevel(127.5);
  bgPpty.setInterpolationType(InterpolationType.LINEAR);
  bgPpty.setIndependentComponents(true);

  // Labelmap property
  const labelPpty = vtkImageProperty.newInstance();
  const labelRgb = vtkColorTransferFunction.newInstance();
  labelRgb.addRGBPoint(0, 0, 0, 0);
  labelRgb.addRGBPoint(1, 1, 0.5, 0); // orange
  labelRgb.addRGBPoint(2, 0, 0.8, 0.2); // green
  labelRgb.addRGBPoint(3, 0.2, 0.5, 1); // blue
  labelPpty.setRGBTransferFunction(labelRgb);

  const labelOfun = vtkPiecewiseFunction.newInstance();
  labelOfun.addPoint(0, 0);
  labelOfun.addPoint(1, guiParams.fillOpacity);
  labelOfun.addPoint(2, guiParams.fillOpacity);
  labelOfun.addPoint(3, guiParams.fillOpacity);
  labelPpty.setPiecewiseFunction(labelOfun);

  labelPpty.setUseLabelOutline(guiParams.useLabelOutline);
  labelPpty.setLabelOutlineThickness([
    guiParams.outlineThickness,
    guiParams.outlineThickness,
    guiParams.outlineThickness,
    guiParams.outlineThickness,
  ]);
  labelPpty.setLabelOutlineOpacity(guiParams.outlineOpacity);
  labelPpty.setInterpolationType(InterpolationType.NEAREST);
  labelPpty.setIndependentComponents(true);
  labelPpty.setUseLookupTableScalarRange(true);

  return { bgPpty, labelPpty, bgRgb, labelRgb, bgOfun, labelOfun };
}

let view3D = null;
let sourceImage = null;
let labelMapImage = null;
const allProperties = [];

for (let i = 0; i < 4; i++) {
  const elementParent = document.createElement('div');
  elementParent.setAttribute('class', 'view');
  elementParent.style.width = '50%';
  elementParent.style.height = '50vh';
  elementParent.style.display = 'inline-block';

  const element = document.createElement('div');
  element.setAttribute('class', 'view');
  element.style.width = '100%';
  element.style.height = '100%';
  elementParent.appendChild(element);

  container.appendChild(elementParent);

  const grw = vtkGenericRenderWindow.newInstance();
  grw.setContainer(element);
  grw.resize();
  const obj = {
    renderWindow: grw.getRenderWindow(),
    renderer: grw.getRenderer(),
    GLWindow: grw.getApiSpecificRenderWindow(),
    interactor: grw.getInteractor(),
    widgetManager: vtkWidgetManager.newInstance(),
    orientationWidget: null,
  };

  obj.renderer.getActiveCamera().setParallelProjection(true);
  obj.renderer.setBackground(...viewColors[i]);
  obj.renderWindow.addRenderer(obj.renderer);
  obj.renderWindow.addView(obj.GLWindow);
  obj.renderWindow.setInteractor(obj.interactor);
  obj.interactor.setView(obj.GLWindow);
  obj.interactor.initialize();
  obj.interactor.bindEvents(element);
  obj.widgetManager.setRenderer(obj.renderer);
  if (i < 3) {
    obj.interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
    obj.widgetInstance = obj.widgetManager.addWidget(widget, xyzToViewType[i]);
    obj.widgetInstance.setScaleInPixels(true);
    obj.widgetInstance.setHoleWidth(50);
    obj.widgetInstance.setInfiniteLine(false);
    widgetState
      .getStatesWithLabel('line')
      .forEach((state) => state.setScale3(4, 4, 300));
    widgetState
      .getStatesWithLabel('center')
      .forEach((state) => state.setOpacity(128));
    obj.widgetInstance.setKeepOrthogonality(guiParams.KeepOrthogonality);
    obj.widgetInstance.setCursorStyles(appCursorStyles);
    obj.widgetManager.enablePicking();
    obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
  } else {
    obj.interactor.setInteractorStyle(
      vtkInteractorStyleTrackballCamera.newInstance()
    );
  }

  // Create ImageResliceMapper for each 2D view
  obj.resliceMapper = vtkImageResliceMapper.newInstance();
  obj.slicePlane = vtkPlane.newInstance();
  // Set default plane values based on view index
  const defaultNormals = [
    [1, 0, 0], // sagittal (YZ plane)
    [0, 1, 0], // coronal (XZ plane)
    [0, 0, 1], // axial (XY plane)
  ];
  obj.slicePlane.setOrigin(0, 0, 0);
  obj.slicePlane.setNormal(...(defaultNormals[i] || [0, 0, 1]));
  obj.resliceMapper.setSlicePlane(obj.slicePlane);
  obj.resliceMapper.setSlabType(SlabTypes.MAX);

  obj.resliceActor = vtkImageSlice.newInstance();
  obj.resliceActor.setMapper(obj.resliceMapper);
  obj.resliceActor.setVisibility(false);

  // Create properties for this view
  const props = createImageProperties();
  obj.bgPpty = props.bgPpty;
  obj.labelPpty = props.labelPpty;
  obj.bgOfun = props.bgOfun;
  obj.labelOfun = props.labelOfun;
  allProperties.push(props);

  obj.resliceActor.setProperty(0, obj.bgPpty);
  obj.resliceActor.setProperty(1, obj.labelPpty);

  obj.sphereActors = [];
  obj.sphereSources = [];

  for (let j = 0; j < 3; j++) {
    const sphere = vtkSphereSource.newInstance();
    sphere.setRadius(10);
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(sphere.getOutputPort());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(...viewColors[i]);
    actor.setVisibility(showDebugActors);
    obj.sphereActors.push(actor);
    obj.sphereSources.push(sphere);
  }

  if (i < 3) {
    viewAttributes.push(obj);
  } else {
    view3D = obj;
  }

  // Create axes
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: '+X',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceColor: createRGBStringFromRGBValues(viewColors[0]),
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  axes.setXMinusFaceProperty({
    text: '-X',
    faceColor: createRGBStringFromRGBValues(viewColors[0]),
    faceRotation: 90,
    fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: '+Y',
    faceColor: createRGBStringFromRGBValues(viewColors[1]),
    fontSizeScale: (res) => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: '-Y',
    faceColor: createRGBStringFromRGBValues(viewColors[1]),
    fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: '+Z',
    faceColor: createRGBStringFromRGBValues(viewColors[2]),
  });
  axes.setZMinusFaceProperty({
    text: '-Z',
    faceColor: createRGBStringFromRGBValues(viewColors[2]),
    faceRotation: 45,
  });

  obj.orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: obj.renderWindow.getInteractor(),
  });
  obj.orientationWidget.setEnabled(true);
  obj.orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
  );
  obj.orientationWidget.setViewportSize(0.15);
  obj.orientationWidget.setMinPixelSize(100);
  obj.orientationWidget.setMaxPixelSize(300);

  if (i < 3) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 200;
    slider.style.bottom = '0px';
    slider.style.width = '100%';
    elementParent.appendChild(slider);
    obj.slider = slider;

    slider.addEventListener('change', (ev) => {
      const newDistanceToP1 = ev.target.value;
      const dirProj = widget.getWidgetState().getPlanes()[
        xyzToViewType[i]
      ].normal;
      const planeExtremities = widget.getPlaneExtremities(xyzToViewType[i]);
      const newCenter = vtkMath.multiplyAccumulate(
        planeExtremities[0],
        dirProj,
        Number(newDistanceToP1),
        []
      );
      widget.setCenter(newCenter);
      obj.widgetInstance.invokeInteractionEvent(
        obj.widgetInstance.getActiveInteraction()
      );
      viewAttributes.forEach((obj2) => {
        obj2.interactor.render();
      });
    });
  }
}

// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------

function updateReslice(
  interactionContext = {
    viewType: '',
    mapper: null,
    slicePlane: null,
    actor: null,
    renderer: null,
    resetFocalPoint: false,
    computeFocalPointOffset: false,
    spheres: null,
    slider: null,
  }
) {
  const planeSource = widget.getPlaneSource(interactionContext.viewType);
  if (!planeSource) return false;

  const planeOrigin = planeSource.getOrigin();
  const p1 = planeSource.getPoint1();
  const p2 = planeSource.getPoint2();

  if (!planeOrigin || !p1 || !p2) {
    return false;
  }

  // Calculate normal from plane source axes
  const axis1 = [
    p1[0] - planeOrigin[0],
    p1[1] - planeOrigin[1],
    p1[2] - planeOrigin[2],
  ];
  const axis2 = [
    p2[0] - planeOrigin[0],
    p2[1] - planeOrigin[1],
    p2[2] - planeOrigin[2],
  ];
  const planeNormal = [];
  vtkMath.cross(axis1, axis2, planeNormal);
  vtkMath.normalize(planeNormal);

  // Use widget center as slice plane origin (not plane source corner)
  const widgetCenter = widgetState.getCenter();
  interactionContext.slicePlane.setOrigin(widgetCenter);
  interactionContext.slicePlane.setNormal(planeNormal);

  if (interactionContext.sphereSources) {
    interactionContext.sphereSources[0].setCenter(planeOrigin);
    interactionContext.sphereSources[1].setCenter(p1);
    interactionContext.sphereSources[2].setCenter(p2);
  }

  if (interactionContext.slider) {
    const planeExtremities = widget.getPlaneExtremities(
      interactionContext.viewType
    );
    if (planeExtremities) {
      const length = Math.sqrt(
        vtkMath.distance2BetweenPoints(planeExtremities[0], planeExtremities[1])
      );
      const dist = Math.sqrt(
        vtkMath.distance2BetweenPoints(
          planeExtremities[0],
          widgetState.getCenter()
        )
      );
      interactionContext.slider.min = 0;
      interactionContext.slider.max = length;
      interactionContext.slider.value = dist;
    }
  }

  widget.updateCameraPoints(
    interactionContext.renderer,
    interactionContext.viewType,
    interactionContext.resetFocalPoint,
    interactionContext.computeFocalPointOffset
  );
  view3D.renderWindow.render();
  return true;
}

function updateLabelmap(resolutionFactor = 2) {
  if (!sourceImage) return;

  labelMapImage = createLabelMapFromImage(sourceImage, resolutionFactor);

  viewAttributes.forEach((obj) => {
    obj.resliceMapper.setInputData(labelMapImage, 1);
  });

  console.log(
    `Labelmap resolution: ${labelMapImage.getDimensions().join('x')} ` +
      `(${resolutionFactor}x downsampled from source)`
  );

  viewAttributes.forEach((obj) => obj.renderWindow.render());
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    sourceImage = reader.getOutputData();
    widget.setImage(sourceImage);

    labelMapImage = createLabelMapFromImage(
      sourceImage,
      guiParams.labelmapResolution
    );

    console.log(
      `Source image resolution: ${sourceImage.getDimensions().join('x')}, ` +
        `Labelmap resolution: ${labelMapImage.getDimensions().join('x')}`
    );

    // Create image outline in 3D view
    const outline = vtkOutlineFilter.newInstance();
    outline.setInputData(sourceImage);
    const outlineMapper = vtkMapper.newInstance();
    outlineMapper.setInputData(outline.getOutputData());
    const outlineActor = vtkActor.newInstance();
    outlineActor.setMapper(outlineMapper);
    view3D.renderer.addActor(outlineActor);

    viewAttributes.forEach((obj, i) => {
      // Set background image as input 0
      obj.resliceMapper.setInputData(sourceImage);
      // Set labelmap as input 1
      obj.resliceMapper.addInputData(labelMapImage);

      // Now that data is loaded, show the actor
      obj.resliceActor.setVisibility(true);

      obj.renderer.addActor(obj.resliceActor);
      view3D.renderer.addActor(obj.resliceActor);
      obj.sphereActors.forEach((actor) => {
        obj.renderer.addActor(actor);
        view3D.renderer.addActor(actor);
      });

      const viewType = xyzToViewType[i];

      viewAttributes.forEach((v) => {
        v.widgetInstance.onStartInteractionEvent(() => {
          updateReslice({
            viewType,
            mapper: obj.resliceMapper,
            slicePlane: obj.slicePlane,
            actor: obj.resliceActor,
            renderer: obj.renderer,
            resetFocalPoint: false,
            computeFocalPointOffset: true,
            sphereSources: obj.sphereSources,
            slider: obj.slider,
          });
        });

        v.widgetInstance.onInteractionEvent((interactionMethodName) => {
          const canUpdateFocalPoint =
            interactionMethodName === InteractionMethodsName.RotateLine;
          const activeViewType = widget.getWidgetState().getActiveViewType();
          const computeFocalPointOffset =
            activeViewType === viewType || !canUpdateFocalPoint;
          updateReslice({
            viewType,
            mapper: obj.resliceMapper,
            slicePlane: obj.slicePlane,
            actor: obj.resliceActor,
            renderer: obj.renderer,
            resetFocalPoint: false,
            computeFocalPointOffset,
            sphereSources: obj.sphereSources,
            slider: obj.slider,
          });
        });
      });

      updateReslice({
        viewType,
        mapper: obj.resliceMapper,
        slicePlane: obj.slicePlane,
        actor: obj.resliceActor,
        renderer: obj.renderer,
        resetFocalPoint: true,
        computeFocalPointOffset: true,
        sphereSources: obj.sphereSources,
        slider: obj.slider,
      });
      obj.interactor.render();
    });

    view3D.renderer.resetCamera();
    view3D.renderer.resetCameraClippingRange();
  });
});

// ----------------------------------------------------------------------------
// Define panel interactions
// ----------------------------------------------------------------------------
function updateViews() {
  viewAttributes.forEach((obj, i) => {
    updateReslice({
      viewType: xyzToViewType[i],
      mapper: obj.resliceMapper,
      slicePlane: obj.slicePlane,
      actor: obj.resliceActor,
      renderer: obj.renderer,
      resetFocalPoint: true,
      computeFocalPointOffset: true,
      sphereSources: obj.sphereSources,
      resetViewUp: true,
    });
    obj.renderWindow.render();
  });
  view3D.renderer.resetCamera();
  view3D.renderer.resetCameraClippingRange();
}

// ----------------------------------------------------------------------------
// Panel interactions (lil-gui)
// ----------------------------------------------------------------------------

const gui = new GUI();

const interactionFolder = gui.addFolder('Interaction');
interactionFolder
  .add(guiParams, 'Translation')
  .name('Allow translation')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.widgetInstance?.setEnableTranslation(!!value);
    });
  });

interactionFolder
  .add(guiParams, 'ShowRotation')
  .name('Show rotation')
  .onChange((value) => {
    widgetState
      .getStatesWithLabel('rotation')
      .forEach((handle) => handle.setVisible(!!value));
    viewAttributes.forEach((obj) => {
      obj.interactor.render();
    });
  });

interactionFolder
  .add(guiParams, 'Rotation')
  .name('Allow rotation')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.widgetInstance?.setEnableRotation(!!value);
    });
  });

interactionFolder
  .add(guiParams, 'KeepOrthogonality')
  .name('Keep orthogonality')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.widgetInstance?.setKeepOrthogonality(!!value);
    });
  });

interactionFolder
  .add(guiParams, 'ScaleInPixels')
  .name('Scale in pixels')
  .onChange((value) => {
    widget.setScaleInPixels(!!value);
    viewAttributes.forEach((obj) => {
      obj.interactor.render();
    });
  });

const appearanceFolder = gui.addFolder('Appearance');
appearanceFolder
  .add(guiParams, 'Opacity', 0, 255, 1)
  .name('Handles opacity')
  .onChange((value) => {
    widgetState
      .getStatesWithLabel('handles')
      .forEach((handle) => handle.setOpacity(value));
    viewAttributes.forEach((obj) => {
      obj.interactor.render();
    });
  });

const slabFolder = gui.addFolder('Slab');
slabFolder
  .add(guiParams, 'SlabMode', ['MIN', 'MAX', 'MEAN', 'SUM'])
  .name('Slab mode')
  .onChange((mode) => {
    const slabValue = SlabTypes[mode];
    viewAttributes.forEach((obj) => {
      obj.resliceMapper.setSlabType(slabValue);
    });
    updateViews();
  });

slabFolder
  .add(guiParams, 'SlabThickness', 0, 50, 1)
  .name('Slab thickness')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.resliceMapper.setSlabThickness(value);
    });
    updateViews();
  });

const interpolationFolder = gui.addFolder('Interpolation');
interpolationFolder
  .add(guiParams, 'Interpolation', ['Nearest', 'Linear'])
  .name('Interpolation mode')
  .onChange((value) => {
    const interpType =
      value === 'Nearest'
        ? InterpolationType.NEAREST
        : InterpolationType.LINEAR;
    viewAttributes.forEach((obj) => {
      obj.bgPpty.setInterpolationType(interpType);
    });
    updateViews();
  });

// Labelmap controls
const labelmapFolder = gui.addFolder('Labelmap');

labelmapFolder
  .add(guiParams, 'showLabelmap')
  .name('Show Labelmap')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.labelOfun.removeAllPoints();
      obj.labelOfun.addPoint(0, 0);
      if (value) {
        obj.labelOfun.addPoint(1, guiParams.fillOpacity);
        obj.labelOfun.addPoint(2, guiParams.fillOpacity);
        obj.labelOfun.addPoint(3, guiParams.fillOpacity);
      } else {
        obj.labelOfun.addPoint(1, 0);
        obj.labelOfun.addPoint(2, 0);
        obj.labelOfun.addPoint(3, 0);
      }
      obj.labelPpty.setUseLabelOutline(value && guiParams.useLabelOutline);
      obj.renderWindow.render();
    });
    view3D.renderWindow.render();
  });

labelmapFolder
  .add(guiParams, 'fillOpacity', 0, 1, 0.1)
  .name('Fill Opacity')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.labelOfun.removeAllPoints();
      obj.labelOfun.addPoint(0, 0);
      obj.labelOfun.addPoint(1, value);
      obj.labelOfun.addPoint(2, value);
      obj.labelOfun.addPoint(3, value);
      obj.renderWindow.render();
    });
    view3D.renderWindow.render();
  });

labelmapFolder
  .add(guiParams, 'useLabelOutline')
  .name('Enable Outline')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.labelPpty.setUseLabelOutline(value);
      obj.renderWindow.render();
    });
    view3D.renderWindow.render();
  });

labelmapFolder
  .add(guiParams, 'outlineThickness', 1, 10, 1)
  .name('Outline Thickness')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.labelPpty.setLabelOutlineThickness([value, value, value, value]);
      obj.renderWindow.render();
    });
    view3D.renderWindow.render();
  });

labelmapFolder
  .add(guiParams, 'outlineOpacity', 0, 1, 0.1)
  .name('Outline Opacity')
  .onChange((value) => {
    viewAttributes.forEach((obj) => {
      obj.labelPpty.setLabelOutlineOpacity(value);
      obj.renderWindow.render();
    });
    view3D.renderWindow.render();
  });

labelmapFolder
  .add(guiParams, 'labelmapResolution', 1, 4, 1)
  .name('Resolution Factor')
  .onChange((value) => {
    updateLabelmap(value);
  });

const miscFolder = gui.addFolder('Misc');
miscFolder
  .add(guiParams, 'WindowLevel')
  .name('Window level')
  .onChange((value) => {
    viewAttributes.forEach((obj, index) => {
      if (index < 3) {
        obj.interactor.setInteractorStyle(
          value
            ? vtkInteractorStyleImage.newInstance()
            : vtkInteractorStyleTrackballCamera.newInstance()
        );
      }
    });
  });

miscFolder
  .add(
    {
      ResetViews: () => {
        widgetState.setPlanes({ ...initialPlanesState });
        const image = widget.getWidgetState().getImage();
        if (image) {
          widget.setCenter(image.getCenter());
        }
        updateViews();
      },
    },
    'ResetViews'
  )
  .name('Reset views');
