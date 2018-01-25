import macro from 'vtk.js/Sources/macro';

import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy';

// ----------------------------------------------------------------------------
// vtkView2DProxy methods
// ----------------------------------------------------------------------------

function vtkView2DProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkView2DProxy');

  const superUpdateOrientation = publicAPI.updateOrientation;
  publicAPI.updateOrientation = (axisIndex, orientation, viewUp) => {
    superUpdateOrientation(axisIndex, orientation, viewUp);

    let count = model.representations.length;
    while (count--) {
      const rep = model.representations[count];
      const slicingMode = 'XYZ'[axisIndex];
      if (rep.setSlicingMode) {
        rep.setSlicingMode(slicingMode);
      }
    }

    publicAPI.updateCornerAnnotation({ axis: 'XYZ'[axisIndex] });
  };

  // Setup default corner annotation
  /* eslint-disable no-template-curly-in-string */
  publicAPI.setCornerAnnotation(
    'nw',
    'Orientation ${axis}<br>Slice ${sliceIndex}'
  );
  publicAPI.setCornerAnnotation('se', 'CW ${colorWindow}<br>CL ${colorLevel}');
  /* eslint-enable no-template-curly-in-string */

  const superAddRepresentation = publicAPI.addRepresentation;
  publicAPI.addRepresentation = (rep) => {
    superAddRepresentation(rep);
    if (rep.setSlicingMode) {
      rep.setSlicingMode('XYZ'[model.axis]);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  axis: 2,
  orientation: -1,
  viewUp: [0, 1, 0],
  useParallelRendering: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkViewProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['axis']);

  // Object specific methods
  vtkView2DProxy(publicAPI, model);
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkView2DProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
