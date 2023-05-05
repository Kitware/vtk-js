import macro from 'vtk.js/Sources/macros';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';
import { mat3, mat4, vec3 } from 'gl-matrix';

export function intersectDisplayWithPlane(
  x,
  y,
  planeOrigin,
  planeNormal,
  renderer,
  glRenderWindow
) {
  const near = glRenderWindow.displayToWorld(x, y, 0, renderer);
  const far = glRenderWindow.displayToWorld(x, y, 1, renderer);

  return vtkPlane.intersectWithLine(near, far, planeOrigin, planeNormal).x;
}

// ----------------------------------------------------------------------------
// vtkCPRManipulator methods
// ----------------------------------------------------------------------------

function vtkCPRManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCPRManipulator');

  publicAPI.handleEvent = (callData, glRenderWindow) => {
    const mapper = model.cprActor?.getMapper();
    if (!mapper) {
      return { worldCoords: null };
    }

    // Get normal and origin of the picking plane from the actor matrix
    const cprActorMatrix = [];
    mat4.transpose(cprActorMatrix, model.cprActor.getMatrix());

    const worldPlaneNormal = cprActorMatrix.slice(8, 11); // 3rd column
    const worldPlaneOrigin = cprActorMatrix.slice(12, 15); // 4th column

    // Convert world plane position to 2D position in the plane
    const inversecprActorMatrix = [];
    mat4.invert(inversecprActorMatrix, cprActorMatrix);
    const worldPlanePicking = intersectDisplayWithPlane(
      callData.position.x,
      callData.position.y,
      worldPlaneOrigin,
      worldPlaneNormal,
      callData.pokedRenderer,
      glRenderWindow
    );
    const modelPlanePicking = []; // (x, height - distance, 0)
    vec3.transformMat4(
      modelPlanePicking,
      worldPlanePicking,
      inversecprActorMatrix
    );
    const height = mapper.getHeight();
    const distance = height - modelPlanePicking[1];

    return publicAPI.distanceEvent(distance);
  };

  publicAPI.distanceEvent = (distance) => {
    const mapper = model.cprActor?.getMapper();
    if (!mapper) {
      return { worldCoords: null };
    }
    const height = mapper.getHeight();
    const clampedDistance = Math.max(0, Math.min(height, distance));
    const { position, orientation } =
      mapper.getCenterlinePositionAndOrientation(clampedDistance);

    let worldDirection;
    if (orientation) {
      const modelDirections = mat3.fromQuat([], orientation);
      const baseDirections = mapper.getDirectionMatrix();
      worldDirection = mat3.mul([], modelDirections, baseDirections);
    }

    model.currentDistance = clampedDistance;
    return { worldCoords: position, worldDirection };
  };

  publicAPI.handleScroll = (nbSteps) => {
    const distance =
      model.currentDistance + publicAPI.getDistanceStep() * nbSteps;
    return publicAPI.distanceEvent(distance);
  };

  publicAPI.getDistanceStep = () => {
    // Find default distanceStep from image spacing
    // This only works if the mapper in the actor already has an ImageData
    if (!model.distanceStep) {
      const imageSpacing = model.cprActor
        ?.getMapper()
        ?.getInputData(0)
        ?.getSpacing?.();
      if (imageSpacing) {
        return Math.min(...imageSpacing);
      }
    }
    return model.distanceStep;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// currentDistance is the distance from the first point of the centerline
// cprActor.getMapper() should be a vtkImageCPRMapper
function defaultValues(initialValues) {
  return {
    distanceStep: 0,
    currentDistance: 0,
    cprActor: null,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractManipulator.extend(publicAPI, model, defaultValues(initialValues));

  macro.setGet(publicAPI, model, ['distance', 'currentDistance', 'cprActor']);
  macro.set(publicAPI, model, ['distanceStep']);

  vtkCPRManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCPRManipulator');

// ----------------------------------------------------------------------------

export default { intersectDisplayWithPlane, extend, newInstance };
