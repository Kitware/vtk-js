import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkResliceCursorWidget from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { CaptureOn } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import { vec3 } from 'gl-matrix';
import { SlabMode } from 'vtk.js/Sources/Imaging/Core/ImageReslice/Constants';

import { xyzToViewType } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';
import controlPanel from './controlPanel.html';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

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
const widget = vtkResliceCursorWidget.newInstance();
const widgetState = widget.getWidgetState();
widgetState.setKeepOrthogonality(true);
widgetState.setOpacity(0.6);
// Use devicePixelRatio in order to have the same display handle size on all devices
widgetState.setSphereRadius(10 * window.devicePixelRatio);
widgetState.setLineThickness(5);

const showDebugActors = true;

// ----------------------------------------------------------------------------
// Define html structure
// ----------------------------------------------------------------------------

const container = document.querySelector('body');
const controlContainer = document.createElement('div');
controlContainer.innerHTML = controlPanel;
container.appendChild(controlContainer);

// ----------------------------------------------------------------------------
// Setup rendering code
// ----------------------------------------------------------------------------

/**
 * Function to create synthetic image data with correct dimensions
 * Can be use for debug
 * @param {Array[Int]} dims
 */
// eslint-disable-next-line no-unused-vars
function createSyntheticImageData(dims) {
  const imageData = vtkImageData.newInstance();
  const newArray = new Uint8Array(dims[0] * dims[1] * dims[2]);
  const s = 0.1;
  imageData.setSpacing(s, s, s);
  imageData.setExtent(0, 127, 0, 127, 0, 127);
  let i = 0;
  for (let z = 0; z < dims[2]; z++) {
    for (let y = 0; y < dims[1]; y++) {
      for (let x = 0; x < dims[0]; x++) {
        newArray[i++] = (256 * (i % (dims[0] * dims[1]))) / (dims[0] * dims[1]);
      }
    }
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: newArray,
  });
  da.setName('scalars');

  imageData.getPointData().setScalars(da);

  return imageData;
}

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(
    rgb[2] * 255
  ).toString()})`;
}

const initialPlanesState = { ...widgetState.getPlanes() };

let view3D = null;

for (let i = 0; i < 4; i++) {
  const element = document.createElement('div');
  element.setAttribute('class', 'view');
  element.style.width = '50%';
  element.style.height = '300px';
  element.style.display = 'inline-block';
  container.appendChild(element);

  const grw = vtkGenericRenderWindow.newInstance();
  grw.setContainer(element);
  grw.resize();
  const obj = {
    renderWindow: grw.getRenderWindow(),
    renderer: grw.getRenderer(),
    GLWindow: grw.getOpenGLRenderWindow(),
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
    obj.widgetInstance.setRotationHandlePosition(0.75);
    obj.widgetManager.enablePicking();
    // Use to update all renderers buffer when actors are moved
    obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
  } else {
    obj.interactor.setInteractorStyle(
      vtkInteractorStyleTrackballCamera.newInstance()
    );
  }

  obj.reslice = vtkImageReslice.newInstance();
  obj.reslice.setSlabMode(SlabMode.MEAN);
  obj.reslice.setSlabNumberOfSlices(1);
  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2);
  obj.resliceMapper = vtkImageMapper.newInstance();
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  obj.resliceActor = vtkImageSlice.newInstance();
  obj.resliceActor.setMapper(obj.resliceMapper);
  obj.sphereActors = [];
  obj.sphereSources = [];

  // Create sphere for each 2D views which will be displayed in 3D
  // Define origin, point1 and point2 of the plane used to reslice the volume
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

  // create axes
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
  // axes.setXPlusFaceProperty({ text: '+X' });
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

  // create orientation widget
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
}

// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------

function updateReslice(
  interactionContext = {
    viewType: '',
    reslice: null,
    actor: null,
    renderer: null,
    resetFocalPoint: false, // Reset the focal point to the center of the display image
    keepFocalPointPosition: false, // Defines if the focal point position is kepts (same display distance from reslice cursor center)
    computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
    // computed. If so, then this offset will be used to keep the focal point position during rotation.
    spheres: null,
  }
) {
  const obj = widget.updateReslicePlane(
    interactionContext.reslice,
    interactionContext.viewType
  );
  if (obj.modified) {
    // Get returned modified from setter to know if we have to render
    interactionContext.actor.setUserMatrix(
      interactionContext.reslice.getResliceAxes()
    );
    interactionContext.sphereSources[0].setCenter(...obj.origin);
    interactionContext.sphereSources[1].setCenter(...obj.point1);
    interactionContext.sphereSources[2].setCenter(...obj.point2);
  }
  widget.updateCameraPoints(
    interactionContext.renderer,
    interactionContext.viewType,
    interactionContext.resetFocalPoint,
    interactionContext.keepFocalPointPosition,
    interactionContext.computeFocalPointOffset
  );
  view3D.renderWindow.render();
  return obj.modified;
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    widget.setImage(image);

    // Create image outline in 3D view
    const outline = vtkOutlineFilter.newInstance();
    outline.setInputData(image);
    const outlineMapper = vtkMapper.newInstance();
    outlineMapper.setInputData(outline.getOutputData());
    const outlineActor = vtkActor.newInstance();
    outlineActor.setMapper(outlineMapper);
    view3D.renderer.addActor(outlineActor);

    viewAttributes.forEach((obj, i) => {
      obj.reslice.setInputData(image);
      obj.renderer.addActor(obj.resliceActor);
      view3D.renderer.addActor(obj.resliceActor);
      obj.sphereActors.forEach((actor) => {
        obj.renderer.addActor(actor);
        view3D.renderer.addActor(actor);
      });
      const reslice = obj.reslice;
      const viewType = xyzToViewType[i];

      viewAttributes
        // No need to update plane nor refresh when interaction
        // is on current view. Plane can't be changed with interaction on current
        // view. Refreshs happen automatically with `animation`.
        // Note: Need to refresh also the current view because of adding the mouse wheel
        // to change slicer
        .forEach((v) => {
          // Interactions in other views may change current plane
          v.widgetInstance.onInteractionEvent(
            // computeFocalPointOffset: Boolean which defines if the offset between focal point and
            // reslice cursor display center has to be recomputed (while translation is applied)
            // canUpdateFocalPoint: Boolean which defines if the focal point can be updated because
            // the current interaction is a rotation
            ({ computeFocalPointOffset, canUpdateFocalPoint }) => {
              const activeViewType = widget
                .getWidgetState()
                .getActiveViewType();
              const keepFocalPointPosition =
                activeViewType !== viewType && canUpdateFocalPoint;
              updateReslice({
                viewType,
                reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: false,
                keepFocalPointPosition,
                computeFocalPointOffset,
                sphereSources: obj.sphereSources,
              });
            }
          );
        });

      updateReslice({
        viewType,
        reslice,
        actor: obj.resliceActor,
        renderer: obj.renderer,
        resetFocalPoint: true, // At first initilization, center the focal point to the image center
        keepFocalPointPosition: false, // Don't update the focal point as we already set it to the center of the image
        computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
        sphereSources: obj.sphereSources,
      });
      obj.interactor.render();
    });

    view3D.renderer.resetCamera();
    view3D.renderer.resetCameraClippingRange();

    // set max number of slices to slider.
    const maxNumberOfSlices = vec3.length(image.getDimensions());
    document.getElementById('slabNumber').max = maxNumberOfSlices;
  });
});

// ----------------------------------------------------------------------------
// Define panel interactions
// ----------------------------------------------------------------------------
function updateViews() {
  viewAttributes.forEach((obj, i) => {
    updateReslice({
      viewType: xyzToViewType[i],
      reslice: obj.reslice,
      actor: obj.resliceActor,
      renderer: obj.renderer,
      resetFocalPoint: true,
      keepFocalPointPosition: false,
      computeFocalPointOffset: true,
      sphereSources: obj.sphereSources,
      resetViewUp: true,
    });
    obj.renderWindow.render();
  });
  view3D.renderer.resetCamera();
  view3D.renderer.resetCameraClippingRange();
}

const checkboxOrthogonality = document.getElementById('checkboxOrthogality');
checkboxOrthogonality.addEventListener('change', (ev) => {
  widgetState.setKeepOrthogonality(checkboxOrthogonality.checked);
});

const checkboxRotation = document.getElementById('checkboxRotation');
checkboxRotation.addEventListener('change', (ev) => {
  widgetState.setEnableRotation(checkboxRotation.checked);
});

const checkboxTranslation = document.getElementById('checkboxTranslation');
checkboxTranslation.addEventListener('change', (ev) => {
  widgetState.setEnableTranslation(checkboxTranslation.checked);
});

const checkboxScaleInPixels = document.getElementById('checkboxScaleInPixels');
checkboxScaleInPixels.addEventListener('change', (ev) => {
  viewAttributes.forEach((obj) => {
    obj.widgetInstance.setScaleInPixels(checkboxScaleInPixels.checked);
    obj.interactor.render();
  });
});

const optionSlabModeMin = document.getElementById('slabModeMin');
optionSlabModeMin.value = SlabMode.MIN;
const optionSlabModeMax = document.getElementById('slabModeMax');
optionSlabModeMax.value = SlabMode.MAX;
const optionSlabModeMean = document.getElementById('slabModeMean');
optionSlabModeMean.value = SlabMode.MEAN;
const optionSlabModeSum = document.getElementById('slabModeSum');
optionSlabModeSum.value = SlabMode.SUM;
const selectSlabMode = document.getElementById('slabMode');
selectSlabMode.addEventListener('change', (ev) => {
  viewAttributes.forEach((obj) => {
    obj.reslice.setSlabMode(Number(ev.target.value));
  });
  updateViews();
});

const sliderSlabNumberofSlices = document.getElementById('slabNumber');
sliderSlabNumberofSlices.addEventListener('change', (ev) => {
  const trSlabNumberValue = document.getElementById('slabNumberValue');
  trSlabNumberValue.innerHTML = ev.target.value;
  viewAttributes.forEach((obj) => {
    obj.reslice.setSlabNumberOfSlices(ev.target.value);
  });
  updateViews();
});

const buttonReset = document.getElementById('buttonReset');
buttonReset.addEventListener('click', () => {
  widgetState.setPlanes({ ...initialPlanesState });
  widget.setCenter(widget.getWidgetState().getImage().getCenter());
  updateViews();
});

const selectInterpolationMode = document.getElementById('selectInterpolation');
selectInterpolationMode.addEventListener('change', (ev) => {
  viewAttributes.forEach((obj) => {
    obj.reslice.setInterpolationMode(Number(ev.target.selectedIndex));
  });
  updateViews();
});
