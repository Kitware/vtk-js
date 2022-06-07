import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSpline3D from 'vtk.js/Sources/Common/DataModel/Spline3D';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';
import vtkLineFilter from 'vtk.js/Sources/Filters/General/LineFilter';

// ----------------------------------------------------------------------------
// vtkSplineContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkSplineContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSplineContextRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.pipelines = {
    area: {
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
      mapper: vtkMapper.newInstance(),
      triangleFilter: vtkTriangleFilter.newInstance(),
    },
    border: {
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
      mapper: vtkMapper.newInstance(),
      lineFilter: vtkLineFilter.newInstance(),
    },
  };

  model.pipelines.area.triangleFilter.setInputConnection(
    publicAPI.getOutputPort()
  );
  model.pipelines.area.mapper.setInputConnection(
    model.pipelines.area.triangleFilter.getOutputPort()
  );
  model.pipelines.area.actor.setMapper(model.pipelines.area.mapper);
  model.pipelines.area.actor.getProperty().setOpacity(0.2);
  model.pipelines.area.actor.getProperty().setColor(0, 1, 0);
  publicAPI.addActor(model.pipelines.area.actor);

  model.pipelines.border.lineFilter.setInputConnection(
    publicAPI.getOutputPort()
  );
  model.pipelines.border.mapper.setInputConnection(
    model.pipelines.border.lineFilter.getOutputPort()
  );
  model.pipelines.border.actor.setMapper(model.pipelines.border.mapper);
  model.pipelines.border.actor.getProperty().setOpacity(1);
  model.pipelines.border.actor.getProperty().setColor(0.1, 1, 0.1);
  model.pipelines.border.actor.setVisibility(model.outputBorder);

  publicAPI.addActor(model.pipelines.border.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const polydata = vtkPolyData.newInstance();
    const widgetState = inData[0];
    const closed = widgetState.getSplineClosed();

    const list = publicAPI
      .getRepresentationStates(widgetState)
      .filter(
        (state) =>
          state.getVisible &&
          state.getVisible() &&
          state.getOrigin &&
          state.getOrigin()
      );

    const inPoints = list.map((state) => state.getOrigin());
    if (inPoints.length <= 1) {
      outData[0] = polydata;
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

    const outPoints = new Float32Array(
      3 * ((numVertices + !closed) * model.resolution)
    );
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

    polydata.getPoints().setData(outPoints);
    if (model.fill) {
      polydata.getPolys().setData(outCells);
    }

    polydata.getLines().setData(model.outputBorder ? outCells : []);

    outData[0] = polydata;

    model.pipelines.area.triangleFilter.update();
    model.pipelines.border.actor
      .getProperty()
      .setColor(
        ...(inPoints.length <= 3 ||
        model.pipelines.area.triangleFilter.getErrorCount() === 0
          ? model.borderColor
          : model.errorBorderColor)
      );
  };

  publicAPI.getSelectedState = (prop, compositeID) => model.state;

  function updateAreaVisibility() {
    model.pipelines.area.actor.setVisibility(model.fill);
  }

  publicAPI.setFill = macro.chain(publicAPI.setFill, updateAreaVisibility);

  publicAPI.setOutputBorder = macro.chain(publicAPI.setOutputBorder, (v) =>
    model.pipelines.border.actor.setVisibility(v)
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
