import macro from 'vtk.js/Sources/macros';
import { distance2BetweenPoints } from 'vtk.js/Sources/Common/Core/Math';

import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkDistanceWidget(publicAPI, model) {
  model.classHierarchy.push('vtkDistanceWidget');

  // --- Public methods -------------------------------------------------------

  publicAPI.getDistance = () => {
    const handles = model.widgetState.getHandleList();
    if (handles.length !== 2) {
      return 0;
    }
    if (!handles[0].getOrigin() || !handles[1].getOrigin()) {
      return 0;
    }
    return Math.sqrt(
      distance2BetweenPoints(handles[0].getOrigin(), handles[1].getOrigin())
    );
  };
}

// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    maxPoints: 2,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkPolyLineWidget.extend(publicAPI, model, defaultValues(initialValues));

  vtkDistanceWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDistanceWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
