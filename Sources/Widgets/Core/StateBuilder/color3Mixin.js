import macro from 'vtk.js/Sources/macros';
/**
 * RGB Uint8 color mixin. Not to be used in conjunction with `color` mixin.
 * @see color
 */
const DEFAULT_VALUES = {
  color3: [255, 255, 255],
  opacity: 255,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['color3'], 3, 255);
  macro.setGet(publicAPI, model, ['opacity']);
}

// ----------------------------------------------------------------------------

export default { extend };
