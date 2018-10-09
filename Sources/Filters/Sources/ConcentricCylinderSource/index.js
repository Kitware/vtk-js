import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

// ----------------------------------------------------------------------------
// vtkConcentricCylinderSource methods
// ----------------------------------------------------------------------------

function vtkConcentricCylinderSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConcentricCylinderSource');

  // Internal private function
  function validateCellFields() {
    while (model.cellFields.length < model.radius.length) {
      model.cellFields.push(model.cellFields.length);
    }
  }

  publicAPI.clearRadius = () => {
    model.radius = [];
    model.cellFields = [];
    publicAPI.modified();
  };

  publicAPI.addRadius = (radius, cellField) => {
    model.radius.push(radius);
    if (cellField !== undefined) {
      model.cellFields.push(cellField);
    }
    validateCellFields();
    publicAPI.modified();
  };

  publicAPI.getNumberOfRadius = () => model.radius.length;
  publicAPI.getRadius = (index = 0) => model.radius[index];
  publicAPI.setRadius = (index, radius) => {
    model.radius[index] = radius;
    publicAPI.modified();
  };
  publicAPI.setCellField = (index, field) => {
    model.cellFields[index] = field;
    publicAPI.modified();
  };

  publicAPI.removeMask = () => {
    model.mask = null;
    publicAPI.modified();
  };

  publicAPI.setMaskLayer = (index, hidden) => {
    let changeDetected = false;

    if (!model.mask && hidden) {
      changeDetected = true;
      model.mask = [];
    }

    if (model.mask) {
      if (!model.mask[index] !== !hidden) {
        changeDetected = true;
      }
      model.mask[index] = hidden;
    }

    if (changeDetected) {
      publicAPI.modified();
    }
  };

  publicAPI.getMaskLayer = (index) =>
    index === undefined ? model.mask : model.mask[index];

  function requestData(inData, outData) {
    if (model.deleted || !model.radius.length) {
      return;
    }

    // Make sure we have consistency
    validateCellFields();

    let dataset = outData[0];

    const numLayers = model.radius.length;
    const zRef = model.height / 2.0;

    // Compute cell count
    let cellArraySize = 0;
    let numCells = 0;

    let startTheta =
      model.startTheta < model.endTheta ? model.startTheta : model.endTheta;
    startTheta *= Math.PI / 180.0;
    let endTheta =
      model.endTheta > model.startTheta ? model.endTheta : model.startTheta;
    endTheta *= Math.PI / 180.0;
    let thetaResolution = model.resolution;
    let partialDisk = false;
    if (endTheta >= startTheta + 2 * Math.PI) {
      // complete, closed cylinder
      endTheta = startTheta + 2 * Math.PI;
    } else {
      // We add an extra point at endTheta, since the cylinder isn't closed.
      // We cap the sides of the partial cylinder, so set the partialDisk flag.
      ++thetaResolution;
      partialDisk = true;
    }
    const deltaTheta = (endTheta - startTheta) / model.resolution;

    const numberOfPoints = thetaResolution * numLayers * 2 + 2;

    // 5 entries per poly, 4 polys (top, bottom, in, out) per resolution
    if (!model.skipInnerFaces && !model.mask) {
      // We keep everything
      cellArraySize =
        2 * (thetaResolution + 1) +
        5 * thetaResolution +
        (numLayers - 1) * thetaResolution * 20 +
        (partialDisk ? 10 * numLayers : 0);
      numCells =
        2 +
        thetaResolution +
        (numLayers - 1) * 4 * thetaResolution +
        (partialDisk ? 2 * numLayers : 0);
    } else if (!model.skipInnerFaces && model.mask) {
      // We skip some cylinders
      // Handle core
      if (!model.mask[0]) {
        cellArraySize +=
          2 * (thetaResolution + 1) +
          5 * thetaResolution +
          (partialDisk ? 10 : 0);
        numCells += 2 + thetaResolution + (partialDisk ? 2 : 0);
      }
      // Handle inside cylinders
      for (let layer = 1; layer < numLayers; layer++) {
        if (!model.mask[layer]) {
          // Add inside cylinder count
          cellArraySize += thetaResolution * 20 + (partialDisk ? 10 : 0);
          numCells += 4 * thetaResolution + (partialDisk ? 2 : 0);
        }
      }
    } else {
      // We skip cylinders and internal faces
      if (!model.skipInnerFaces || !model.mask || !model.mask[0]) {
        // core handling
        cellArraySize += 2 * (thetaResolution + 1) + (partialDisk ? 10 : 0);
        numCells += 2 + (partialDisk ? 2 : 0);
        if (
          model.radius.length === 1 ||
          !model.skipInnerFaces ||
          (model.mask && model.mask[1])
        ) {
          // add side faces
          cellArraySize += 5 * thetaResolution;
          numCells += thetaResolution;
        }
      }

      // Handle inside cylinders
      for (let layer = 1; layer < numLayers; layer++) {
        if (!model.skipInnerFaces || !model.mask || !model.mask[layer]) {
          const lastLayer = numLayers - 1 === layer;

          // Add inside cylinder
          cellArraySize += thetaResolution * 10 + (partialDisk ? 10 : 0);
          numCells += thetaResolution * 2 + (partialDisk ? 2 : 0); // top + bottom + side caps

          // Do we add innerFaces
          if (!model.skipInnerFaces || (model.mask && model.mask[layer - 1])) {
            cellArraySize += thetaResolution * 5;
            numCells += thetaResolution;
          }

          // Do we add outerFaces
          if (
            lastLayer ||
            !model.skipInnerFaces ||
            (model.mask && model.mask[layer + 1])
          ) {
            cellArraySize += thetaResolution * 5;
            numCells += thetaResolution;
          }
        }
      }
    }

    // Points
    let pointIdx = 0;
    const points = new window[model.pointType](numberOfPoints * 3);

    // Cells
    let cellLocation = 0;
    const polys = new Uint32Array(cellArraySize);

    // CellFields
    let fieldLocation = 0;
    const field = new Float32Array(numCells);

    // Create points
    // First two are centered, top and bottom. Used only if partialDisk is true.
    points[pointIdx * 3 + 0] = 0;
    points[pointIdx * 3 + 1] = 0;
    points[pointIdx * 3 + 2] = zRef;
    pointIdx++;
    points[pointIdx * 3 + 0] = 0;
    points[pointIdx * 3 + 1] = 0;
    points[pointIdx * 3 + 2] = -zRef;
    pointIdx++;
    for (let layer = 0; layer < numLayers; layer++) {
      const radius = model.radius[layer];
      // Create top
      for (let i = 0; i < thetaResolution; i++) {
        const theta = startTheta + i * deltaTheta;
        points[pointIdx * 3 + 0] = radius * Math.cos(theta);
        points[pointIdx * 3 + 1] = radius * Math.sin(theta);
        points[pointIdx * 3 + 2] = zRef;
        pointIdx++;
      }

      // Create bottom
      for (let i = 0; i < thetaResolution; i++) {
        const theta = startTheta + i * deltaTheta;
        points[pointIdx * 3 + 0] = radius * Math.cos(theta);
        points[pointIdx * 3 + 1] = radius * Math.sin(theta);
        points[pointIdx * 3 + 2] = -zRef;
        pointIdx++;
      }
    }

    // Create cells for the core
    let currentField = model.cellFields[0];

    // Core: filtering
    if (!model.mask || !model.mask[0]) {
      // Core: Top disk
      field[fieldLocation++] = currentField;
      // partial adds the center point and the last point.
      polys[cellLocation++] = thetaResolution + (partialDisk ? 1 : 0);
      if (partialDisk) polys[cellLocation++] = 0;
      for (let i = 0; i < thetaResolution; i++) {
        polys[cellLocation++] = i + 2;
      }

      // Core: Bottom disk
      field[fieldLocation++] = currentField;
      polys[cellLocation++] = thetaResolution + (partialDisk ? 1 : 0);
      if (partialDisk) polys[cellLocation++] = 1;
      for (let i = 0; i < thetaResolution; i++) {
        polys[cellLocation++] = 2 * thetaResolution - i - 1 + 2;
      }

      // Core: sides
      if (
        !model.skipInnerFaces ||
        (model.mask && model.mask[1]) ||
        numLayers === 1
      ) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = ((i + 1) % thetaResolution) + 2;
          polys[cellLocation++] = i + 2;
          polys[cellLocation++] = i + thetaResolution + 2;
          polys[cellLocation++] =
            ((i + 1) % thetaResolution) + thetaResolution + 2;

          field[fieldLocation++] = currentField;
        }
      }
      if (partialDisk) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] = 2;
        polys[cellLocation++] = 0;
        polys[cellLocation++] = 1;
        polys[cellLocation++] = thetaResolution + 2;

        field[fieldLocation++] = currentField;

        polys[cellLocation++] = 4;
        polys[cellLocation++] = 0;
        polys[cellLocation++] = thetaResolution + 1;
        polys[cellLocation++] = 2 * thetaResolution + 1;
        polys[cellLocation++] = 1;

        field[fieldLocation++] = currentField;
      }
    }

    // Create cells for the layers
    for (let layer = 1; layer < numLayers; layer++) {
      // Skip layer if masked
      if (model.mask && model.mask[layer]) {
        /* eslint-disable no-continue */
        continue;
        /* eslint-enable no-continue */
      }

      // two for center points, then skip previous layer's points
      const offset = thetaResolution * 2 * (layer - 1) + 2;
      const a = offset + 2 * thetaResolution; // next layer offset
      const lastLayer = numLayers - 1 === layer;
      currentField = model.cellFields[layer];

      // Create top
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] = i + offset;
        polys[cellLocation++] = ((i + 1) % thetaResolution) + offset;
        polys[cellLocation++] = ((i + 1) % thetaResolution) + a;
        polys[cellLocation++] = i + a;

        field[fieldLocation++] = currentField;
      }

      // Create bottom
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] =
          ((i + 1) % thetaResolution) + offset + thetaResolution;
        polys[cellLocation++] = i + offset + thetaResolution;
        polys[cellLocation++] = i + a + thetaResolution;
        polys[cellLocation++] =
          ((i + 1) % thetaResolution) + a + thetaResolution;

        field[fieldLocation++] = currentField;
      }

      // Create inner
      if (!model.skipInnerFaces || (model.mask && model.mask[layer - 1])) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = i + offset;
          polys[cellLocation++] = ((i + 1) % thetaResolution) + offset;
          polys[cellLocation++] =
            ((i + 1) % thetaResolution) + thetaResolution + offset;
          polys[cellLocation++] = i + thetaResolution + offset;

          field[fieldLocation++] = currentField;
        }
      }

      // Create outer
      if (
        !model.skipInnerFaces ||
        lastLayer ||
        (model.mask && (model.mask[layer + 1] || lastLayer))
      ) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = ((i + 1) % thetaResolution) + a;
          polys[cellLocation++] = i + a;
          polys[cellLocation++] = i + thetaResolution + a;
          polys[cellLocation++] =
            ((i + 1) % thetaResolution) + thetaResolution + a;

          field[fieldLocation++] = currentField;
        }
      }
      // create caps
      if (partialDisk) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] = a; // from first outer
        polys[cellLocation++] = offset; // first inner
        polys[cellLocation++] = thetaResolution + offset; // first inner
        polys[cellLocation++] = thetaResolution + a; // first outer

        field[fieldLocation++] = currentField;

        polys[cellLocation++] = 4;
        polys[cellLocation++] = model.resolution + a; // last outer
        polys[cellLocation++] = model.resolution + offset; // last inner
        polys[cellLocation++] = model.resolution + thetaResolution + offset; // last inner
        polys[cellLocation++] = model.resolution + thetaResolution + a; // last outer

        field[fieldLocation++] = currentField;
      }
    }

    // Apply transformation to the point coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([0, 0, 1], model.direction)
      .apply(points);

    dataset = vtkPolyData.newInstance();
    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(polys, 1);
    dataset
      .getCellData()
      .setScalars(vtkDataArray.newInstance({ name: 'layer', values: field }));

    // Update output
    outData[0] = dataset;
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  height: 1.0,
  radius: [0.5],
  cellFields: [1],
  resolution: 6,
  startTheta: 0.0,
  endTheta: 360.0,
  center: [0, 0, 0],
  direction: [0.0, 0.0, 1.0],
  skipInnerFaces: true,
  mask: null, // If present, array to know if a layer should be skipped(=true)
  pointType: 'Float32Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'height',
    'resolution',
    'startTheta',
    'endTheta',
    'skipInnerFaces',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'direction'], 3);
  macro.getArray(publicAPI, model, ['cellFields']);
  macro.algo(publicAPI, model, 0, 1);
  vtkConcentricCylinderSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkConcentricCylinderSource'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
