import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLTextureUnitManager methods
// ----------------------------------------------------------------------------

function vtkOpenGLTextureUnitManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLTextureUnitManager');

  // ----------------------------------------------------------------------------
  // Description:
  // Delete the allocation table and check if it is not called before
  // all the texture units have been released.
  publicAPI.deleteTable = () => {
    for (let i = 0; i < model.numberOfTextureUnits; ++i) {
      if (model.textureUnits[i] === true) {
        vtkErrorMacro('some texture units  were not properly released');
      }
    }
    model.textureUnits = [];
    model.numberOfTextureUnits = 0;
  };

  // ----------------------------------------------------------------------------
  publicAPI.setContext = (ctx) => {
    if (model.context !== ctx) {
      if (model.context !== 0) {
        publicAPI.deleteTable();
      }
      model.context = ctx;
      if (model.context) {
        model.numberOfTextureUnits = ctx.getParameter(
          ctx.MAX_TEXTURE_IMAGE_UNITS
        );
        for (let i = 0; i < model.numberOfTextureUnits; ++i) {
          model.textureUnits[i] = false;
        }
      }
      publicAPI.modified();
    }
  };

  // ----------------------------------------------------------------------------
  // Description:
  // Reserve a texture unit. It returns its number.
  // It returns -1 if the allocation failed (because there are no more
  // texture units left).
  // \post valid_result: result==-1 || result>=0 && result<this->GetNumberOfTextureUnits())
  // \post allocated: result==-1 || this->IsAllocated(result)
  publicAPI.allocate = () => {
    for (let i = 0; i < model.numberOfTextureUnits; i++) {
      if (!publicAPI.isAllocated(i)) {
        model.textureUnits[i] = true;
        return i;
      }
    }
    return -1;
  };

  publicAPI.allocateUnit = (unit) => {
    if (publicAPI.isAllocated(unit)) {
      return -1;
    }

    model.textureUnits[unit] = true;
    return unit;
  };

  // ----------------------------------------------------------------------------
  // Description:
  // Tell if texture unit `textureUnitId' is already allocated.
  // \pre valid_id_range : textureUnitId>=0 && textureUnitId<this->GetNumberOfTextureUnits()
  publicAPI.isAllocated = (textureUnitId) => model.textureUnits[textureUnitId];

  // ----------------------------------------------------------------------------
  // Description:
  // Release a texture unit.
  // \pre valid_id: textureUnitId>=0 && textureUnitId<this->GetNumberOfTextureUnits()
  // \pre allocated_id: this->IsAllocated(textureUnitId)
  publicAPI.free = (val) => {
    model.textureUnits[val] = false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  numberOfTextureUnits: 0,
  textureUnits: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  model.textureUnits = [];

  // Build VTK API
  macro.get(publicAPI, model, ['numberOfTextureUnits']);

  macro.setGet(publicAPI, model, ['context']);

  // Object methods
  vtkOpenGLTextureUnitManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLTextureUnitManager'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
