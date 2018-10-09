import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageStreamline methods
// ----------------------------------------------------------------------------

function vtkImageStreamline(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageStreamline');

  const indices = new Int32Array(3);
  const paramCoords = new Float32Array(3);
  const weights = new Float32Array(8);
  const voxelIndices = new Uint32Array(8);
  const dimensions = new Uint32Array(3);
  const velAt = new Float32Array(3);
  const xtmp = new Float32Array(3);

  publicAPI.interpolationFunctions = (pcoords, sf) => {
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
  };

  publicAPI.computeStructuredCoordinates = (
    x,
    ijk,
    pcoords,
    extent,
    spacing,
    origin,
    bounds
  ) => {
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
      const maxExt = extent[i * 2 + 1];

      // check if data is one pixel thick
      if (minExt === maxExt) {
        const dist = x[i] - bounds[2 * i];
        if (dist * dist <= spacing[i] * spacing[i] * tol2) {
          pcoords[i] = 0.0;
          ijk[i] = minExt;
          tmpInBounds = true;
        }
      } else if (ijk[i] < minExt) {
        if (
          (spacing[i] >= 0 && x[i] >= bounds[i * 2]) ||
          (spacing[i] < 0 && x[i] <= bounds[i * 2 + 1])
        ) {
          pcoords[i] = 0.0;
          ijk[i] = minExt;
          tmpInBounds = true;
        }
      } else if (ijk[i] >= maxExt) {
        if (
          (spacing[i] >= 0 && x[i] <= bounds[i * 2 + 1]) ||
          (spacing[i] < 0 && x[i] >= bounds[i * 2])
        ) {
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
  };

  publicAPI.getVoxelIndices = (ijk, dims, ids) => {
    ids[0] = ijk[2] * dims[0] * dims[1] + ijk[1] * dims[0] + ijk[0];
    ids[1] = ids[0] + 1; // i+1, j, k
    ids[2] = ids[0] + dims[0]; // i, j+1, k
    ids[3] = ids[2] + 1; // i+1, j+1, k
    ids[4] = ids[0] + dims[0] * dims[1]; // i, j, k+1
    ids[5] = ids[4] + 1; // i+1, j, k+1
    ids[6] = ids[4] + dims[0]; // i, j+1, k+1
    ids[7] = ids[6] + 1; // i+1, j+1, k+1
  };

  publicAPI.vectorAt = (xyz, velArray, image, velAtArg) => {
    if (
      !publicAPI.computeStructuredCoordinates(
        xyz,
        indices,
        paramCoords,
        image.getExtent(),
        image.getSpacing(),
        image.getOrigin(),
        image.getBounds()
      )
    ) {
      return false;
    }

    publicAPI.interpolationFunctions(paramCoords, weights);
    const extent = image.getExtent();
    dimensions[0] = extent[1] - extent[0] + 1;
    dimensions[1] = extent[3] - extent[2] + 1;
    dimensions[2] = extent[5] - extent[4] + 1;
    publicAPI.getVoxelIndices(indices, dimensions, voxelIndices);
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
  };

  publicAPI.computeNextStep = (velArray, image, delT, xyz) => {
    // This does Runge-Kutta 2

    // Start with evaluating velocity @ initial point
    if (!publicAPI.vectorAt(xyz, velArray, image, velAt)) {
      return false;
    }
    // Now find the mid point
    for (let i = 0; i < 3; i++) {
      xtmp[i] = xyz[i] + (delT / 2.0) * velAt[i];
    }
    // Use the velocity @ that point to project
    if (!publicAPI.vectorAt(xtmp, velArray, image, velAt)) {
      return false;
    }
    for (let i = 0; i < 3; i++) {
      xyz[i] += delT * velAt[i];
    }

    if (!publicAPI.vectorAt(xyz, velArray, image, velAt)) {
      return false;
    }

    return true;
  };

  publicAPI.streamIntegrate = (velArray, image, seed, offset) => {
    const retVal = [];

    const maxSteps = model.maximumNumberOfSteps;
    const delT = model.integrationStep;
    const xyz = new Float32Array(3);
    xyz[0] = seed[0];
    xyz[1] = seed[1];
    xyz[2] = seed[2];

    const pointsBuffer = [];

    let step = 0;
    for (step = 0; step < maxSteps; step++) {
      if (!publicAPI.computeNextStep(velArray, image, delT, xyz)) {
        break;
      }
      for (let i = 0; i < 3; i++) {
        pointsBuffer[3 * step + i] = xyz[i];
      }
    }

    const pd = vtkPolyData.newInstance();

    const points = new Float32Array(pointsBuffer);
    retVal[0] = points;

    pd.getPoints().setData(points, 3);

    const npts = points.length / 3;
    const line = new Uint32Array(npts + 1);
    line[0] = npts;
    for (let i = 0; i < npts; i++) {
      line[i + 1] = i + offset;
    }
    retVal[1] = line;

    pd.getLines().setData(line);

    return retVal;
  };

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];
    const seeds = inData[1];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    if (!seeds) {
      vtkErrorMacro('Invalid or missing seeds');
      return;
    }

    const seedPts = seeds.getPoints();
    const nSeeds = seedPts.getNumberOfPoints();

    let offset = 0;
    const datas = [];
    const vectors = input.getPointData().getVectors();
    for (let i = 0; i < nSeeds; i++) {
      const retVal = publicAPI.streamIntegrate(
        vectors,
        input,
        seedPts.getTuple(i),
        offset
      );
      offset += retVal[0].length / 3;
      datas.push(retVal);
    }

    let cellArrayLength = 0;
    let pointArrayLength = 0;
    datas.forEach((data) => {
      cellArrayLength += data[1].length;
      pointArrayLength += data[0].length;
    });
    offset = 0;
    let offset2 = 0;
    const cellArray = new Uint32Array(cellArrayLength);
    const pointArray = new Float32Array(pointArrayLength);
    datas.forEach((data) => {
      cellArray.set(data[1], offset);
      offset += data[1].length;
      pointArray.set(data[0], offset2);
      offset2 += data[0].length;
    });

    const output = vtkPolyData.newInstance();
    output.getPoints().setData(pointArray, 3);
    output.getLines().setData(cellArray);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  integrationStep: 1,
  maximumNumberOfSteps: 1000,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 2, 1);

  // Generate macros for properties
  macro.setGet(publicAPI, model, ['integrationStep', 'maximumNumberOfSteps']);

  // Object specific methods
  vtkImageStreamline(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageStreamline');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
