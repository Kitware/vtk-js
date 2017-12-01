import macro       from 'vtk.js/Sources/macro';
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
  publicAPI.setRadius = (index, radius) => { model.radius[index] = radius; publicAPI.modified(); };
  publicAPI.setCellField = (index, field) => { model.cellFields[index] = field; publicAPI.modified(); };


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

  publicAPI.getMaskLayer = index => ((index === undefined) ? model.mask : model.mask[index]);

  function requestData(inData, outData) {
    if (model.deleted || !model.radius.length) {
      return;
    }

    // Make sure we have concistency
    validateCellFields();

    let dataset = outData[0];

    const nbLayers = model.radius.length;
    const angle = 2 * Math.PI / model.resolution;
    const zRef = model.height / 2.0;
    const numberOfPoints = model.resolution * nbLayers * 2;

    // Compute cell count
    let cellArraySize = 0;
    let nbCells = 0;

    if (!model.skipInnerFaces && !model.mask) {
      // We keep everything
      cellArraySize = (2 * (model.resolution + 1)) + (5 * model.resolution) + ((nbLayers - 1) * model.resolution * 20);
      nbCells = 2 + model.resolution + ((nbLayers - 1) * 4 * model.resolution);
    } else if (!model.skipInnerFaces && model.mask) {
      // We skip some cylinders
      // Handle core
      if (!model.mask[0]) {
        cellArraySize += (2 * (model.resolution + 1)) + (5 * model.resolution);
        nbCells += 2 + model.resolution;
      }
      // Handle inside cylinders
      for (let layer = 1; layer < nbLayers; layer++) {
        if (!model.mask[layer]) {
          // Add inside cylinder count
          cellArraySize += model.resolution * 20;
          nbCells += 4 * model.resolution;
        }
      }
    } else {
      // We skip cylinders and internal faces
      if (!model.skipInnerFaces || !model.mask || !model.mask[0]) {
        // core handling
        cellArraySize += (2 * (model.resolution + 1));
        nbCells += 2;
        if (model.radius.length === 1 || !model.skipInnerFaces || (model.mask && model.mask[1])) {
          // add side faces
          cellArraySize += 5 * model.resolution;
          nbCells += model.resolution;
        }
      }

      // Handle inside cylinders
      for (let layer = 1; layer < nbLayers; layer++) {
        if (!model.skipInnerFaces || !model.mask || !model.mask[layer]) {
          const lastLayer = (nbLayers - 1 === layer);

          // Add inside cylinder
          cellArraySize += model.resolution * 10;
          nbCells += model.resolution * 2; // top + bottom

          // Do we add innerFaces
          if (!model.skipInnerFaces || (model.mask && model.mask[layer - 1])) {
            cellArraySize += model.resolution * 5;
            nbCells += model.resolution;
          }

          // Do we add outterFaces
          if (lastLayer || !model.skipInnerFaces || (model.mask && model.mask[layer + 1])) {
            cellArraySize += model.resolution * 5;
            nbCells += model.resolution;
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
    const field = new Float32Array(nbCells);

    // Create points
    for (let layer = 0; layer < nbLayers; layer++) {
      const radius = model.radius[layer];
      // Create top
      for (let i = 0; i < model.resolution; i++) {
        points[(pointIdx * 3) + 0] = radius * Math.cos(i * angle);
        points[(pointIdx * 3) + 1] = radius * Math.sin(i * angle);
        points[(pointIdx * 3) + 2] = zRef;
        pointIdx++;
      }

      // Create bottom
      for (let i = 0; i < model.resolution; i++) {
        points[(pointIdx * 3) + 0] = radius * Math.cos(i * angle);
        points[(pointIdx * 3) + 1] = radius * Math.sin(i * angle);
        points[(pointIdx * 3) + 2] = -zRef;
        pointIdx++;
      }
    }

    // Create cells for the core
    let currentField = model.cellFields[0];

    // Core: filtering
    if (!model.mask || !model.mask[0]) {
      // Core: Top disk
      field[fieldLocation++] = currentField;
      polys[cellLocation++] = model.resolution;
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = i;
      }

      // Core: Bottom disk
      field[fieldLocation++] = currentField;
      polys[cellLocation++] = model.resolution;
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = (2 * model.resolution) - i - 1;
      }

      // Core: sides
      if (!model.skipInnerFaces || (model.mask && model.mask[1]) || nbLayers === 1) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = (i + 1) % model.resolution;
          polys[cellLocation++] = i;
          polys[cellLocation++] = i + model.resolution;
          polys[cellLocation++] = ((i + 1) % model.resolution) + model.resolution;

          field[fieldLocation++] = currentField;
        }
      }
    }

    // Create cells for the layers
    for (let layer = 1; layer < nbLayers; layer++) {
      // Skip layer if masked
      if (model.mask && model.mask[layer]) {
        /* eslint-disable no-continue */
        continue;
        /* eslint-enable no-continue */
      }

      const offset = model.resolution * 2 * (layer - 1);
      const lastLayer = (nbLayers - 1 === layer);
      currentField = model.cellFields[layer];

      // Create top
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] = i + offset;
        polys[cellLocation++] = ((i + 1) % model.resolution) + offset;
        polys[cellLocation++] = ((i + 1) % model.resolution) + (2 * model.resolution) + offset;
        polys[cellLocation++] = i + (2 * model.resolution) + offset;

        field[fieldLocation++] = currentField;
      }

      // Create bottom
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 4;
        polys[cellLocation++] = ((i + 1) % model.resolution) + offset + model.resolution;
        polys[cellLocation++] = i + offset + model.resolution;
        polys[cellLocation++] = i + (2 * model.resolution) + offset + model.resolution;
        polys[cellLocation++] = ((i + 1) % model.resolution) + (2 * model.resolution) + offset + model.resolution;

        field[fieldLocation++] = currentField;
      }

      // Create inner
      if (!model.skipInnerFaces || (model.mask && model.mask[layer - 1])) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = i + offset;
          polys[cellLocation++] = ((i + 1) % model.resolution) + offset;
          polys[cellLocation++] = ((i + 1) % model.resolution) + model.resolution + offset;
          polys[cellLocation++] = i + model.resolution + offset;

          field[fieldLocation++] = currentField;
        }
      }

      // Create outter
      if (!model.skipInnerFaces || lastLayer || (model.mask && (model.mask[layer + 1] || lastLayer))) {
        for (let i = 0; i < model.resolution; i++) {
          polys[cellLocation++] = 4;
          polys[cellLocation++] = ((i + 1) % model.resolution) + offset + (2 * model.resolution);
          polys[cellLocation++] = i + offset + (2 * model.resolution);
          polys[cellLocation++] = i + model.resolution + offset + (2 * model.resolution);
          polys[cellLocation++] = ((i + 1) % model.resolution) + model.resolution + offset + (2 * model.resolution);

          field[fieldLocation++] = currentField;
        }
      }
    }

    // Apply tranformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([0, 0, 1], model.direction)
      .apply(points);

    dataset = vtkPolyData.newInstance();
    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(polys, 1);
    dataset.getCellData().setScalars(vtkDataArray.newInstance({ name: 'layer', values: field }));

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
    'skipInnerFaces',
  ]);
  macro.setGetArray(publicAPI, model, [
    'center',
    'direction',
  ], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkConcentricCylinderSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkConcentricCylinderSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
