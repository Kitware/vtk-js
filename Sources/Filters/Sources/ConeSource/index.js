import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

const STD_FIELDS = ['height', 'radius', 'resolution', 'capping'];
const ARRAY_FIELDS_3 = ['center', 'direction'];

// ----------------------------------------------------------------------------
// ConeSource methods
// ----------------------------------------------------------------------------

export function coneSource(publicAPI, model) {
  function update() {
    if (model.deleted) {
      return;
    }

    let dataset = model.output[0];
    if (!dataset || dataset.mtime !== model.mtime) {
      const state = {};
      dataset = {
        type: 'PolyData',
        mtime: model.mtime,
        metadata: {
          source: 'ConeSource',
          state,
        },
        PolyData: {
          Points: {
            type: 'DataArray',
            name: '_points',
            tuple: 3,
            dataType: model.pointType,
          },
          Cells: {
            Polys: {
              type: 'DataArray',
              name: '_polys',
              tuple: 1,
              dataType: 'Uint32Array',
            },
          },
        },
      };

      // Add parameter used to create dataset as metadata.state[*]
      STD_FIELDS.forEach(field => {
        state[field] = model[field];
      });
      ARRAY_FIELDS_3.forEach(field => {
        state[field] = [].concat(model[field]);
      });

      // ----------------------------------------------------------------------
      const angle = 2 * Math.PI / model.resolution;
      const xbot = -model.height / 2.0;
      const numberOfPoints = model.resolution + 1;
      const cellArraySize = 4 * model.resolution + 1 + model.resolution;

      // Points
      let pointIdx = 0;
      const points = new window[dataset.PolyData.Points.dataType](numberOfPoints * 3);
      dataset.PolyData.Points.values = points;

      // Cells
      let cellLocation = 0;
      const polys = new window[dataset.PolyData.Cells.Polys.dataType](cellArraySize);
      dataset.PolyData.Cells.Polys.values = polys;

      // Add summit point
      points[0] = model.height / 2.0;
      points[1] = 0.0;
      points[2] = 0.0;

      // Create bottom cell
      if (model.capping) {
        polys[cellLocation++] = model.resolution;
      }

      // Add all points
      for (let i = 0; i < model.resolution; i++) {
        pointIdx++;
        points[pointIdx * 3 + 0] = xbot;
        points[pointIdx * 3 + 1] = model.radius * Math.cos(i * angle);
        points[pointIdx * 3 + 2] = model.radius * Math.sin(i * angle);

        // Add points to bottom cell in reverse order
        if (model.capping) {
          polys[model.resolution - cellLocation++] = pointIdx;
        }
      }

      // Add all triangle cells
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 3;
        polys[cellLocation++] = 0;
        polys[cellLocation++] = i + 1;
        polys[cellLocation++] = i + 2 > model.resolution ? 1 : i + 2;
      }

      // FIXME apply tranform

      // Update output
      model.output[0] = dataset;
    }
  }

  // Expose methods
  publicAPI.update = update;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  height: 1.0,
  radius: 0.5,
  resolution: 6,
  center: [0, 0, 0],
  direction: [1.0, 0.0, 0.0],
  capping: true,
  pointType: 'Float32Array',
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, STD_FIELDS);
  macro.setGetArray(publicAPI, model, ARRAY_FIELDS_3, 3);
  macro.algo(publicAPI, model, 0, 1);

  // Object methods
  coneSource(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
