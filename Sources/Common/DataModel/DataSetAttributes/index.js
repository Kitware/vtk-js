import * as macro from '../../../macro';

/* eslint-disable no-unused-vars */
// Needed so the VTK factory is filled with them
import vtkFieldData from './FieldData';
import { AttributeTypes, AttributeCopyOperations } from './Constants';
import vtkDataArray from '../../../Common/Core/DataArray';
// import vtkStringArray from '../../../Common/Core/vtkStringArray';

import vtk from '../../../vtk';

// ----------------------------------------------------------------------------
// vtkDataSetAttributes methods
// ----------------------------------------------------------------------------

function vtkDataSetAttributes(publicAPI, model) {
  const attrTypes = ['Scalars', 'Vectors', 'Normals',
    'TCoords', 'Tensors', 'GlobalIds', 'PedigreeIds'];

  function cleanAttributeType(attType) {
    // Given an integer or string, convert the result to one of the
    // strings in the "attrTypes" array above or null (if
    // no match is found)
    let cleanAttType = attrTypes.find(
      ee => (
        AttributeTypes[ee.toUpperCase()] === attType ||
        (typeof attType !== 'number' && ee.toLowerCase() === attType.toLowerCase())));
    if (typeof cleanAttType === 'undefined') {
      cleanAttType = null;
    }
    return cleanAttType;
  }

  // Set our className
  model.classHierarchy.push('vtkDataSetAttributes');

  publicAPI.checkNumberOfComponents = x => true; // TODO

  publicAPI.setAttribute = (arr, uncleanAttType) => {
    const attType = cleanAttributeType(uncleanAttType);
    if (arr && attType.toUpperCase() === 'PEDIGREEIDS' && !arr.isA('vtkDataArray')) {
      vtkWarningMacro(`Can not set attribute ${attType}. The attribute must be a vtkDataArray.`);
      return -1;
    }
    if (arr && !publicAPI.checkNumberOfComponents(arr, attType)) {
      vtkWarningMacro(`Can not set attribute ${attType}. Incorrect number of components.`);
      return -1;
    }
    let currentAttribute = model[`active${attType}`];
    if ((currentAttribute >= 0) && (currentAttribute < model.arrays.length)) {
      if (model.arrays[currentAttribute] === arr) {
        return currentAttribute;
      }
      publicAPI.removeArrayByIndex(currentAttribute);
    }

    if (arr) {
      currentAttribute = publicAPI.addArray(arr);
      model[`active${attType}`] = currentAttribute;
    } else {
      model[`active${attType}`] = -1;
    }
    publicAPI.modified();
    return model[`active${attType}`];
  };

  publicAPI.setActiveAttributeByName = (arrayName, attType) =>
    publicAPI.setActiveAttributeByIndex(
      publicAPI.getArrayWithIndex(arrayName).index, attType);

  publicAPI.setActiveAttributeByIndex = (arrayIdx, uncleanAttType) => {
    const attType = cleanAttributeType(uncleanAttType);
    if (arrayIdx >= 0 && arrayIdx < model.arrays.length) {
      if (attType.toUpperCase() !== 'PEDIGREEIDS') {
        const arr = publicAPI.getArrayByIndex(arrayIdx);
        if (!arr.isA('vtkDataArray')) {
          vtkWarningMacro(`Can not set attribute ${attType}. Only vtkDataArray subclasses can be set as active attributes.`);
          return -1;
        }
        if (!publicAPI.checkNumberOfComponents(arr, attType)) {
          vtkWarningMacro(`Can not set attribute ${attType}. Incorrect number of components.`);
          return -1;
        }
      }
      model[`active${attType}`] = arrayIdx;
      publicAPI.modified();
      return arrayIdx;
    } else if (arrayIdx === -1) {
      model[`active${attType}`] = arrayIdx;
      publicAPI.modified();
    }
    return -1;
  };

  publicAPI.getActiveAttribute = (attType) => {
    // Given an integer enum value or a string (with random capitalization),
    // find the matching string in attrTypes.
    const cleanAttType = cleanAttributeType(attType);
    return publicAPI[`get${cleanAttType}`]();
  };

  attrTypes.forEach((value) => {
    publicAPI[`get${value}`] = () => publicAPI.getArrayByIndex(model[`active${value}`]);
    publicAPI[`set${value}`] = da => publicAPI.setAttribute(da, value);
    publicAPI[`setActive${value}`] =
      arrayName => publicAPI.setActiveAttributeByIndex(
        publicAPI.getArrayWithIndex(arrayName).index, value);
  });

  publicAPI.initialize = macro.chain(publicAPI.initialize, () => {
    // Default to copying all attributes in every circumstance:
    model.copyAttributeFlags = [];
    Object.keys(AttributeCopyOperations)
      .filter(op => op !== 'ALLCOPY').forEach((attCopyOp) => {
        model.copyAttributeFlags[AttributeCopyOperations[attCopyOp]] =
          Object.keys(AttributeTypes).filter(ty => ty !== 'NUM_ATTRIBUTES').reduce(
            (a, b) => { a[AttributeTypes[b]] = true; return a; }, []);
      });
    // Override some operations where we don't want to copy:
    model.copyAttributeFlags[AttributeCopyOperations.COPYTUPLE][AttributeTypes.GLOBALIDS] = false;
    model.copyAttributeFlags[AttributeCopyOperations.INTERPOLATE][AttributeTypes.GLOBALIDS] = false;
    model.copyAttributeFlags[AttributeCopyOperations.COPYTUPLE][AttributeTypes.PEDIGREEIDS] = false;
  });

  // Process dataArrays if any
  if (model.dataArrays && Object.keys(model.dataArrays).length) {
    Object.keys(model.dataArrays).forEach((name) => {
      if (!model.dataArrays[name].ref && model.dataArrays[name].type === 'vtkDataArray') {
        publicAPI.addArray(vtkDataArray.newInstance(model.dataArrays[name]));
      }
    });
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeScalars: -1,
  activeVectors: -1,
  activeTensors: -1,
  activeNormals: -1,
  activeTCoords: -1,
  activeGlobalIds: -1,
  activePedigreeIds: -1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkFieldData.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'activeScalars',
    'activeNormals',
    'activeTCoords',
    'activeVectors',
    'activeTensors',
    'activeGlobalIds',
    'activePedigreeIds',
  ]);

  if (!model.arrays) {
    model.arrays = {};
  }

  // Object specific methods
  vtkDataSetAttributes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataSetAttributes');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
