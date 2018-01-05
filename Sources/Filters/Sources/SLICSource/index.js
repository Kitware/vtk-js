import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function generateCoordinates(origin, dimensions, spacing) {
  const coordinates = new Float32Array(
    dimensions[0] * dimensions[1] * dimensions[2] * 3
  );
  let offset = 0;
  for (let k = 0; k < dimensions[2]; k++) {
    const z = origin[2] + spacing[2] * k;
    for (let j = 0; j < dimensions[1]; j++) {
      const y = origin[1] + spacing[1] * j;
      for (let i = 0; i < dimensions[0]; i++) {
        const x = origin[0] + spacing[0] * i;
        coordinates[offset++] = x;
        coordinates[offset++] = y;
        coordinates[offset++] = z;
      }
    }
  }
  return coordinates;
}

// ----------------------------------------------------------------------------
// vtkSLICSource methods
// ----------------------------------------------------------------------------

function vtkSLICSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSLICSource');

  publicAPI.addCluster = (
    centerX,
    centerY,
    centerZ,
    fnConst,
    fnDfDx,
    fnDfDy,
    fnDfDz
  ) => {
    const id = model.clusters.length;
    model.clusters.push(
      new Float32Array([
        centerX,
        centerY,
        centerZ,
        fnConst,
        fnDfDx,
        fnDfDy,
        fnDfDz,
      ])
    );
    publicAPI.modified();
    return id;
  };

  publicAPI.removeCluster = (id) => {
    model.clusters.splice(id, 1);
    publicAPI.modified();
  };

  publicAPI.removeAllClusters = () => {
    model.clusters = [];
    publicAPI.modified();
  };

  publicAPI.updateCluster = (
    id,
    centerX,
    centerY,
    centerZ,
    fnConst,
    fnDfDx,
    fnDfDy,
    fnDfDz
  ) => {
    if (!model.clusters[id]) {
      model.clusters[id] = new Float32Array(7);
    }
    model.clusters[id][0] = centerX;
    model.clusters[id][1] = centerY;
    model.clusters[id][2] = centerZ;
    model.clusters[id][3] = fnConst;
    model.clusters[id][4] = fnDfDx;
    model.clusters[id][5] = fnDfDy;
    model.clusters[id][6] = fnDfDz;
    publicAPI.modified();
  };

  publicAPI.getNumberOfClusters = () => model.clusters.length;

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const dataSize =
      model.dimensions[0] * model.dimensions[1] * model.dimensions[2];

    const imageData = vtkImageData.newInstance();
    imageData.setSpacing(...model.spacing);
    imageData.setExtent(
      0,
      model.dimensions[0] - 1,
      0,
      model.dimensions[1] - 1,
      0,
      model.dimensions[2] - 1
    );
    imageData.setOrigin(...model.origin);

    // Pixel centers
    const centers = generateCoordinates(
      model.origin,
      model.dimensions,
      model.spacing
    );

    // Fill clusterIdxValues
    const nbBytes =
      (model.clusters.length < 256 ? 8 : 0) ||
      (model.clusters.length < 65536 ? 16 : 32);
    const clusterIdxValues = new window[`Uint${nbBytes}Array`](dataSize);
    for (let i = 0; i < dataSize; i++) {
      let clusterDistance = Number.MAX_VALUE;
      model.clusters.forEach((cluster, idx) => {
        const dist =
          (cluster[0] - centers[i * 3]) * (cluster[0] - centers[i * 3]) +
          (cluster[1] - centers[i * 3 + 1]) *
            (cluster[1] - centers[i * 3 + 1]) +
          (cluster[2] - centers[i * 3 + 2]) * (cluster[2] - centers[i * 3 + 2]);
        if (dist < clusterDistance) {
          clusterDistance = dist;
          clusterIdxValues[i] = idx;
        }
      });
    }
    const clusters = vtkDataArray.newInstance({
      name: model.clusterArrayName,
      numberOfComponents: 1,
      values: clusterIdxValues,
    });
    imageData.getPointData().addArray(clusters);

    // Fill scalarValues
    const scalarValues = new Float32Array(dataSize);
    for (let i = 0; i < dataSize; i++) {
      const cluster = model.clusters[clusterIdxValues[i]];
      scalarValues[i] =
        cluster[3] +
        cluster[4] * (centers[i * 3 + 0] - cluster[0]) +
        cluster[5] * (centers[i * 3 + 1] - cluster[1]) +
        cluster[6] * (centers[i * 3 + 2] - cluster[2]);
    }
    const scalars = vtkDataArray.newInstance({
      name: model.scalarArrayName,
      numberOfComponents: 1,
      values: scalarValues,
    });
    imageData.getPointData().addArray(scalars);

    // Update output
    outData[0] = imageData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  clusters: [],
  spacing: [1.0, 1.0, 1.0],
  origin: [0.0, 0.0, 0.0],
  dimensions: [10, 10, 10],
  clusterArrayName: 'cluster',
  scalarArrayName: 'field',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['clusterArrayName', 'scalarArrayName']);
  macro.setGetArray(publicAPI, model, ['origin', 'spacing', 'dimensions'], 3);

  macro.algo(publicAPI, model, 0, 1);
  vtkSLICSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSLICSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
