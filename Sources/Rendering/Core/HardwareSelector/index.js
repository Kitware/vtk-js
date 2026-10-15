import macro from 'vtk.js/Sources/macros';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { FieldAssociations } = vtkDataSet;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkHardwareSelector(publicAPI, model) {
  model.classHierarchy.push('vtkHardwareSelector');

  // get the source data that is used for generating a selection. This
  // must be called at least once before calling generateSelection. In
  // raster based backends this method will capture the buffers. You can
  // call this once and then make multiple calls to generateSelection.
  publicAPI.getSourceDataAsync = async (renderer, fx1, fy1, fx2, fy2) => {};

  // The backends call this before they render the selection. It checks
  // that the view and the renderer are set, then gets the scene ready as
  // vtkRenderWindow.render() does (each renderer gets a camera).
  publicAPI.prepareCapture = (view, renderer) => {
    if (!view || !renderer) {
      vtkErrorMacro('Renderer and view must be set before calling Select.');
      return false;
    }
    view.getRenderable().preRender();
    return true;
  };

  publicAPI.selectAsync = async (renderer, fx1, fy1, fx2, fy2) => {
    const srcData = await publicAPI.getSourceDataAsync(
      renderer,
      fx1,
      fy1,
      fx2,
      fy2
    );
    if (srcData) {
      return srcData.generateSelection(fx1, fy1, fx2, fy2);
    }
    return [];
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fieldAssociation: FieldAssociations.FIELD_ASSOCIATION_CELLS,
  captureZValues: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['fieldAssociation', 'captureZValues']);

  // Object methods
  vtkHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHardwareSelector');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
