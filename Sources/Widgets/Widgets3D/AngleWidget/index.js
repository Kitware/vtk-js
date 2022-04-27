import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkAngleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAngleWidget');

  // --- Public methods -------------------------------------------------------

  // Returns angle in radians
  publicAPI.getAngle = () => {
    const handles = model.widgetState.getHandleList();
    if (handles.length !== 3) {
      return 0;
    }
    if (
      !handles[0].getOrigin() ||
      !handles[1].getOrigin() ||
      !handles[2].getOrigin()
    ) {
      return 0;
    }
    const vec1 = [0, 0, 0];
    const vec2 = [0, 0, 0];
    vtkMath.subtract(handles[0].getOrigin(), handles[1].getOrigin(), vec1);
    vtkMath.subtract(handles[2].getOrigin(), handles[1].getOrigin(), vec2);
    return vtkMath.angleBetweenVectors(vec1, vec2);
  };
}

// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    maxPoints: 3,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkPolyLineWidget.extend(publicAPI, model, defaultValues(initialValues));

  vtkAngleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAngleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
