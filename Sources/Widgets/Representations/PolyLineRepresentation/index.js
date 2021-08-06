import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// vtkPolyLineRepresentation methods
// ----------------------------------------------------------------------------

function vtkPolyLineRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPolyLineRepresentation');
  const superClass = { ...publicAPI };

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.cells = [];

  function allocateSize(size, closePolyLine = false) {
    if (size < 2) {
      model.internalPolyData.getPoints().setData(new Float32Array([0, 0, 0]));
      model.internalPolyData.getLines().setData(new Uint8Array(0));
    } else if (!model.points || model.points.length !== size * 3) {
      model.points = new Float32Array(size * 3);
      model.cells = new Uint8Array(size + 1 + (closePolyLine ? 1 : 0));
      model.cells[0] = model.cells.length - 1;
      for (let i = 1; i < model.cells.length; i++) {
        model.cells[i] = i - 1;
      }
      if (closePolyLine) {
        model.cells[model.cells.length - 1] = 0;
        console.log('closePolyLine', closePolyLine, model.cells);
      }
      model.internalPolyData.getPoints().setData(model.points, 3);
      model.internalPolyData.getLines().setData(model.cells);
    }
    return model.points;
  }

  /**
   * Change the line/tube thickness.
   * @param {number} lineThickness
   */
  function applyLineThickness(lineThickness) {
    let scaledLineThickness = lineThickness;
    if (publicAPI.getScaleInPixels()) {
      const center = vtkBoundingBox.getCenter(
        model.internalPolyData.getBounds()
      );
      scaledLineThickness *= publicAPI.getPixelWorldHeightAtCoord(center);
    }
    model.tubes.setRadius(scaledLineThickness);
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.tubes = vtkTubeFilter.newInstance({
    radius: model.lineThickness,
    numberOfSides: 12,
    capping: false,
  });

  model.tubes.setInputConnection(publicAPI.getOutputPort());
  model.mapper.setInputConnection(model.tubes.getOutputPort());

  // model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);

  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];
    // Remove invalid and coincident points for tube filter.
    const list = publicAPI
      .getRepresentationStates(state)
      .reduce((subStates, subState) => {
        const subStateOrigin =
          subState.getOrigin && subState.getOrigin()
            ? subState.getOrigin()
            : null;
        const previousSubStateOrigin =
          subStates.length && subStates[subStates.length - 1].getOrigin();
        if (
          !subStateOrigin ||
          (previousSubStateOrigin &&
            vtkMath.areEquals(subStateOrigin, previousSubStateOrigin))
        ) {
          return subStates;
        }
        subStates.push(subState);
        return subStates;
      }, []);
    let size = list.length;

    // Do not render last point if not visible or too close from previous point.
    if (size > 1) {
      const lastState = list[list.length - 1];
      const last = lastState.getOrigin();
      const prevLast = list[list.length - 2].getOrigin();
      let delta =
        vtkMath.distance2BetweenPoints(last, prevLast) > model.threshold
          ? 0
          : 1;
      if (!delta && lastState.isVisible && !lastState.isVisible()) {
        delta++;
      }
      size -= delta;
    }

    const points = allocateSize(size, model.closePolyLine && size > 2);

    if (points) {
      for (let i = 0; i < size; i++) {
        const coords = list[i].getOrigin();
        points[i * 3] = coords[0];
        points[i * 3 + 1] = coords[1];
        points[i * 3 + 2] = coords[2];
      }
    }

    model.internalPolyData.modified();

    const lineThickness = state.getLineThickness
      ? state.getLineThickness()
      : null;
    applyLineThickness(lineThickness || model.lineThickness);

    outData[0] = model.internalPolyData;
  };

  /**
   * When mousing over the line, if behavior != CONTEXT,
   * returns the parent state.
   * @param {object} prop
   * @param {number} compositeID
   * @returns {object}
   */
  publicAPI.getSelectedState = (prop, compositeID) => model.inputData[0];

  publicAPI.updateActorVisibility = (renderingType, ctxVisible, hVisible) => {
    const state = model.inputData[0];

    // Make lines/tubes thicker for picking
    let lineThickness = state.getLineThickness
      ? state.getLineThickness()
      : null;
    lineThickness = lineThickness || model.lineThickness;
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      lineThickness = Math.max(4, lineThickness);
    }
    applyLineThickness(lineThickness);
    const isValid = model.points && model.points.length > 3;

    return superClass.updateActorVisibility(
      renderingType,
      ctxVisible && isValid,
      hVisible && isValid
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  threshold: Number.EPSILON,
  closePolyLine: false,
  lineThickness: 2,
  scaleInPixels: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  const newDefault = { ...DEFAULT_VALUES, ...initialValues };
  vtkWidgetRepresentation.extend(publicAPI, model, newDefault);
  macro.setGet(publicAPI, model, [
    'threshold',
    'closePolyLine',
    'lineThickness',
  ]);

  vtkPolyLineRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPolyLineRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
