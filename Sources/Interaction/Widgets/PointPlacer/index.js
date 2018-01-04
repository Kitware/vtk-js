import macro from 'vtk.js/Sources/macro';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';

// ----------------------------------------------------------------------------
// vtkPointPlacer methods
// ----------------------------------------------------------------------------

function vtkPointPlacer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointPlacer');

  publicAPI.computeWorldPosition = (renderer, displayPos, worldPos) => {
    if (renderer) {
      const dPos = vtkCoordinate.newInstance();
      dPos.setCoordinateSystemToDisplay();
      dPos.setValue(displayPos[0], displayPos[1]);
      worldPos[0] = dPos.getComputedWorldValue(renderer)[0];
      worldPos[1] = dPos.getComputedWorldValue(renderer)[1];
      worldPos[2] = dPos.getComputedWorldValue(renderer)[2];
      return 1;
    }
    return 0;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pixelTolerance: 5,
  worldTolerance: 0.001,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['pixelTolerance', 'worldTolerance']);

  // Object methods
  vtkPointPlacer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointPlacer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
