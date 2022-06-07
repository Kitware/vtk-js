import { mat4, vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

export function trackballRotate(
  prevX,
  prevY,
  curX,
  curY,
  origin,
  direction,
  renderer,
  glRenderWindow
) {
  const dx = curX - prevX;
  const dy = curY - prevY;

  const camera = renderer.getActiveCamera();
  const viewUp = camera.getViewUp();
  const dop = camera.getDirectionOfProjection();

  const size = renderer
    .getRenderWindow()
    .getInteractor()
    .getView()
    .getViewportSize(renderer);
  const xdeg = (360.0 * dx) / size[0];
  const ydeg = (360.0 * dy) / size[1];

  const newDirection = new Float64Array([
    direction[0],
    direction[1],
    direction[2],
  ]);

  const xDisplayAxis = viewUp;
  const yDisplayAxis = [0, 0, 0];
  vtkMath.cross(dop, viewUp, yDisplayAxis);

  const rot = mat4.identity(new Float64Array(16));
  mat4.rotate(rot, rot, vtkMath.radiansFromDegrees(xdeg), xDisplayAxis);
  mat4.rotate(rot, rot, vtkMath.radiansFromDegrees(-ydeg), yDisplayAxis);

  vec3.transformMat4(newDirection, newDirection, rot);
  return newDirection;
}

// ----------------------------------------------------------------------------
// vtkTrackballManipulator methods
// ----------------------------------------------------------------------------

function vtkTrackballManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballManipulator');

  let prevX = 0;
  let prevY = 0;

  publicAPI.handleEvent = (callData, glRenderWindow) => {
    const newDirection = trackballRotate(
      prevX,
      prevY,
      callData.position.x,
      callData.position.y,
      publicAPI.getOrigin(callData),
      publicAPI.getNormal(callData),
      callData.pokedRenderer,
      glRenderWindow
    );
    prevX = callData.position.x;
    prevY = callData.position.y;
    return newDirection;
  };

  publicAPI.reset = (callData) => {
    prevX = callData.position.x;
    prevY = callData.position.y;
  };
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

  vtkTrackballManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballManipulator');

// ----------------------------------------------------------------------------

export default { trackballRotate, extend, newInstance };
