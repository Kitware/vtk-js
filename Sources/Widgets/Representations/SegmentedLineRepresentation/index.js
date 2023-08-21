import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import { getPixelWorldHeightAtCoord } from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkWidgetRepresentation, {
  allocateArray,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import { OrientationModes } from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper/Constants';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

// ----------------------------------------------------------------------------
// vtkPolyLineRepresentation methods
// ----------------------------------------------------------------------------

function vtkPolyLineRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineRepresentation');
  const superClass = { ...publicAPI };

  const internalPolyData = vtkPolyData.newInstance({ mtime: 0 });

  function allocateSize(polyData, size, closePolyLine = false) {
    if (!polyData.getPoints() || polyData.getPoints().length !== size * 3) {
      allocateArray(polyData, 'points', size).getData();
    }

    const cellSize = size + (closePolyLine ? 1 : 0);
    if (
      polyData.getLines().getNumberOfCells() !== 1 ||
      polyData.getLines().getCellSizes()[0] !== cellSize
    ) {
      const lines = allocateArray(polyData, 'lines', cellSize + 1).getData(); // +1 for the number of points
      lines[0] = cellSize;
      for (let i = 1; i <= cellSize; i++) {
        lines[i] = i - 1;
      }
      if (closePolyLine) {
        lines[cellSize] = 0;
      }
    }
  }

  /**
   * Change the segments thickness.
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
    model._pipeline.glyph.setRadius(scaledLineThickness);
  }

  model._pipeline = {
    source: publicAPI,
    glyph: vtkCylinderSource.newInstance({
      direction: [1, 0, 0],
    }),
    mapper: vtkGlyph3DMapper.newInstance({
      orientationArray: 'directions',
      orientationMode: OrientationModes.DIRECTION,
    }),
    actor: vtkActor.newInstance({ parentProp: publicAPI }),
  };

  vtkWidgetRepresentation.connectPipeline(model._pipeline);
  publicAPI.addActor(model._pipeline.actor);

  // --------------------------------------------------------------------------
  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];
    outData[0] = internalPolyData;

    // Remove invalid and coincident points.
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

    allocateSize(internalPolyData, size, model.closePolyLine && size > 2);

    const points = internalPolyData.getPoints().getData();
    const lines = internalPolyData.getLines().getData();

    for (let i = 0; i < size; i++) {
      const coords = list[i].getOrigin();
      points[i * 3] = coords[0];
      points[i * 3 + 1] = coords[1];
      points[i * 3 + 2] = coords[2];
    }

    // Orient glyphs to next point.
    const directions = allocateArray(
      internalPolyData,
      'directions',
      lines.length - 1,
      undefined,
      3
    ).getData();
    for (let point = 1; point < lines.length - 1; point++) {
      const eye = lines[point] * 3;
      const eyePoint = [points[eye], points[eye + 1], points[eye + 2]];
      const target = lines[point + 1] * 3;
      const targetPoint = [
        points[target],
        points[target + 1],
        points[target + 2],
      ];
      const direction = vtkMath.subtract(targetPoint, eyePoint, []);
      const glyph = (point - 1) * 3;
      directions[glyph] = direction[0];
      directions[glyph + 1] = direction[1];
      directions[glyph + 2] = direction[2];
    }

    internalPolyData.getPoints().modified();
    internalPolyData.modified();

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
