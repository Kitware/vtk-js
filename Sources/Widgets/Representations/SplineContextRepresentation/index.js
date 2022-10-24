import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSpline3D from 'vtk.js/Sources/Common/DataModel/Spline3D';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';
import vtkLineFilter from 'vtk.js/Sources/Filters/General/LineFilter';
import vtkWidgetRepresentation, {
  allocateArray,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

// ----------------------------------------------------------------------------
// vtkSplineContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkSplineContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSplineContextRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });

  model._pipelines = {
    area: {
      source: publicAPI,
      filter: vtkTriangleFilter.newInstance(),
      mapper: vtkMapper.newInstance(),
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
    },
    border: {
      source: publicAPI,
      filter: vtkLineFilter.newInstance(),
      mapper: vtkMapper.newInstance(),
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
    },
  };

  vtkWidgetRepresentation.connectPipeline(model._pipelines.area);
  model._pipelines.area.actor.getProperty().setOpacity(0.2);
  model._pipelines.area.actor.getProperty().setColor(0, 1, 0);
  publicAPI.addActor(model._pipelines.area.actor);

  vtkWidgetRepresentation.connectPipeline(model._pipelines.border);
  model._pipelines.border.actor.getProperty().setOpacity(1);
  model._pipelines.border.actor.getProperty().setColor(0.1, 1, 0.1);
  model._pipelines.border.actor.setVisibility(model.outputBorder);
  publicAPI.addActor(model._pipelines.border.actor);

  // --------------------------------------------------------------------------
  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const widgetState = inData[0];
    const closed = widgetState.getSplineClosed();

    const list = publicAPI.getRepresentationStates(widgetState);
    const inPoints = list.map((state) => state.getOrigin());
    if (inPoints.length <= 1) {
      outData[0] = model.internalPolyData;
      return;
    }

    let numVertices = inPoints.length;

    if (!closed) {
      --numVertices;
    } else {
      inPoints.push(inPoints[0]);
    }

    const spline = vtkSpline3D.newInstance({
      close: widgetState.getSplineClosed(),
      kind: widgetState.getSplineKind(),
      tension: widgetState.getSplineTension(),
      bias: widgetState.getSplineBias(),
      continuity: widgetState.getSplineContinuity(),
      boundaryCondition: widgetState.getSplineBoundaryCondition(),
      boundaryConditionValues: widgetState.getSplineBoundaryConditionValues(),
    });
    spline.computeCoefficients(inPoints);

    const outPoints = allocateArray(
      model.internalPolyData,
      'points',
      (numVertices + !closed) * model.resolution
    ).getData();
    const outCells = new Uint32Array(numVertices * model.resolution + 2);
    outCells[0] = numVertices * model.resolution + 1;
    outCells[numVertices * model.resolution + 1] = 0;

    for (let i = 0; i < numVertices; i++) {
      for (let j = 0; j < model.resolution; j++) {
        const t = j / model.resolution;
        const point = spline.getPoint(i, t);

        outPoints[3 * (i * model.resolution + j) + 0] = point[0];
        outPoints[3 * (i * model.resolution + j) + 1] = point[1];
        outPoints[3 * (i * model.resolution + j) + 2] = point[2];
        outCells[i * model.resolution + j + 1] = i * model.resolution + j;
      }
    }

    if (closed) {
      outCells[numVertices * model.resolution + 1] = 0;
    } else {
      const lastPointIndex = numVertices * model.resolution + 1;
      const lastPoint = spline.getPoint(numVertices, 0);
      outPoints[3 * lastPointIndex + 0] = lastPoint[0];
      outPoints[3 * lastPointIndex + 1] = lastPoint[1];
      outPoints[3 * lastPointIndex + 2] = lastPoint[2];
      outCells[numVertices * model.resolution + 1] = lastPointIndex;
    }

    if (model.fill) {
      model.internalPolyData.getPolys().setData(outCells);
    }

    model.internalPolyData
      .getLines()
      .setData(model.outputBorder ? outCells : []);

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;

    model._pipelines.area.filter.update();
    model._pipelines.border.actor
      .getProperty()
      .setColor(
        ...(inPoints.length <= 3 ||
        model._pipelines.area.filter.getErrorCount() === 0
          ? model.borderColor
          : model.errorBorderColor)
      );
  };

  publicAPI.getSelectedState = (prop, compositeID) => model.state;

  function updateAreaVisibility() {
    model._pipelines.area.actor.setVisibility(model.fill);
  }

  publicAPI.setFill = macro.chain(publicAPI.setFill, updateAreaVisibility);

  publicAPI.setOutputBorder = macro.chain(publicAPI.setOutputBorder, (v) =>
    model._pipelines.border.actor.setVisibility(v)
  );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  resolution: 16,
  fill: true,
  // boundaryCondition : BoundaryCondition.DEFAULT
  outputBorder: false,
  borderColor: [0.1, 1, 0.1],
  errorBorderColor: [1, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['mapper']);
  macro.setGet(publicAPI, model, [
    'resolution',
    'boundaryCondition',
    'fill',
    'outputBorder',
  ]);
  macro.setGetArray(publicAPI, model, ['borderColor', 'errorBorderColor'], 3);

  // Object specific methods
  vtkSplineContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSplineContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
