import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkConeSource from '../../../Sources/Filters/Sources/ConeSource';
import vtkConstVectorSource from '../../../Sources/Filters/Sources/ConstVectorSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkDataArray from '../../../Sources/Common/Core/DataArray';
import vtkPolyData from '../../../Sources/Common/DataModel/PolyData';
import * as macro     from '../../../Sources/macro';

import controlPanel from './controller.html';

const indices = new Int32Array(3);
const paramCoords = new Float32Array(3);
const weights = new Float32Array(8);
const voxelIndices = new Uint32Array(8);
const dimensions = new Uint32Array(3);
const velAt = new Float32Array(3);
const xtmp = new Float32Array(3);

function interpolationFunctions(pcoords, sf) {
  const r = pcoords[0];
  const s = pcoords[1];
  const t = pcoords[2];

  const rm = 1.0 - r;
  const sm = 1.0 - s;
  const tm = 1.0 - t;

  sf[0] = rm * sm * tm;
  sf[1] = r * sm * tm;
  sf[2] = rm * s * tm;
  sf[3] = r * s * tm;
  sf[4] = rm * sm * t;
  sf[5] = r * sm * t;
  sf[6] = rm * s * t;
  sf[7] = r * s * t;
}

function computeStructuredCoordinates(x, ijk, pcoords,
                                      extent,
                                      spacing,
                                      origin,
                                      bounds) {
  // tolerance is needed for 2D data (this is squared tolerance)
  const tol2 = 1e-12;
  //
  //  Compute the ijk location
  //
  let isInBounds = true;
  for (let i = 0; i < 3; i++) {
    const d = x[i] - origin[i];
    const doubleLoc = d / spacing[i];
    // Floor for negative indexes.
    ijk[i] = Math.floor(doubleLoc);
    pcoords[i] = doubleLoc - ijk[i];

    let tmpInBounds = false;
    const minExt = extent[i * 2];
    const maxExt = extent[(i * 2) + 1];

    // check if data is one pixel thick
    if (minExt === maxExt) {
      const dist = x[i] - bounds[2 * i];
      if (dist * dist <= spacing[i] * spacing[i] * tol2) {
        pcoords[i] = 0.0;
        ijk[i] = minExt;
        tmpInBounds = true;
      }
    } else if (ijk[i] < minExt) {
      if ((spacing[i] >= 0 && x[i] >= bounds[i * 2]) ||
           (spacing[i] < 0 && x[i] <= bounds[(i * 2) + 1])) {
        pcoords[i] = 0.0;
        ijk[i] = minExt;
        tmpInBounds = true;
      }
    } else if (ijk[i] >= maxExt) {
      if ((spacing[i] >= 0 && x[i] <= bounds[(i * 2) + 1]) ||
           (spacing[i] < 0 && x[i] >= bounds[(i * 2)])) {
        // make sure index is within the allowed cell index range
        pcoords[i] = 1.0;
        ijk[i] = maxExt - 1;
        tmpInBounds = true;
      }
    } else {
      tmpInBounds = true;
    }

    // clear isInBounds if out of bounds for this dimension
    isInBounds = isInBounds && tmpInBounds;
  }

  return isInBounds;
}

function getVoxelIndices(ijk, dims, ids) {
  /* eslint-disable no-mixed-operators */
  ids[0] = ijk[2] * dims[0] * dims[1] + ijk[1] * dims[0] + ijk[0];
  ids[1] = ids[0] + 1; // i+1, j, k
  ids[2] = ids[0] + dims[0]; // i, j+1, k
  ids[3] = ids[2] + 1; // i+1, j+1, k
  ids[4] = ids[0] + dims[0] * dims[1]; // i, j, k+1
  ids[5] = ids[4] + 1; // i+1, j, k+1
  ids[6] = ids[4] + dims[0]; // i, j+1, k+1
  ids[7] = ids[6] + 1; // i+1, j+1, k+1
  /* eslint-enable no-mixed-operators */
}

