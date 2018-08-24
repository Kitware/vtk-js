import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';

// ----------------------------------------------------------------------------

function vtkAbstractWidgetFactory(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidgetFactory');

  // DO NOT share on the model ------------------------------------------------
  const viewToWidget = {};
  // DO NOT share on the model ------------------------------------------------

  publicAPI.getWidgetForView = ({
    viewId,
    openGLRenderWindow,
    renderer,
    viewType,
    initialValues,
  }) => {
    if (!viewToWidget[viewId]) {
      const widgetModel = {};
      const widgetPublicAPI = {};
      const interactor = renderer.getRenderWindow().getInteractor();
      Object.assign(widgetModel, model, {
        interactor,
        renderer,
        openGLRenderWindow,
        viewType,
      });
      macro.safeArrays(widgetModel);
      vtkAbstractWidget.extend(widgetPublicAPI, widgetModel, initialValues);

      // Create representations for that view
      widgetModel.representations = publicAPI
        .getRepresentationsForViewType(viewType)
        .map(({ builder, labels }) => builder.newInstance({ labels }));

      widgetModel.representations.forEach((r) => {
        r.setInputData(widgetModel.widgetState);
        r.getActors().forEach((actor) => {
          widgetModel.actorToRepresentationMap.set(actor, r);
        });
      });

      model.behavior(widgetPublicAPI, widgetModel);

      widgetPublicAPI.setInteractor(interactor);
      return Object.freeze(widgetPublicAPI);
    }
    return viewToWidget[viewId];
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['widgetState']);
  vtkAbstractWidgetFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
