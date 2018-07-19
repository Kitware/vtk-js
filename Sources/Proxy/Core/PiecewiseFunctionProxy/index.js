import macro from 'vtk.js/Sources/macro';

import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

import Constants from './Constants';

const { Mode, Defaults } = Constants;

// ----------------------------------------------------------------------------

function applyPointsToPiecewiseFunction(points, range, pwf) {
  const width = range[1] - range[0];
  const rescaled = points.map(([x, y]) => [x * width + range[0], y]);

  pwf.removeAllPoints();
  rescaled.forEach(([x, y]) => pwf.addPoint(x, y));
}

// ----------------------------------------------------------------------------

function applyNodesToPiecewiseFunction(nodes, range, pwf) {
  const width = range[1] - range[0];
  const rescaled = nodes.map((n) =>
    Object.assign({}, n, { x: n.x * width + range[0] })
  );

  pwf.setNodes(rescaled);
}

// ----------------------------------------------------------------------------
// vtkPiecewiseFunctionProxy methods
// ----------------------------------------------------------------------------

function vtkPiecewiseFunctionProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPiecewiseFunctionProxy');

  model.piecewiseFunction =
    model.piecewiseFunction || vtkPiecewiseFunction.newInstance();

  // Takes an array of gaussians
  publicAPI.setGaussians = (gaussians) => {
    model.gaussians = (gaussians || []).slice();
    if (model.gaussians.length === 0) {
      model.gaussians = Defaults.Gaussians.slice();
    }
    publicAPI.applyMode();
  };

  // Takes an array of points [x, y]
  publicAPI.setPoints = (points) => {
    model.points = (points || []).slice();
    if (model.points.length === 0) {
      model.points = Defaults.Points.slice();
    }
    publicAPI.applyMode();
  };

  // Takes an array of PiecewiseFunction nodes
  publicAPI.setNodes = (nodes) => {
    model.nodes = (nodes || []).slice();
    if (model.nodes.length === 0) {
      model.nodes = Defaults.Nodes.slice();
    }
    publicAPI.applyMode();
  };

  publicAPI.setMode = (mode) => {
    if (model.mode === mode) {
      return;
    }
    model.mode = mode;
    publicAPI.applyMode();
  };

  publicAPI.applyMode = () => {
    switch (model.mode) {
      case Mode.Gaussians:
        vtkPiecewiseGaussianWidget.applyGaussianToPiecewiseFunction(
          model.gaussians,
          255,
          model.dataRange,
          model.piecewiseFunction
        );

        publicAPI.modified();
        break;

      case Mode.Points:
        applyPointsToPiecewiseFunction(
          model.points,
          model.dataRange,
          model.piecewiseFunction
        );

        publicAPI.modified();
        break;

      case Mode.Nodes:
        applyNodesToPiecewiseFunction(
          model.nodes,
          model.dataRange,
          model.piecewiseFunction
        );

        publicAPI.modified();
        break;

      default:
      // noop
    }
  };

  publicAPI.getLookupTableProxy = () =>
    model.proxyManager.getLookupTable(model.arrayName);

  publicAPI.setDataRange = (min, max) => {
    if (model.dataRange[0] !== min || model.dataRange[1] !== max) {
      model.dataRange[0] = min;
      model.dataRange[1] = max;
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
  mode: Mode.Gaussians,
  gaussians: Defaults.Gaussians,
  points: Defaults.Points,
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
    'piecewiseFunction',
    'gaussians',
    'nodes',
    'points',
    'mode',
    'dataRange',
  ]);

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

export default { newInstance, extend, Mode, Defaults };
