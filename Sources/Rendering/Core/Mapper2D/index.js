import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import ScalarColoringHelper from 'vtk.js/Sources/Rendering/Core/Mapper/ScalarColoringHelper';

// ---------------------------------------------------------------------------
// vtkMapper2D methods
// ---------------------------------------------------------------------------

function vtkMapper2D(publicAPI, model) {
  // Set out className
  model.classHierarchy.push('vtkMapper2D');

  publicAPI.getPrimitiveCount = () => {
    const input = publicAPI.getInputData();
    const pcount = {
      points: input.getPoints().getNumberOfValues() / 3,
      verts:
        input.getVerts().getNumberOfValues() -
        input.getVerts().getNumberOfCells(),
      lines:
        input.getLines().getNumberOfValues() -
        2 * input.getLines().getNumberOfCells(),
      triangles:
        input.getPolys().getNumberOfValues() -
        3 * input.getPolys().getNumberOfCells(),
    };
    return pcount;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  static: false,

  renderTime: 0,

  // vtkMapper2D disables scalar coloring by default (overrides the
  // ScalarColoringHelper default of true).
  scalarVisibility: false,

  // vtkMapper2D historically always used the texture path for point data, i.e.
  // it never consulted interpolateScalarsBeforeMapping. Default it to true so
  // the shared ScalarColoringHelper.canUseTextureMapForColoring keeps that
  // behavior.
  interpolateScalarsBeforeMapping: true,

  transformCoordinate: null,

  viewSpecificProperties: null,
  customShaderAttributes: [],
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  // Scalar coloring pipeline (shared helper)
  ScalarColoringHelper.implementScalarColoringMethods(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'renderTime',
    'static',
    'transformCoordinate',
    'viewSpecificProperties',
    'customShaderAttributes', // point data array names that will be transferred to the VBO
  ]);

  if (!model.viewSpecificProperties) {
    model.viewSpecificProperties = {};
  }

  // Object methods
  vtkMapper2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMapper2D');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
