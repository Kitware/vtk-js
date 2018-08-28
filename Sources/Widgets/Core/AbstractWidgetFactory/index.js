import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Widgets/Core/AbstractWidget';
import { extractRenderingComponents } from 'vtk.js/Sources/Widgets/Core/WidgetManager';

// ----------------------------------------------------------------------------

function vtkAbstractWidgetFactory(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidgetFactory');

  // DO NOT share on the model ------------------------------------------------
  const viewToWidget = {};
  // DO NOT share on the model ------------------------------------------------

  // Can be called with just ViewId after the widget has been registered
  publicAPI.getWidgetForView = ({
    viewId,
    renderer,
    viewType,
    initialValues,
  }) => {
    if (!viewToWidget[viewId]) {
      if (!renderer) {
        return null;
      }

      const {
        interactor,
        openGLRenderWindow,
        camera,
      } = extractRenderingComponents(renderer);
      const widgetModel = {};
      const widgetPublicAPI = {};
      Object.assign(widgetModel, model, {
        viewType,
        renderer,
        camera,
        openGLRenderWindow,
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
  publicAPI.setVisibility = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setVisibility(value);
    }
  };
  publicAPI.setPickable = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setPickable(value);
    }
  };
  publicAPI.setContextVisibility = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setContextVisibility(value);
    }
  };
  publicAPI.setHandleVisibility = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setHandleVisibility(value);
    }
  };

  publicAPI.placeWidget = (bounds) => model.widgetState.placeWidget(bounds);
  publicAPI.getPlaceFactor = () => model.widgetState.getPlaceFactor();
  publicAPI.setPlaceFactor = (factor) =>
    model.widgetState.setPlaceFactor(factor);
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
