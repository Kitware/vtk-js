import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

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

  const numer = vtkMath.dot(
    [near[0] - lineOrigin[0], near[1] - lineOrigin[1], near[2] - lineOrigin[2]],
    normal
  );
  const denom = vtkMath.dot(normal, lineDirection);

  const result = lineDirection.slice();
  vtkMath.multiplyScalar(result, numer / denom);
  vtkMath.add(lineOrigin, result, result);

  return result;
}

// ----------------------------------------------------------------------------
// vtkLineManipulator methods
// ----------------------------------------------------------------------------

function vtkLineManipulator(publicAPI, model) {
  // Set our classNae
  model.classHierarchy.push('vtkLineManipulator');

  // --------------------------------------------------------------------------

  publicAPI.handleEvent = (callData, glRenderWindow) =>
    projectDisplayToLine(
      callData.position.x,
      callData.position.y,
      model.origin,
      model.normal,
      callData.pokedRenderer,
      glRenderWindow
    );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
  normal: [0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGetArray(publicAPI, model, ['origin', 'normal'], 3);

  vtkLineManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineManipulator');

// ----------------------------------------------------------------------------

export default { projectDisplayToLine, extend, newInstance };
