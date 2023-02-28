import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';
import { getPixelWorldHeightAtCoord } from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkWidgetRepresentation, {
  allocateArray,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

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
  const internalPolyData = vtkPolyData.newInstance({ mtime: 0 });

  function allocateSize(polyData, size, closePolyLine = false) {
    let points = null;
    if (size < 2) {
      // FIXME: Why 1 point and not 0 ?
      points = allocateArray(polyData, 'points', 1).getData();
      points.set([0, 0, 0]);
      allocateArray(polyData, 'lines', 0).getData();
    } else if (
      !polyData.getPoints() ||
      polyData.getPoints().length !== size * 3
    ) {
      points = allocateArray(polyData, 'points', size).getData();
      const cellSize = size + (closePolyLine ? 1 : 0);
      if (
        polyData.getLines().getNumberOfCells() !== 1 ||
        polyData.getLines().getCellSizes()[0] !== cellSize
      ) {
        const lines = allocateArray(polyData, 'lines', cellSize + 1); // +1 for the number of points
        const cellData = lines.getData();
        cellData[0] = cellSize;
        for (let i = 1; i <= cellSize; i++) {
          cellData[i] = i - 1;
        }
        if (closePolyLine) {
          cellData[cellSize - 1] = 0;
        }
        lines.setData(cellData);
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
    if (publicAPI.getScaleInPixels() && internalPolyData) {
      const center = vtkBoundingBox.getCenter(internalPolyData.getBounds());
      scaledLineThickness *= getPixelWorldHeightAtCoord(
        center,
        model.displayScaleParams
      );
    }
    model._pipelines.tubes.filter.setRadius(scaledLineThickness);
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model._pipelines = {
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

  vtkWidgetRepresentation.connectPipeline(model._pipelines.tubes);
  publicAPI.addActor(model._pipelines.tubes.actor);

  // --------------------------------------------------------------------------
  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];
    outData[0] = internalPolyData;

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

    const points = allocateSize(
      outData[0],
      size,
      model.closePolyLine && size > 2
    );

    if (points) {
      for (let i = 0; i < size; i++) {
        const coords = list[i].getOrigin();
        points[i * 3] = coords[0];
        points[i * 3 + 1] = coords[1];
        points[i * 3 + 2] = coords[2];
      }
    }

    outData[0].getPoints().modified();
    outData[0].modified();

    const lineThickness = state.getLineThickness?.() ?? model.lineThickness;
    applyLineThickness(lineThickness);
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
    let lineThickness = state.getLineThickness?.() ?? model.lineThickness;
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      lineThickness = Math.max(4, lineThickness);
    }
    applyLineThickness(lineThickness);

    return superClass.updateActorVisibility(
      renderingType,
      ctxVisible,
      hVisible
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
