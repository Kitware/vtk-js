import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';
import vtkWidgetRepresentation, {
  getPixelWorldHeightAtCoord,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
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

  function allocateSize(size, closePolyLine = false) {
    let points = null;
    if (size < 2) {
      // FIXME: Why 1 point and not 0 ?
      points = publicAPI
        .allocateArray('points', 'Float32Array', 3, 1)
        .getData();
      points.set([0, 0, 0]);
      publicAPI.allocateArray('lines', 'Uint8Array', 3, 0).getData();
    } else if (
      !model.internalPolyData.getPoints() ||
      model.internalPolyData.getPoints().length !== size * 3
    ) {
      points = publicAPI
        .allocateArray('points', 'Float32Array', 3, size)
        .getData();
      const cellSize = size + 1 + (closePolyLine ? 1 : 0);
      const cells = publicAPI
        .allocateArray('points', 'Uint8Array', 1, cellSize)
        .getData();
      cells[0] = cells.length - 1;
      for (let i = 1; i < cells.length; i++) {
        cells[i] = i - 1;
      }
      if (closePolyLine) {
        cells[cells.length - 1] = 0;
      }
    }
    return points;
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
      scaledLineThickness *= getPixelWorldHeightAtCoord(
        center,
        model.displayScaleParams
      );
    }
    model.pipelines.tubes.filter.setRadius(scaledLineThickness);
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.pipelines = {
    tubes: {
      source: publicAPI,
      filter: vtkTubeFilter.newInstance({
        radius: model.lineThickness,
        numberOfSides: 12,
        capping: false,
      }),
      mapper: vtkMapper.newInstance(),
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
    },
  };

  vtkWidgetRepresentation.connectPipeline(model.pipelines.tubes);
  publicAPI.addActor(model.pipelines.tubes.actor);

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
    const size = list.length;

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
