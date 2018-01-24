import macro from 'vtk.js/Sources/macro';

import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

// ----------------------------------------------------------------------------
// vtkPiecewiseFunctionProxy methods
// ----------------------------------------------------------------------------

function vtkPiecewiseFunctionProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPiecewiseFunctionProxy');

  model.piecewiseFunction =
    model.piecewiseFunction || vtkPiecewiseFunction.newInstance();

  publicAPI.setGaussians = (gaussians) => {
    model.gaussians = gaussians.slice(0);
    vtkPiecewiseGaussianWidget.applyGaussianToPiecewiseFunction(
      gaussians,
      255,
      model.dataRange,
      model.piecewiseFunction
    );
  };

  publicAPI.getLookupTableProxy = () =>
    model.proxyManager.getLookupTable(model.arrayName);

  publicAPI.setDataRange = (min, max) => {
    if (model.dataRange[0] !== min || model.dataRange[1] !== max) {
      model.dataRange[0] = min;
      model.dataRange[1] = max;
      publicAPI.setGaussians(model.gaussians);
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  gaussians: [],
  arrayName: 'No array associated',
  arrayLocation: 'pointData',
  dataRange: [0, 1],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['arrayName']);
  macro.get(publicAPI, model, ['piecewiseFunction', 'gaussians', 'dataRange']);

  // Object specific methods
  vtkPiecewiseFunctionProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPiecewiseFunctionProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
