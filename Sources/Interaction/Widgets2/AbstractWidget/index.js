import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');

  if (!model.representations) {
    model.representations = {};
  }

  // Expect sub-class to fill mapping
  // model.representationBuilder = {
  //    DEFAULT: [{ builder: vtkSphereHandleRepresentation, labels: []}],
  //    SLICE: [{ builder: vtkSphereHandleRepresentation, labels: []}],
  // }
  // model.viewTypeAlias = [DEFAULT, DEFAULT, SLICE, DEFAULT];

  publicAPI.getRepresentationsForViewType = (viewType) => {
    const key = model.viewTypeAlias[viewType];
    if (!model.representations[key]) {
      model.representations[key] = model.representationBuilder.map(({ builder, labels}) => builder.newInstance({ labels }));
    }
    return model.representations[key];
  };
  publicAPI.hasActor = () => {};
  publicAPI.getRepresentationFromActor = () => {};
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetState: null,
  openGLRenderWindow: null,
  renderer: null,
  representations: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'widgetState',
    'openGLRenderWindow',
    'renderer',
  ]);

  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
