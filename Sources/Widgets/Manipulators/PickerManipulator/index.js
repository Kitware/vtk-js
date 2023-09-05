import macro from 'vtk.js/Sources/macros';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

// ----------------------------------------------------------------------------
// vtkPickerManipulator methods
// ----------------------------------------------------------------------------

function vtkPickerManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPickerManipulator');

  // Default picker
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

  publicAPI.setPicker = (picker) => {
    model.picker = picker;
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

  vtkPickerManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPickerManipulator');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
