import * as CoincidentTopologyHelper              from './CoincidentTopologyHelper';
import * as macro                                 from '../../../macro';
import otherStaticMethods                         from './Static';
import vtkDataSet                                 from '../../../Common/DataModel/DataSet';
import vtkLookupTable                             from '../../../Common/Core/LookupTable';
import vtkMath                                    from '../../../Common/Core/Math';
import { COLOR_MODE, SCALAR_MODE, MATERIAL_MODE } from './Constants';

function notImplemented(method) {
  return () => console.log(`vtkMapper::${method} - NOT IMPLEMENTED`);
}

// CoincidentTopology static methods ------------------------------------------
/* eslint-disable arrow-body-style */

const staticOffsetModel = {
  Polygon: { factor: 2, unit: 2 },
  Line: { factor: 1, unit: 1 },
  Point: { factor: 0, unit: 0 },
};
const staticOffsetAPI = {};

CoincidentTopologyHelper.addCoincidentTopologyMethods(
  staticOffsetAPI,
  staticOffsetModel,
  CoincidentTopologyHelper.CATEGORIES
    .map(key => {
      return { key, method: `ResolveCoincidentTopology${key}OffsetParameters` };
    })
);

// ----------------------------------------------------------------------------
// vtkMapper methods
// ----------------------------------------------------------------------------

function vtkMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMapper');

  publicAPI.getBounds = () => {
    const input = publicAPI.getInput();
    if (!input) {
      model.bounds = vtkMath.createUninitializedBouds();
    } else {
      if (!model.static) {
        // publicAPI.update();
        console.log('implement update');
      }
      model.bounds = vtkDataSet.getBounds(input);
    }
    return model.bounds;
  };

  publicAPI.getInput = () => publicAPI.getInputData();

  publicAPI.setForceCompileOnly = v => {
    model.forceCompileOnly = v;
    // make sure we do NOT call modified()
  };

  publicAPI.createDefaultLookupTable = () => {
    model.lookupTable = vtkLookupTable.newInstance();
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

  // Add Static methods to our instance
  Object.keys(otherStaticMethods).forEach(methodName => {
    publicAPI[methodName] = otherStaticMethods[methodName];
  });
  Object.keys(staticOffsetAPI).forEach(methodName => {
    publicAPI[methodName] = staticOffsetAPI[methodName];
  });

  // Relative metods
  /* eslint-disable arrow-body-style */
  model.topologyOffset = {
    Polygon: { factor: 0, unit: 0 },
    Line: { factor: 0, unit: 0 },
    Point: { factor: 0, unit: 0 },
  };
  CoincidentTopologyHelper.addCoincidentTopologyMethods(
    publicAPI,
    model.topologyOffset,
    CoincidentTopologyHelper.CATEGORIES
      .map(key => {
        // GetRelativeCoincidentTopologyPolygon
        return { key, method: `RelativeCoincidentTopology${key}OffsetParameters` };
      })
  );
  /* eslint-enable arrow-body-style */

  publicAPI.getCoincidentTopologyPolygonOffsetParameters = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyPolygonOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPolygonOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyLineOffsetParameters = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyLineOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyLineOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.getCoincidentTopologyPointOffsetParameter = () => {
    const globalValue = staticOffsetAPI.getResolveCoincidentTopologyPointOffsetParameters();
    const localValue = publicAPI.getRelativeCoincidentTopologyPointOffsetParameters();
    return {
      factor: globalValue.factor + localValue.factor,
      units: globalValue.units + localValue.units,
    };
  };

  publicAPI.mapScalars = (input, alpha) => {
    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      model.colorMapColors = lut.mapScalars(input.getPointData().getScalars(), model.colorMode, 0);
    }
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

  publicAPI.getLookupTable = () => {
    if (!model.lookupTable) {
      publicAPI.createDefaultLookupTable();
    }
    return model.lookupTable;
  };

  publicAPI.acquireInvertibleLookupTable = notImplemented('AcquireInvertibleLookupTable');
  publicAPI.valueToColor = notImplemented('ValueToColor');
  publicAPI.colorToValue = notImplemented('ColorToValue');
  publicAPI.useInvertibleColorFor = notImplemented('UseInvertibleColorFor');
  publicAPI.clearInvertibleColor = notImplemented('ClearInvertibleColor');
  publicAPI.getColorModeAsString = notImplemented('getColorModeAsString');
  publicAPI.getScalarModeAsString = notImplemented('GetScalarModeAsString');
  publicAPI.getScalarMaterialModeAsString = notImplemented('GetScalarMaterialModeAsString');
  publicAPI.scalarToTextureCoordinate = notImplemented('ScalarToTextureCoordinate');
  publicAPI.createColorTextureCoordinates = notImplemented('CreateColorTextureCoordinates');
  publicAPI.mapScalarsToTexture = notImplemented('MapScalarsToTexture');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  colorMapColors: null, // Same as this->Colors

  static: false,
  lookupTable: null,

  scalarVisibility: true,
  scalarRange: [0, 1],
  useLookupTableScalarRange: false,

  colorMode: 0,
  scalarMode: 0,
  scalarMaterialMode: 0,

  bounds: [1, -1, 1, -1, 1, -1],
  center: [0, 0],

  renderTime: 0,

  colorByArrayName: null,
  colorByArrayComponent: -1,

  fieldDataTupleId: -1,

  interpolateScalarsBeforeMapping: false,
  colorCoordinates: null,
  colorTextureMap: null,

  forceCompileOnly: 0,

  useInvertibleColors: false,
  invertibleScalars: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model); // FIXME parent is not vtkObject
  macro.algo(publicAPI, model, 1, 0);
  macro.get(publicAPI, model, [
    'colorMapColors',
    'colorCoordinates',
    'colorTextureMap',
  ]);
  macro.setGet(publicAPI, model, [
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
  ]);
  macro.setGetArray(publicAPI, model, [
    'scalarRange',
  ], 2);

  // Object methods
  vtkMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, staticOffsetAPI, otherStaticMethods);
