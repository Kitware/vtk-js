import macro from 'vtk.js/Sources/macro';

import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

const DEFAULT_PRESET_NAME = 'Cool to Warm';

// ----------------------------------------------------------------------------
// vtkLookupTableProxy methods
// ----------------------------------------------------------------------------

function vtkLookupTableProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLookupTableProxy');

  model.lookupTable =
    model.lookupTable || vtkColorTransferFunction.newInstance();

  // Initialize lookup table
  model.presetName = model.presetName || DEFAULT_PRESET_NAME;
  model.lookupTable.setVectorModeToMagnitude();
  model.lookupTable.applyColorMap(
    vtkColorMaps.getPresetByName(model.presetName)
  );
  model.lookupTable.setMappingRange(model.dataRange[0], model.dataRange[1]);
  model.lookupTable.updateRange();

  publicAPI.setPresetName = (presetName) => {
    if (model.presetName !== presetName) {
      model.presetName = presetName;
      model.lookupTable.applyColorMap(vtkColorMaps.getPresetByName(presetName));
      model.lookupTable.setMappingRange(model.dataRange[0], model.dataRange[1]);
      model.lookupTable.updateRange();
      publicAPI.modified();
    }
  };

  publicAPI.setDataRange = (min, max) => {
    if (model.dataRange[0] !== min || model.dataRange[1] !== max) {
      model.dataRange[0] = min;
      model.dataRange[1] = max;

      model.lookupTable.setMappingRange(model.dataRange[0], model.dataRange[1]);
      model.lookupTable.updateRange();

      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  arrayName: 'No array associated',
  arrayLocation: 'pointData',
  dataRange: [0, 1],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['arrayName']);
  macro.get(publicAPI, model, ['lookupTable', 'presetName', 'dataRange']);

  // Object specific methods
  vtkLookupTableProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLookupTableProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
