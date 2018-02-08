import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkInteractorStyleTrackballCamera2 methods
// ----------------------------------------------------------------------------
function vtkPickerInteractorStyle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPickerInteractorStyle');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.handleLeftButtonPress = (callData) => {
    const pos = callData.position;

    if (callData.shiftKey) {
      const renderer = callData.pokedRenderer;
      const interactor = model.interactor;
      interactor.getPicker().pick([pos.x, pos.y, 0], renderer);

      const pickedPoints = interactor.getPicker().getPickedPositions();
      const pickedCellId = interactor.getPicker().getCellId();
      console.log('cell id : ', pickedCellId);

      const cameraCenter = callData.pokedRenderer
        .getActiveCamera()
        .getPosition();
      let minDistance = Number.MAX_VALUE;
      for (let i = 0; i < pickedPoints.length; i++) {
        const dist = Math.sqrt(
          vtkMath.distance2BetweenPoints(cameraCenter, pickedPoints[i])
        );
        if (dist < minDistance) {
          minDistance = dist;
        }
        const sphere = vtkSphereSource.newInstance();
        sphere.setCenter(pickedPoints[i]);
        sphere.setRadius(0.01);
        const mapper = vtkMapper.newInstance();
        mapper.setInputData(sphere.getOutputData());
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        actor.getProperty().setColor(1.0, 0.0, 0.0);
        callData.pokedRenderer.addActor(actor);
      }
      model.interactor.render();
    }
    superClass.handleLeftButtonPress(callData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  container: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['container']);

  // Object specific methods
  vtkPickerInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPickerInteractorStyle'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
