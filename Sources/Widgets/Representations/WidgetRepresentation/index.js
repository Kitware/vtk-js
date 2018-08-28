import macro from 'vtk.js/Sources/macro';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');
  // Internal cache
  const cache = { mtimes: {}, states: [] };

  // --------------------------------------------------------------------------
  publicAPI.getActors = () => model.actors;
  publicAPI.getNestedProps = publicAPI.getActors;
  // --------------------------------------------------------------------------

  publicAPI.setLabels = (...labels) => {
    if (labels.length === 1) {
      model.labels = [].concat(labels[0]);
    } else {
      model.labels = labels;
    }
    publicAPI.modified();
  };

  publicAPI.getRepresentationStates = (input = model.inputData[0]) => {
    if (
      cache.mtimes.representation === publicAPI.getMTime() &&
      cache.mtimes.input === input.getMTime()
    ) {
      return cache.states;
    }

    // Reinitialize cache
    cache.mtimes.representation = publicAPI.getMTime();
    cache.mtimes.input = input.getMTime();
    cache.states = [];

    // Fill states that are going to be used in the representation
    model.labels.forEach((name) => {
      cache.states = cache.states.concat(input.getStatesWithLabel(name) || []);
    });

    return cache.states;
  };

  publicAPI.getSelectedState = (prop, compositeID) => {
    const representationStates = publicAPI.getRepresentationStates();
    if (compositeID < representationStates.length) {
      return representationStates[compositeID];
    }
    vtkErrorMacro(
      `Representation ${publicAPI.getClassName()} should implement getSelectedState(prop, compositeID) method.`
    );
    return null;
  };

  publicAPI.updateActorVisibility = (
    renderingType = RenderingTypes.FRONT_BUFFER,
    widgetVisible = true,
    ctxVisible = true,
    handleVisible = true
  ) => {
    let otherFlag = true;
    switch (model.behavior) {
      case Behavior.HANDLE:
        otherFlag =
          renderingType === RenderingTypes.PICKING_BUFFER || handleVisible;
        break;
      case Behavior.CONTEXT:
        otherFlag = renderingType === RenderingTypes.FRONT_BUFFER && ctxVisible;
        break;
      default:
        otherFlag = true;
        break;
    }
    const visibilityFlag = widgetVisible && otherFlag;
    for (let i = 0; i < model.actors.length; i++) {
      if (model.visibilityFlagArray) {
        model.actors[i].setVisibility(
          visibilityFlag && model.visibilityFlagArray[i]
        );
      } else {
        model.actors[i].setVisibility(visibilityFlag);
      }
    }
    if (model.alwaysVisibleActors) {
      for (let i = 0; i < model.alwaysVisibleActors.length; i++) {
        model.alwaysVisibleActors[i].setVisibility(true);
      }
    }
  };

  // Make sure setting the labels at build time works with string/array...
  publicAPI.setLabels(model.labels);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  labels: [],
  behavior: Behavior.CONTEXT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkProp.extend(publicAPI, model, initialValues);
  macro.algo(publicAPI, model, 1, 1);
  macro.get(publicAPI, model, ['labels']);

  // Object specific methods
  vtkWidgetRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
