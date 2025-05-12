import macro from 'vtk.js/Sources/macros';
import vtkProperty2D from 'vtk.js/Sources/Rendering/Core/Property2D';

// ----------------------------------------------------------------------------
// vtkTextProperty methods
// ----------------------------------------------------------------------------

function vtkTextProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTextProperty');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fontFamily: 'Arial',
  fontColor: [0, 0, 0],
  fontStyle: 'normal',
  // backgroundColor: [1, 1, 1],
  // Scales the font size based on the given resolution.
  // Dividing by 1.8 ensures the font size is proportionate and not too large.
  // The value 1.8 is a chosen scaling factor for visual balance.
  fontSizeScale: (resolution) => resolution / 1.8,
  resolution: 200,
  // shadowColor: [1, 1, 0],
  // shadowOffset: [1, -1],
  // shadowBlur: 0,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProperty2D.extend(publicAPI, model, initialValues);

  // Build VTK API

  macro.setGet(publicAPI, model, [
    'fontFamily',
    'fontStyle',
    'fillStyle',
    'fontSizeScale',
    'resolution',
    'shadowBlur',
  ]);
  macro.setGetArray(publicAPI, model, ['shadowOffset'], 2);
  macro.setGetArray(
    publicAPI,
    model,
    ['backgroundColor', 'fontColor', 'shadowColor'],
    3
  );

  // Object methods
  vtkTextProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTextProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
