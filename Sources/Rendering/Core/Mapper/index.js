import * as macro from '../../../macro';
import LookupTable from '../../../Common/Core/LookupTable';

// ---- STATIC -----

export const RESOLVE_COINCIDENT_TOPOLOGY_MODE = [
  'VTK_RESOLVE_OFF',
  'VTK_RESOLVE_POLYGON_OFFSET',
];

const COINCIDENT_TOPOLOGY_OFFSETS = ['Polygon', 'Line', 'Point'];
const offsetModel = {};
const offsetAPI = {};

function addCoincidentTopologyMethods(publicAPI, model, nameList) {
  nameList.forEach(item => {
    publicAPI[`get${item.method}`] = () => model[item.key];
    publicAPI[`set${item.method}`] = (factor, unit) => {
      model[item.key] = { factor, unit };
    };
  });
}

// Add static methods
/* eslint-disable arrow-body-style */
addCoincidentTopologyMethods(
  offsetAPI,
  offsetModel,
  COINCIDENT_TOPOLOGY_OFFSETS
    .map(key => {
      return { key, method: `ResolveCoincidentTopology${key}OffsetParameters` };
    })
);

let resolveCoincidentTopology = 0;

export function getResolveCoincidentTopology() {
  return resolveCoincidentTopology;
}

export function setResolveCoincidentTopology(mode = 0) {
  resolveCoincidentTopology = mode;
}

export function setResolveCoincidentTopologyToDefault() {
  setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToOff() {
  setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToPolygonOffset() {
  setResolveCoincidentTopology(1); // VTK_RESOLVE_POLYGON_OFFSET
}

export function getResolveCoincidentTopologyAsString() {
  return RESOLVE_COINCIDENT_TOPOLOGY_MODE[resolveCoincidentTopology];
}

// ----------------------------------------------------------------------------

export const COLOR_MODE = [
  'VTK_COLOR_MODE_DEFAULT',
  'VTK_COLOR_MODE_MAP_SCALARS',
  'VTK_COLOR_MODE_DIRECT_SCALARS',
];

export const SCALAR_MODE = [
  'VTK_SCALAR_MODE_DEFAULT',
  'VTK_SCALAR_MODE_USE_POINT_DATA',
  'VTK_SCALAR_MODE_USE_CELL_DATA',
  'VTK_SCALAR_MODE_USE_POINT_FIELD_DATA',
  'VTK_SCALAR_MODE_USE_CELL_FIELD_DATA',
  'VTK_SCALAR_MODE_USE_FIELD_DATA',
];

const FIELDS = [
  'lookupTable',
  'scalarVisibility',
  'static',
  'colorMode',
  'interpolateScalarsBeforeMapping',
  'useLookupTableScalarRange',
  'fieldDataTupleId',
];

const GET_FIELDS = [
  'arrayName',
  'arrayComponent',
];

const ARRAY_2 = [
  'scalarRange',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

function mapper(publicAPI, model) {
  publicAPI.createDefaultLookupTable = () => {
    console.log('Not implemented createDefaultLookupTable');
    model.lookupTable = LookupTable.newInstance();
  };

  publicAPI.getColorModeAsString = () => COLOR_MODE[model.colorMode];

  publicAPI.setColorModeToDefault = () => publicAPI.setColorMode(0);
  publicAPI.setColorModeToMapScalars = () => publicAPI.setColorMode(1);
  publicAPI.setColorModeToDirectScalars = () => publicAPI.setColorMode(2);

  publicAPI.getScalarModeAsString = () => SCALAR_MODE[model.scalarMode];

  publicAPI.setScalarModeToDefault = () => publicAPI.setScalarMode(0);
  publicAPI.setScalarModeToUsePointData = () => publicAPI.setScalarMode(1);
  publicAPI.setScalarModeToUseCellData = () => publicAPI.setScalarMode(2);
  publicAPI.setScalarModeToUsePointFieldData = () => publicAPI.setScalarMode(3);
  publicAPI.setScalarModeToUseCellFieldData = () => publicAPI.setScalarMode(4);
  publicAPI.setScalarModeToUseFieldData = () => publicAPI.setScalarMode(5);

  publicAPI.selectColorArray = (name, component = -1) => {
    model.arrayName = name;
    model.arrayComponent = component;
    publicAPI.modified();
  };

  // Static methods
  publicAPI.getResolveCoincidentTopology = getResolveCoincidentTopology;
  publicAPI.setResolveCoincidentTopology = setResolveCoincidentTopology;
  publicAPI.setResolveCoincidentTopologyToDefault = setResolveCoincidentTopologyToDefault;
  publicAPI.setResolveCoincidentTopologyToOff = setResolveCoincidentTopologyToOff;
  publicAPI.setResolveCoincidentTopologyToPolygonOffset = setResolveCoincidentTopologyToPolygonOffset;
  publicAPI.getResolveCoincidentTopologyAsString = getResolveCoincidentTopologyAsString;

  offsetAPI.forEach(name => {
    publicAPI[name] = offsetAPI[name];
  });

  // Relative metods
  /* eslint-disable arrow-body-style */
  model.topologyOffset = {};
  addCoincidentTopologyMethods(
    publicAPI,
    model.topologyOffset,
    COINCIDENT_TOPOLOGY_OFFSETS
      .map(key => {
        // GetRelativeCoincidentTopologyPolygon
        return { key, method: `RelativeCoincidentTopology${key}OffsetParameters` };
      })
  );
  /* eslint-enable arrow-body-style */

  publicAPI.getCoincidentTopologyPolygonOffsetParameters = () => {
    const globalValue = offsetAPI.getResolveCoincidentTopologyPolygonOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPolygonOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyLineOffsetParameters = () => {
    const globalValue = offsetAPI.getResolveCoincidentTopologyLineOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyLineOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyPointOffsetParameter = () => {
    const globalValue = offsetAPI.getResolveCoincidentTopologyPointOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPointOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lookupTable: null,
  scalarVisibility: true,
  static: false,
  colorMode: 0,
  interpolateScalarsBeforeMapping: false,
  useLookupTableScalarRange: false,
  scalarRange: [0, 1],
  scalarMode: 0,
  arrayName: null,
  arrayComponent: -1,
  fieldDataTupleId: -1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.get(publicAPI, model, GET_FIELDS);
  macro.setGet(publicAPI, model, FIELDS);
  macro.setGetArray(publicAPI, model, ARRAY_2, 2);

  // Object methods
  mapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkMapper');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default Object.assign({
  newInstance,
  extend,

  // Static methods
  getResolveCoincidentTopology,
  setResolveCoincidentTopology,
  setResolveCoincidentTopologyToDefault,
  setResolveCoincidentTopologyToOff,
  setResolveCoincidentTopologyToPolygonOffset,
  getResolveCoincidentTopologyAsString,

}, offsetAPI);
