import macro from 'vtk.js/Sources/macro';

import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import Constants from './Constants';

const { Mode, Defaults } = Constants;

// ----------------------------------------------------------------------------
// vtkLookupTableProxy methods
// ----------------------------------------------------------------------------

function vtkLookupTableProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLookupTableProxy');

  model.lookupTable =
    model.lookupTable || vtkColorTransferFunction.newInstance();

  // Initialize lookup table
  model.lookupTable.setVectorModeToMagnitude();

  // Takes a preset colormap name
  publicAPI.setPresetName = (presetName) => {
    if (model.presetName !== presetName) {
      model.presetName = presetName;
      model.mode = Mode.Preset;
      publicAPI.applyMode();
    }
  };

  // Takes an array of points [x, r, g, b]
  publicAPI.setRGBPoints = (rgbPoints) => {
    if (model.rgbPoints !== rgbPoints) {
      model.rgbPoints = (rgbPoints || Defaults.RGBPoints).slice();
      publicAPI.applyMode();
    }
  };

  // Takes an array of points [x, h, s, v]
  publicAPI.setHSVPoints = (hsvPoints) => {
    if (model.hsvPoints !== hsvPoints) {
      model.hsvPoints = (hsvPoints || Defaults.HSVPoints).slice();
      publicAPI.applyMode();
    }
  };

  // Takes an array of ColorTransferFunction nodes
  publicAPI.setNodes = (nodes) => {
    if (model.nodes !== nodes) {
      model.nodes = (nodes || Defaults.Nodes).slice();
      publicAPI.applyMode();
    }
  };

  publicAPI.setMode = (mode) => {
    if (model.mode !== mode) {
      model.mode = mode;
      publicAPI.applyMode();
    }
  };

  publicAPI.applyMode = () => {
    switch (model.mode) {
      case Mode.Preset:
        model.lookupTable.applyColorMap(
          vtkColorMaps.getPresetByName(model.presetName)
        );
        break;

      case Mode.RGBPoints:
        model.lookupTable.removeAllPoints();
        model.rgbPoints.forEach((point) =>
          model.lookupTable.addRGBPoint(...point)
        );
        break;

      case Mode.HSVPoints:
        model.lookupTable.removeAllPoints();
        model.hsvPoints.forEach((point) =>
          model.lookupTable.addHSVPoint(...point)
        );
        break;

      case Mode.Nodes:
        model.lookupTable.setNodes(model.nodes);
        break;

      default:
      // noop
    }

    model.lookupTable.setMappingRange(model.dataRange[0], model.dataRange[1]);
    model.lookupTable.updateRange();
    publicAPI.modified();
  };

  publicAPI.setDataRange = (min, max) => {
    if (model.dataRange[0] !== min || model.dataRange[1] !== max) {
      model.dataRange[0] = min;
      model.dataRange[1] = max;

      model.lookupTable.setMappingRange(model.dataRange[0], model.dataRange[1]);
      model.lookupTable.updateRange();

      publicAPI.applyMode();
    }
  };

  // Initialization ------------------------------------------------------------

  publicAPI.applyMode();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mode: Mode.Preset,
  presetName: Defaults.Preset,
  rgbPoints: Defaults.RGBPoints,
  hsvPoints: Defaults.HSVPoints,
  nodes: Defaults.Nodes,
  arrayName: 'No array associated',
  arrayLocation: 'pointData',
  dataRange: [0, 1],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['arrayName']);
  macro.get(publicAPI, model, [
    'mode',
    'lookupTable',
    'presetName',
    'rgbPoints',
    'hsvPoints',
    'nodes',
    'dataRange',
  ]);

  // Object specific methods
  vtkLookupTableProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLookupTableProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend, Mode, Defaults };
