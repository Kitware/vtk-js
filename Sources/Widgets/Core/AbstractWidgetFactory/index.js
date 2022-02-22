import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidget from 'vtk.js/Sources/Widgets/Core/AbstractWidget';
import { extractRenderingComponents } from 'vtk.js/Sources/Widgets/Core/WidgetManager';

function NoOp() {}

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

      const { interactor, apiSpecificRenderWindow, camera } =
        extractRenderingComponents(renderer);
      const widgetModel = {};
      const widgetPublicAPI = {};

      macro.obj(widgetPublicAPI, widgetModel);
      Object.assign(widgetPublicAPI, {
        onWidgetChange: publicAPI.onWidgetChange,
      });
      Object.assign(widgetModel, {
        widgetState: model.widgetState,
        manipulator: model.manipulator,
        viewType,
        renderer,
        camera,
        apiSpecificRenderWindow,
        factory: publicAPI,
      });
      macro.moveToProtected(widgetPublicAPI, widgetModel, [
        'renderer',
        'camera',
        'apiSpecificRenderWindow',
        'factory',
      ]);
      macro.safeArrays(widgetModel);
      vtkAbstractWidget.extend(widgetPublicAPI, widgetModel, initialValues);

      // Create representations for that view
      /* eslint-disable no-shadow */
      const widgetInitialValues = initialValues; // Avoid shadowing
      widgetModel.representations = publicAPI
        .getRepresentationsForViewType(viewType)
        .map(({ builder, labels, initialValues }) =>
          builder.newInstance({
            _parentProp: widgetPublicAPI,
            labels,
            ...initialValues,
            ...widgetInitialValues,
          })
        );
      /* eslint-enable no-shadow */

      widgetModel.representations.forEach((r) => {
        r.setInputData(widgetModel.widgetState);
        r.getActors().forEach((actor) => {
          widgetModel.actorToRepresentationMap.set(actor, r);
        });
      });

      model.behavior(widgetPublicAPI, widgetModel);
      // Forward representation methods
      ['coincidentTopologyParameters', ...(model.methodsToLink || [])].forEach(
        (methodName) => {
          const set = `set${macro.capitalize(methodName)}`;
          const get = `get${macro.capitalize(methodName)}`;
          const methods = {
            [methodName]: [],
            [set]: [],
            [get]: [],
          };
          widgetModel.representations.forEach((representation) => {
            if (representation[methodName]) {
              methods[methodName].push(representation[methodName]);
            }
            if (representation[set]) {
              methods[set].push(representation[set]);
            }
            if (representation[get]) {
              methods[get].push(representation[get]);
            }
          });

          Object.keys(methods).forEach((name) => {
            const calls = methods[name];
            if (calls.length === 1) {
              widgetPublicAPI[name] = calls[0];
            } else if (calls.length > 1) {
              widgetPublicAPI[name] = macro.chain(...calls);
            }
          });
        }
      );

      // Custom delete to detach from parent
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

  // List of all the views the widget has been registered to.
  publicAPI.getViewIds = () => Object.keys(viewToWidget);

  // --------------------------------------------------------------------------
  // Widget visibility / enable
  // --------------------------------------------------------------------------
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

  publicAPI.setDragable = (value) => {
    const viewIds = Object.keys(viewToWidget);
    for (let i = 0; i < viewIds.length; i++) {
      viewToWidget[viewIds[i]].setDragable(value);
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

  // --------------------------------------------------------------------------
  // Place Widget API
  // --------------------------------------------------------------------------

  publicAPI.placeWidget = (bounds) => model.widgetState.placeWidget(bounds);
  publicAPI.getPlaceFactor = () => model.widgetState.getPlaceFactor();
  publicAPI.setPlaceFactor = (factor) =>
    model.widgetState.setPlaceFactor(factor);

  // --------------------------------------------------------------------------
  // Event Widget API
  // --------------------------------------------------------------------------
  let unsubscribe = NoOp;
  publicAPI.delete = macro.chain(publicAPI.delete, () => unsubscribe());

  // Defer after object instantiation so model.widgetState actually exist
  setTimeout(() => {
    if (model.widgetState) {
      unsubscribe = model.widgetState.onModified(() =>
        publicAPI.invokeWidgetChange(model.widgetState)
      ).unsubscribe;
    }
  }, 0);
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['widgetState']);
  macro.event(publicAPI, model, 'WidgetChange');
  vtkAbstractWidgetFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
