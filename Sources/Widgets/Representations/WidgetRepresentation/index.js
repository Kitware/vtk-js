import macro from 'vtk.js/Sources/macros';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import { CATEGORIES } from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import { POLYDATA_FIELDS } from 'vtk.js/Sources/Common/DataModel/PolyData/Constants';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
const STYLE_CATEGORIES = ['active', 'inactive', 'static'];

function applyCoincidentTopologyParametersToMapper(mapper, parameters) {
  if (mapper && mapper.setResolveCoincidentTopologyToPolygonOffset) {
    mapper.setResolveCoincidentTopologyToPolygonOffset();
    CATEGORIES.forEach((category) => {
      if (parameters[category]) {
        const methodName = `setRelativeCoincidentTopology${category}OffsetParameters`;
        if (mapper[methodName]) {
          const { factor, offset } = parameters[category];
          mapper[methodName](factor, offset);
        }
      }
    });
  }
}

export function mergeStyles(elementNames, ...stylesToMerge) {
  const newStyleObject = { active: {}, inactive: {}, static: {} };
  STYLE_CATEGORIES.forEach((category) => {
    const cat = newStyleObject[category];
    elementNames.forEach((name) => {
      if (!cat[name]) {
        cat[name] = {};
      }
      stylesToMerge
        .filter((s) => s && s[category] && s[category][name])
        .forEach((s) => Object.assign(cat[name], s[category][name]));
    });
  });

  return newStyleObject;
}

// ----------------------------------------------------------------------------

export function applyStyles(pipelines, styles, activeActor) {
  if (!activeActor) {
    // static
    Object.keys(styles.static).forEach((name) => {
      if (pipelines[name]) {
        pipelines[name].actor.getProperty().set(styles.static[name]);
      }
    });
    // inactive
    Object.keys(styles.inactive).forEach((name) => {
      if (pipelines[name]) {
        pipelines[name].actor.getProperty().set(styles.inactive[name]);
      }
    });
  } else {
    Object.keys(pipelines).forEach((name) => {
      const style =
        pipelines[name].actor === activeActor
          ? styles.active[name]
          : styles.inactive[name];
      if (style) {
        pipelines[name].actor.getProperty().set(style);
      }
    });
  }
}

// ----------------------------------------------------------------------------

export function connectPipeline(pipeline) {
  let source = pipeline.source;
  if (pipeline.filter) {
    if (source.isA('vtkDataSet')) {
      pipeline.filter.setInputData(source);
    } else {
      pipeline.filter.setInputConnection(source.getOutputPort());
    }
    source = pipeline.filter;
  }
  if (source) {
    if (source.isA('vtkDataSet')) {
      pipeline.mapper.setInputData(source);
    } else {
      pipeline.mapper.setInputConnection(source.getOutputPort());
    }
  }
  if (pipeline.glyph) {
    pipeline.mapper.setInputConnection(pipeline.glyph.getOutputPort(), 1);
  }
  pipeline.actor.setMapper(pipeline.mapper);
}

// Internal convenient function to create a data array:
export function allocateArray(
  polyData,
  name,
  numberOfTuples,
  dataType,
  numberOfComponents
) {
  // Check first whether name is points, verts, lines, polys, otherwise it is a point data array.
  let dataArray =
    polyData[`get${macro.capitalize(name)}`]?.() ||
    polyData.getPointData().getArrayByName(name);
  if (
    !dataArray ||
    (dataType !== undefined && dataArray.getDataType() !== dataType) ||
    (numberOfComponents !== undefined &&
      dataArray.getNumberOfComponents() !== numberOfComponents)
  ) {
    let arrayType = vtkDataArray;
    let arrayDataType = dataType;
    let arrayNumberOfComponents = numberOfComponents;
    if (name === 'points') {
      arrayType = vtkPoints;
      arrayDataType = arrayDataType ?? 'Float32Array';
      arrayNumberOfComponents = numberOfComponents ?? 3;
    } else if (POLYDATA_FIELDS.includes(name)) {
      arrayType = vtkCellArray;
      arrayDataType = arrayDataType ?? 'Uint16Array';
      arrayNumberOfComponents = numberOfComponents ?? 1;
    } else {
      // data array
      arrayDataType = arrayDataType ?? 'Float32Array';
      arrayNumberOfComponents = numberOfComponents ?? 1;
    }
    dataArray = arrayType.newInstance({
      name,
      dataType: arrayDataType,
      numberOfComponents: arrayNumberOfComponents,
      size: arrayNumberOfComponents * numberOfTuples,
      empty: numberOfTuples === 0,
    });
    if (name === 'points' || POLYDATA_FIELDS.includes(name)) {
      polyData[`set${macro.capitalize(name)}`](dataArray);
    } else {
      polyData.getPointData().addArray(dataArray);
    }
  } else if (dataArray.getNumberOfTuples() !== numberOfTuples) {
    dataArray.resize(numberOfTuples);
  }
  return dataArray;
}

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');

  // Internal cache
  const cache = { mtimes: {}, states: [] };

  model._onCoincidentTopologyParametersChanged = () => {
    publicAPI.getActors().forEach((actor) => {
      applyCoincidentTopologyParametersToMapper(
        actor.getMapper(),
        model.coincidentTopologyParameters
      );
    });
  };

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
        otherFlag = ctxVisible;
        break;
      default:
        otherFlag = true;
        break;
    }
    const visibilityFlag = otherFlag;
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

  // Add warning to model.actors.push
  model.actors.push = (...args) => {
    vtkWarningMacro(
      'You should use publicAPI.addActor() to initialize the actor properly'
    );
    args.forEach((actor) => publicAPI.addActor(actor));
  };

  publicAPI.addActor = (actor) => {
    applyCoincidentTopologyParametersToMapper(
      actor.getMapper(),
      model.coincidentTopologyParameters
    );
    Array.prototype.push.apply(model.actors, [actor]);
  };

  // Make sure setting the labels at build time works with string/array...
  publicAPI.setLabels(model.labels);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    activeScaleFactor: 1.2,
    activeColor: 1,
    useActiveColor: true,
    actors: [],
    labels: [],
    behavior: Behavior.CONTEXT,
    coincidentTopologyParameters: {
      Point: {
        factor: -1.0,
        offset: -1.0,
      },
      Line: {
        factor: -1.0,
        offset: -1.0,
      },
      Polygon: {
        factor: -1.0,
        offset: -1.0,
      },
    },
    scaleInPixels: false,
    displayScaleParams: {
      dispHeightFactor: 1,
      cameraPosition: [0, 0, 0],
      cameraDir: [1, 0, 0],
      isParallel: false,
      rendererPixelDims: [1, 1],
    },
    _internalArrays: {},
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  // Object methods
  vtkProp.extend(publicAPI, model, defaultValues(initialValues));
  macro.algo(publicAPI, model, 1, 1);
  macro.get(publicAPI, model, [
    'labels',
    'displayScaleParams',
    'coincidentTopologyParameters',
  ]);
  macro.set(publicAPI, model, [
    { type: 'object', name: 'displayScaleParams' },
    { type: 'object', name: 'coincidentTopologyParameters' },
  ]);
  macro.setGet(publicAPI, model, [
    'scaleInPixels',
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
  ]);

  // Object specific methods
  vtkWidgetRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default {
  extend,
  mergeStyles,
  applyStyles,
  connectPipeline,
};
