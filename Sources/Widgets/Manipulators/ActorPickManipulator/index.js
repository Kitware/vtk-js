import macro from 'vtk.js/Sources/macros';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

// ----------------------------------------------------------------------------
// vtkActorPickManipulator methods
// ----------------------------------------------------------------------------

function vtkActorPickManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkActorPickManipulator');
  model.picker = vtkCellPicker.newInstance();
  model.picker.initializePickList();
  model.picker.setPickFromList(true);
  model.picker.setTolerance(0);

  publicAPI.handleEvent = (callData) => {
    const { position, pokedRenderer } = callData;

    model.picker.pick([position.x, position.y, 0.0], pokedRenderer);
    if (model.picker.getActors().length > 0) {
      model.position = model.picker.getPickedPositions()[0];
    }
    return {
      worldCoords: model.position || [0, 0, 0],
    };
  };

  publicAPI.addActor = (actor) => {
    model.picker.addPickList(actor);
  };

  publicAPI.setTolerance = (tolerance) => {
    model.picker.setTolerance(tolerance);
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

  vtkActorPickManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkActorPickManipulator');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
