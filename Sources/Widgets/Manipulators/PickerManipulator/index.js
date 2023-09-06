import macro from 'vtk.js/Sources/macros';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

// ----------------------------------------------------------------------------
// vtkPickerManipulator methods
// ----------------------------------------------------------------------------

function vtkPickerManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPickerManipulator');

  publicAPI.handleEvent = (callData) => {
    const { position, pokedRenderer } = callData;

    model.picker.pick([position.x, position.y, 0.0], pokedRenderer);
    if (model.picker.getActors().length > 0) {
      model.position = model.picker.getPickedPositions()[0];
    }
    return {
      worldCoords: model.position || null,
    };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  if (!initialValues.picker) {
    // Default picker
    const picker = vtkCellPicker.newInstance();
    picker.initializePickList();
    picker.setPickFromList(true);
    picker.setTolerance(0);

    initialValues.picker = picker;
  }
  return {
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractManipulator.extend(publicAPI, model, defaultValues(initialValues));

  macro.setGet(publicAPI, model, ['picker']);

  vtkPickerManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPickerManipulator');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
