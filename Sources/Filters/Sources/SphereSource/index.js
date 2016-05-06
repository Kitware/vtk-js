import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

const STD_FIELDS = [
  'radius',
  'latLongTessellation',
  'thetaResolution',
  'startTheta',
  'endTheta',
  'phiResolution',
  'startPhi',
  'endPhi',
];
const ARRAY_FIELDS_3 = ['center'];

// ----------------------------------------------------------------------------
// SphereSource methods
// ----------------------------------------------------------------------------

export function sphereSource(publicAPI, model) {
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
          source: 'SphereSource',
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
      // FIXME

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
  radius: 0.5,
  latLongTessellation: false,
  thetaResolution: 8,
  startTheta: 0.0,
  endTheta: 360.0,
  phiResolution: 8,
  startPhi: 0.0,
  endPhi: 360.0,
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
  sphereSource(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
