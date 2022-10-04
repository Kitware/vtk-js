import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';

import Constants from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

const { ColorMode, ScalarMode, GetArray } = Constants;

// ---------------------------------------------------------------------------
// vtkMapper2D methods
// ---------------------------------------------------------------------------

function vtkMapper2D(publicAPI, model) {
  // Set out className
  model.classHierarchy.push('vtkMapper2D');

  publicAPI.createDefaultLookupTable = () => {
    model.lookupTable = vtkLookupTable.newInstance();
  };

  publicAPI.getColorModeAsString = () =>
    macro.enumToString(ColorMode, model.colorMode);

  publicAPI.setColorModeToDefault = () => publicAPI.setColorMode(0);
  publicAPI.setColorModeToMapScalars = () => publicAPI.setColorMode(1);
  publicAPI.setColorModeToDirectScalars = () => publicAPI.setColorMode(2);

  publicAPI.getScalarModeAsString = () =>
    macro.enumToString(ScalarMode, model.scalarMode);

  publicAPI.setScalarModeToDefault = () => publicAPI.setScalarMode(0);
  publicAPI.setScalarModeToUsePointData = () => publicAPI.setScalarMode(1);
  publicAPI.setScalarModeToUseCellData = () => publicAPI.setScalarMode(2);
  publicAPI.setScalarModeToUsePointFieldData = () => publicAPI.setScalarMode(3);
  publicAPI.setScalarModeToUseCellFieldData = () => publicAPI.setScalarMode(4);
  publicAPI.setScalarModeToUseFieldData = () => publicAPI.setScalarMode(5);

  publicAPI.getAbstractScalars = (
    input,
    scalarMode,
    arrayAccessMode,
    arrayId,
    arrayName
  ) => {
    // make sure we have an input
    if (!input || !model.scalarVisibility) {
      return { scalars: null, cellFLag: false };
    }

    let scalars = null;
    let cellFlag = false;

    // get scalar data and point/cell attribute according to scalar mode
    if (scalarMode === ScalarMode.DEFAULT) {
      scalars = input.getPointData().getScalars();
      if (!scalars) {
        scalars = input.getCellData().getScalars();
        cellFlag = true;
      }
    } else if (scalarMode === ScalarMode.USE_POINT_DATA) {
      scalars = input.getPointData().getScalars();
    } else if (scalarMode === ScalarMode.USE_CELL_DATA) {
      scalars = input.getCellData().getScalars();
      cellFlag = true;
    } else if (scalarMode === ScalarMode.USE_POINT_FIELD_DATA) {
      const pd = input.getPointData();
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = pd.getArrayByIndex(arrayId);
      } else {
        scalars = pd.getArrayByName(arrayName);
      }
    } else if (scalarMode === ScalarMode.USE_CELL_FIELD_DATA) {
      const cd = input.getCellData();
      cellFlag = true;
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = cd.getArrayByIndex(arrayId);
      } else {
        scalars = cd.getArrayByName(arrayName);
      }
    } else if (scalarMode === ScalarMode.USE_FIELD_DATA) {
      const fd = input.getFieldData();
      if (arrayAccessMode === GetArray.BY_ID) {
        scalars = fd.getArrayByIndex(arrayId);
      } else {
        scalars = fd.getArrayByName(arrayName);
      }
    }

    return { scalars, cellFlag };
  };

  publicAPI.getLookupTable = () => {
    if (!model.lookupTable) {
      publicAPI.createDefaultLookupTable();
    }
    return model.lookupTable;
  };

  publicAPI.getMTime = () => {
    let mt = model.mtime;
    if (model.lookupTable !== null) {
      const time = model.lookupTable.getMTime();
      mt = time > mt ? time : mt;
    }
    return mt;
  };

  publicAPI.mapScalars = (input, alpha) => {
    const scalars = publicAPI.getAbstractScalars(
      input,
      model.scalarMode,
      model.arrayAccessMode,
      model.arrayId,
      model.colorByArrayName
    ).scalars;

    if (!scalars) {
      model.colorMapColors = null;
      return;
    }

    // we want to only recompute when something has changed
    const toString = `${publicAPI.getMTime()}${scalars.getMTime()}${alpha}`;
    if (model.colorBuildString === toString) return;

    if (!model.useLookupTableScalarRange) {
      publicAPI
        .getLookupTable()
        .setRange(model.scalarRange[0], model.scalarRange[1]);
    }

    const lut = publicAPI.getLookupTable();
    if (lut) {
      // Ensure that the lookup table is built
      lut.build();
      model.colorMapColors = lut.mapScalars(
        scalars,
        model.colorMode,
        model.fieldDataTupleId
      );
    }
    model.colorBuildString = `${publicAPI.getMTime()}${scalars.getMTime()}${alpha}`;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  static: false,
  lookupTable: null,

  scalarVisibility: false,
  scalarRange: [0, 1],
  useLookupTableScalarRange: false,

  colorMode: 0,
  scalarMode: 0,
  arrayAccessMode: 1, // By_NAME

  renderTime: 0,

  colorByArrayName: null,

  transformCoordinate: null,

  viewSpecificProperties: null,
  customShaderAttributes: [],
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['colorMapColors']);
  macro.setGet(publicAPI, model, [
    'arrayAccessMode',
    'colorByArrayName',
    'colorMode',
    'lookupTable',
    'renderTime',
    'scalarMode',
    'scalarVisibility',
    'static',
    'transformCoordinate',
    'useLookupTableScalarRange',
    'viewSpecificProperties',
    'customShaderAttributes', // point data array names that will be transferred to the VBO
  ]);
  macro.setGetArray(publicAPI, model, ['scalarRange'], 2);

  if (!model.viewSpecificProperties) {
    model.viewSpecificProperties = {};
  }

  // Object methods
  vtkMapper2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMapper2D');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