function vectorAt(xyz, velArray, image, velAtArg) {
  if (!computeStructuredCoordinates(xyz, indices, paramCoords,
    image.getExtent(), image.getSpacing(),
    image.getOrigin(), image.getBounds())) {
    return false;
  }

  interpolationFunctions(paramCoords, weights);
  const extent = image.getExtent();
  dimensions[0] = extent[1] - extent[0] + 1;
  dimensions[1] = extent[3] - extent[2] + 1;
  dimensions[2] = extent[5] - extent[4] + 1;
  getVoxelIndices(indices, dimensions, voxelIndices);
  velAtArg[0] = 0.0;
  velAtArg[1] = 0.0;
  velAtArg[2] = 0.0;
  for (let i = 0; i < 8; i++) {
    const vel = velArray.getTuple(voxelIndices[i]);
    for (let j = 0; j < 3; j++) {
      velAtArg[j] += weights[i] * vel[j];
    }
  }

  return true;
}

function computeNextStep(velArray, image, delT, xyz) {
  // This does Runge-Kutta 2

  // Start with evaluating velocity @ initial point
  if (!vectorAt(xyz, velArray, image, velAt)) {
    return false;
  }
  // Now find the mid point
  for (let i = 0; i < 3; i++) {
    xtmp[i] = xyz[i] + ((delT / 2.0) * velAt[i]);
  }
  // Use the velocity @ that point to project
  if (!vectorAt(xtmp, velArray, image, velAt)) {
    return false;
  }
  for (let i = 0; i < 3; i++) {
    xyz[i] += delT * velAt[i];
  }

  return true;
}

function streamIntegrate(velArray, image, seed) {
  const maxSteps = 1000;
  const delT = 0.1;
  const xyz = new Float32Array(3);
  xyz[0] = seed[0];
  xyz[1] = seed[1];
  xyz[2] = seed[2];

  const pointsBuffer = [];

  let step = 0;
  for (step = 0; step < maxSteps; step++) {
    if (!computeNextStep(velArray, image, delT, xyz)) {
      break;
    }
    for (let i = 0; i < 3; i++) {
      pointsBuffer[(3 * step) + i] = xyz[i];
    }
  }

  const pd = vtkPolyData.newInstance();

  const points = new Float32Array(pointsBuffer);

  // const pointsArray = vtkDataArray.newInstance({ values: points, numberOfComponents: 3 });
  // pointsArray.setName('points');

  pd.getPoints().getData().setData(points, 3);

  console.log(pd.getPoints().getData().getRange(0));

  const npts = points.length / 3;
  const line = new Uint32Array(npts + 1);
  line[0] = npts;
  for (let i = 0; i < npts; i++) {
    line[i + 1] = i;
  }

  pd.getLines().setData(line);
  console.log(pd.getBounds());
  console.log(pointsBuffer);

  return pd;
}

/* global document */

// Create some control UI
const container = document.querySelector('body');
const controlContainer = document.createElement('div');
const renderWindowContainer = document.createElement('div');
container.appendChild(controlContainer);
container.appendChild(renderWindowContainer);
controlContainer.innerHTML = controlPanel;

const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

// create what we will view
const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const vectorSource = vtkConstVectorSource.newInstance();
vectorSource.setDataExtent(0, 9, 0, 9, 0, 9);
vectorSource.setDataSpacing(0.1, 0.1, 0.1);
vectorSource.update();

const output = vectorSource.getOutputData();
const pd0 = output.getPointData();
const a = pd0.getScalars();
const vec = new Float32Array(a.getNumberOfComponents());
a.getTuple(0, vec);

const coords = new Float32Array(3);
coords[0] = 0.05;
coords[1] = 0.05;
coords[2] = 0.05;

vectorAt(coords, a, output, velAt);
// console.log(velAt);
const slines = streamIntegrate(a, output, coords);

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(coneSource.getResolution() + 1);
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = Math.random();
      }

      const da = vtkDataArray.newInstance({ values: newArray });
      da.setName('temp');

      const pd = vtkPolyData.newInstance();
      pd.setPolys(inData[0].getPolys());
      pd.setPoints(inData[0].getPoints());
      // const cpd = pd.getPointData();
      const cpd = pd.getCellData();
      cpd.addArray(da);
      cpd.setActiveScalars(da.getName());
      outData[0] = pd;
    }
  };
})();

randFilter.setInputConnection(coneSource.getOutputPort());
// mapper.setInputConnection(randFilter.getOutputPort());
mapper.setInputData(slines);

// now create something to view it, in this case webgl
// with mouse/touch interaction
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 400);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

// initialize the interaction and bind event handlers
// to the HTML elements
iren.initialize();
iren.bindEvents(renderWindowContainer, document);

// ----------------

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renWin.render();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renWin.render();
});

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
