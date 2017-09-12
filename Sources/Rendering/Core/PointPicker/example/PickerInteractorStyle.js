import macro                             from 'vtk.js/Sources/macro';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkSphereSource                   from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor                          from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                         from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// vtkInteractorStyleTrackballCamera2 methods
// ----------------------------------------------------------------------------
function vtkPickerInteractorStyle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPickerInteractorStyle');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.handleLeftButtonPress = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    const renderer = model.currentRenderer;
    const interactor = model.interactor;
    const point = [pos.x, pos.y, 0.0];
    interactor.getPicker().pick(point, renderer);

    // Display picked position
    const pickPosition = interactor.getPicker().getPickPosition();
    const sphere = vtkSphereSource.newInstance();
    sphere.setCenter(pickPosition);
    sphere.setRadius(0.01);
    const mapper = vtkMapper.newInstance();
    mapper.setInputData(sphere.getOutputData());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(1.0, 0.0, 0.0);
    model.currentRenderer.addActor(actor);

    // Display picked point from an actor
    const pickedPoint = interactor.getPicker().getPickedPositions();
    for (let i = 0; i < pickedPoint.length; i++) {
      const s = vtkSphereSource.newInstance();
      s.setCenter(pickedPoint[i]);
      s.setRadius(0.01);
      const m = vtkMapper.newInstance();
      m.setInputData(s.getOutputData());
      const a = vtkActor.newInstance();
      a.setMapper(m);
      a.getProperty().setColor(1.0, 1.0, 0.0);
      model.currentRenderer.addActor(a);
    }
    model.interactor.render();
    superClass.handleLeftButtonPress();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {

};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);


  // Object specific methods
  vtkPickerInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPickerInteractorStyle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
