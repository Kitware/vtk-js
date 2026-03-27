import macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

const SUPPORTED_IMPLICIT_FUNCTIONS = [
  'vtkPlane',
  'vtkSphere',
  'vtkBox',
  'vtkCylinder',
  'vtkCone',
];

// ----------------------------------------------------------------------------
// vtkCutterMapper methods
// ----------------------------------------------------------------------------

function vtkCutterMapper(publicAPI, model) {
  model.classHierarchy.push('vtkCutterMapper');

  const superClass = { ...publicAPI };

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();
    if (model.cutFunction) {
      mTime = Math.max(mTime, model.cutFunction.getMTime());
      const transform = model.cutFunction.getTransform?.();
      if (transform?.getMTime) {
        mTime = Math.max(mTime, transform.getMTime());
      }
    }
    return mTime;
  };

  publicAPI.getSupportedImplicitFunctionName = () => {
    const cutFunction = model.cutFunction;
    if (!cutFunction || !cutFunction.isA) {
      return null;
    }

    return (
      SUPPORTED_IMPLICIT_FUNCTIONS.find((className) =>
        cutFunction.isA(className)
      ) || null
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cutFunction: null,
  cutValue: 0.0,
  cutWidth: 1.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkMapper.extend(publicAPI, model, initialValues);

  // CutterMapper renders the cut surface geometry. Scalar visibility is enabled by default,
  // allowing the cut surface to be colored by data scalars from the underlying mesh.
  // To use a uniform color instead, call setScalarVisibility(false) and set the color
  // via the Actor's property (setColor).

  macro.setGet(publicAPI, model, ['cutFunction', 'cutValue', 'cutWidth']);

  vtkCutterMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCutterMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
