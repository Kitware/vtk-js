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

let resolveCoincidentTopologyPolygonOffsetFaces = 1;
let resolveCoincidentTopology = 0;

export function getResolveCoincidentTopologyPolygonOffsetFaces() {
  return resolveCoincidentTopologyPolygonOffsetFaces;
}

export function setResolveCoincidentTopologyPolygonOffsetFaces(value) {
  resolveCoincidentTopologyPolygonOffsetFaces = value;
}

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

export const MATERIAL_MODE = [
  'VTK_MATERIALMODE_DEFAULT',
  'VTK_MATERIALMODE_AMBIENT',
  'VTK_MATERIALMODE_DIFFUSE',
  'VTK_MATERIALMODE_AMBIENT_AND_DIFFUSE',
];

// ----------------------------------------------------------------------------

const FIELDS = [
  'lookupTable',
  'scalarVisibility',
  'static',
  'colorMode',
  'interpolateScalarsBeforeMapping',
  'useLookupTableScalarRange',
  'fieldDataTupleId',
  'renderTime',
  'colorByArrayName',
  'colorByArrayComponent',
  'scalarMaterialMode',
];

const GET_FIELDS = [
  'colorMapColors',
  'colorCoordinates',
  'colorTextureMap',
];

const ARRAY_2 = [
  'scalarRange',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

function mapper(publicAPI, model) {
  publicAPI.createDefaultLookupTable = () => {
    console.log('vtkMapper::createDefaultLookupTable - NOT IMPLEMENTED');
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

  // Static methods
  publicAPI.getResolveCoincidentTopology = getResolveCoincidentTopology;
  publicAPI.setResolveCoincidentTopology = setResolveCoincidentTopology;
  publicAPI.setResolveCoincidentTopologyToDefault = setResolveCoincidentTopologyToDefault;
  publicAPI.setResolveCoincidentTopologyToOff = setResolveCoincidentTopologyToOff;
  publicAPI.setResolveCoincidentTopologyToPolygonOffset = setResolveCoincidentTopologyToPolygonOffset;
  publicAPI.getResolveCoincidentTopologyAsString = getResolveCoincidentTopologyAsString;

  publicAPI.getResolveCoincidentTopologyPolygonOffsetFaces = getResolveCoincidentTopologyPolygonOffsetFaces;
  publicAPI.setResolveCoincidentTopologyPolygonOffsetFaces = setResolveCoincidentTopologyPolygonOffsetFaces;

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

  publicAPI.getBounds = () => {
    console.log('vtkMapper::getBounds - NOT IMPLEMENTED');
    return null;
  };

  publicAPI.mapScalars = (input, alpha) => {
    console.log('vtkMapper::mapScalars - NOT IMPLEMENTED');
    const cellFlag = false;
    const rgba = new Uint8Array(10);
    return { rgba, cellFlag };
  };

  publicAPI.setScalarMaterialModeToDefault = () => publicAPI.setScalarMaterialMode(0);
  publicAPI.setScalarMaterialModeToAmbient = () => publicAPI.setScalarMaterialMode(1);
  publicAPI.setScalarMaterialModeToDiffuse = () => publicAPI.setScalarMaterialMode(2);
  publicAPI.setScalarMaterialModeToAmbientAndDiffuse = () => publicAPI.setScalarMaterialMode(3);
  publicAPI.getScalarMaterialModeAsString = () => MATERIAL_MODE[model.scalarMaterialMode];

  publicAPI.getIsOpaque = () => {
    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      return lut.isOpaque();
    }
    return true;
  };

  publicAPI.canUseTextureMapForColoring = input => {
    console.log('vtkMapper::canUseTextureMapForColoring - NOT IMPLEMENTED');
    return false;
  };

  publicAPI.clearColorArrays = () => {
    model.colorMapColors = null;
    model.colorCoordinates = null;
    model.colorTextureMap = null;
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
  colorByArrayName: null,
  colorByArrayComponent: -1,
  fieldDataTupleId: -1,
  renderTime: 0,
  scalarMaterialMode: 0,

  colorMapColors: null,
  colorCoordinates: null,
  colorTextureMap: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.algo(publicAPI, model, 1, 0);
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

  getResolveCoincidentTopologyPolygonOffsetFaces,
  setResolveCoincidentTopologyPolygonOffsetFaces,

}, offsetAPI);
