import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageProperty from '@kitware/vtk.js/Rendering/Core/ImageProperty';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { SlabTypes } from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper/Constants';

// use full HttpDataAccessHelper
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import controlPanel from './controlPanel.html';
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.34],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const ppty = vtkImageProperty.newInstance();
const mapper = vtkImageResliceMapper.newInstance();
const slicePlane = vtkPlane.newInstance();
slicePlane.setNormal(0, 0, 1);
mapper.setSlicePlane(slicePlane);

const actor = vtkImageSlice.newInstance();
actor.setMapper(mapper);
renderer.addActor(actor);

const iStyle = vtkInteractorStyleImage.newInstance();
iStyle.setInteractionMode('IMAGE3D');
renderWindow.getInteractor().setInteractorStyle(iStyle);

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const repStyle = {
  active: {
    plane: {
      opacity: 0.05,
      color: [1, 1, 1],
    },
    normal: {
      opacity: 0.6,
      color: [0, 1, 0],
    },
    origin: {
      opacity: 0.6,
      color: [0, 1, 0],
    },
  },
  inactive: {
    plane: {
      opacity: 0.0,
      color: [1, 1, 1],
    },
    normal: {
      opacity: 0.3,
      color: [0.5, 0, 0],
    },
    origin: {
      opacity: 0.3,
      color: [0.5, 0, 0],
    },
  },
};

const widget = vtkPlaneWidget.newInstance();
widget.getWidgetState().setNormal(0, 0, 1);
widget.setPlaceFactor(1);
const w = widgetManager.addWidget(widget);
w.setRepresentationStyle(repStyle);

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    reader.update();
    const im = reader.getOutputData();
    const bds = im.getBounds();
    mapper.setInputData(im);
    slicePlane.setOrigin(
      0.5 * (bds[0] + bds[1]),
      0.5 * (bds[2] + bds[3]),
      0.5 * (bds[5] + bds[4])
    );
    widget.placeWidget(bds);

    renderer.getActiveCamera().roll(45);
    renderer.getActiveCamera().azimuth(-45);
    renderer.resetCamera();
    const planeState = widget.getWidgetState();
    planeState.setOrigin(slicePlane.getOrigin());
    planeState.setNormal(slicePlane.getNormal());
    planeState.onModified(() => {
      slicePlane.setOrigin(planeState.getOrigin());
      slicePlane.setNormal(planeState.getNormal());
    });
    renderWindow.render();
  });
});

const rgb = vtkColorTransferFunction.newInstance();
rgb.addRGBPoint(0, 0, 0, 0);
rgb.addRGBPoint(3926, 1, 1, 1);
ppty.setRGBTransferFunction(rgb);

const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0, 1);
ofun.addPoint(3926, 1);
ppty.setPiecewiseFunction(ofun);

ppty.setColorWindow(3926);
ppty.setColorLevel(1863);
actor.setProperty(ppty);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------
fullScreenRenderer.addController(controlPanel);
const slabThicknessSlider = document.querySelector('.slabThickness');
const enableSlab = document.querySelector('.enableSlab');
enableSlab.addEventListener('click', () => {
  const slabFieldSet = document.querySelector('.slab');
  if (slabFieldSet.disabled) {
    slabFieldSet.disabled = false;
    enableSlab.innerHTML = 'Disable slab mode';
    mapper.setSlabThickness(Number(slabThicknessSlider.value));
    renderWindow.render();
  } else {
    slabFieldSet.disabled = true;
    enableSlab.innerHTML = 'Enable slab mode';
    mapper.setSlabThickness(0);
    renderWindow.render();
  }
});
const slabTypes = document.querySelectorAll('.slabType');
for (let idx = 0; idx < slabTypes.length; ++idx) {
  const st = slabTypes[idx];
  st.onchange = (e) => {
    if (e.target.value === 'min') {
      mapper.setSlabType(SlabTypes.MIN);
    } else if (e.target.value === 'max') {
      mapper.setSlabType(SlabTypes.MAX);
    } else if (e.target.value === 'sum') {
      mapper.setSlabType(SlabTypes.SUM);
    } else {
      mapper.setSlabType(SlabTypes.MEAN);
    }
    renderWindow.render();
  };
}
document.querySelector('.slabThickness').addEventListener('change', (e) => {
  const value = Number(e.target.value);
  mapper.setSlabThickness(value);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.actor = actor;
global.mapper = mapper;
global.property = ppty;
global.rgb = rgb;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = w;
