import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

export function projectDisplayToLine(
  x,
  y,
  lineOrigin,
  lineDirection,
  renderer,
  glRenderWindow
) {
  const near = glRenderWindow.displayToWorld(x, y, 0, renderer);
  const far = glRenderWindow.displayToWorld(x, y, 1, renderer);
  const viewDir = [0, 0, 0];
  vtkMath.subtract(far, near, viewDir);

  const normal = [0, 0, 0];
  vtkMath.cross(lineDirection, viewDir, normal);
  vtkMath.cross(normal, viewDir, normal);

  const numerator = vtkMath.dot(
    [near[0] - lineOrigin[0], near[1] - lineOrigin[1], near[2] - lineOrigin[2]],
    normal
  );
  const denominator = vtkMath.dot(normal, lineDirection);

  const result = lineDirection.slice();
  vtkMath.multiplyScalar(result, numerator / denominator);
  vtkMath.add(lineOrigin, result, result);

  return result;
}

// ----------------------------------------------------------------------------
// vtkLineManipulator methods
// ----------------------------------------------------------------------------

function vtkLineManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineManipulator');

  publicAPI.handleEvent = (callData, glRenderWindow) =>
    projectDisplayToLine(
      callData.position.x,
      callData.position.y,
      publicAPI.getOrigin(callData),
      publicAPI.getNormal(callData),
      callData.pokedRenderer,
      glRenderWindow
    );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractManipulator.extend(publicAPI, model, defaultValues(initialValues));

  vtkLineManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineManipulator');

// ----------------------------------------------------------------------------

export default { projectDisplayToLine, extend, newInstance };
