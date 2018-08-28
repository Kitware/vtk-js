import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Widgets/Core/AbstractWidget';

// ----------------------------------------------------------------------------

function vtkAbstractWidgetFactory(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidgetFactory');

  // DO NOT share on the model ------------------------------------------------
  const viewToWidget = {};
  // DO NOT share on the model ------------------------------------------------

  // Can be called with just ViewId after the widget has been registered
  publicAPI.getWidgetForView = ({
    viewId,
    openGLRenderWindow,
    renderer,
    viewType,
    initialValues,
  }) => {
    if (!viewToWidget[viewId]) {
      if (!openGLRenderWindow || !renderer) {
        return null;
      }
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

      // Custom delete to detatch from parent
      widgetPublicAPI.delete = macro.chain(() => {
        delete viewToWidget[viewId];
      }, widgetPublicAPI.delete);

      widgetPublicAPI.setInteractor(interactor);
      const viewWidget = Object.freeze(widgetPublicAPI);
      viewToWidget[viewId] = viewWidget;
      return viewWidget;
    }
    return viewToWidget[viewId];
  };

  // Call methods on all its view widgets
  publicAPI.setVisible = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setVisible(value);
    }
  };
  publicAPI.setActive = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setActive(value);
    }
  };
  publicAPI.setVisibleContext = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setVisibleContext(value);
    }
  };
  publicAPI.setVisibleHandle = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setVisibleHandle(value);
    }
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
