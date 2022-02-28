import macro from 'vtk.js/Sources/macros';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import Constants from './Constants';

const { ShapeType } = Constants;

// ----------------------------------------------------------------------------
// vtkArrow2DSource methods
// ----------------------------------------------------------------------------

function vtkStarSource(publicAPI, model) {
  const dataset = vtkPolyData.newInstance();

  const points = macro.newTypedArray(model.pointType, 10 * 3);
  const edges = new Uint32Array(11);
  edges[0] = 10;
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 1 ? model.height : model.height * 0.4;
    points[3 * i + 0] = radius * Math.cos(((2 * i - 1) * Math.PI) / 10);
    points[3 * i + 1] = radius * Math.sin(((2 * i - 1) * Math.PI) / 10);
    points[3 * i + 2] = 0;

    edges[1 + i] = i;
  }

  dataset.getPoints().setData(points, 3);
  dataset.getPolys().setData(edges, 1);

  return dataset;
}

function vtk6PointsArrow(publicAPI, model) {
  const dataset = vtkPolyData.newInstance();

  const points = macro.newTypedArray(model.pointType, 6 * 3);

  const thickOp = model.height * 0.5 * model.thickness;

  const offsetOp = model.height * 0.5 - thickOp;

  const baseOffsetOp =
    (model.height * 0.9 +
      thickOp -
      offsetOp -
      (model.height * 0.5 - thickOp - offsetOp)) *
    (1 - model.base);

  points[0] = (model.width / 2) * -1 - thickOp;
  points[1] = model.height / 4 - offsetOp - baseOffsetOp;
  points[2] = 0.0;

  points[3] = 0.0;
  points[4] = model.height * 0.9 + thickOp - offsetOp - baseOffsetOp;
  points[5] = 0.0;

  points[6] = model.width / 2 + thickOp;
  points[7] = model.height / 4 - offsetOp - baseOffsetOp;
  points[8] = 0.0;

  points[9] = model.width / 3;
  points[10] = model.height * 0.1 - thickOp - offsetOp - baseOffsetOp;
  points[11] = 0.0;

  points[12] = 0.0;
  points[13] = model.height * 0.5 - thickOp - offsetOp - baseOffsetOp;
  points[14] = 0.0;

  points[15] = (model.width / 3) * -1;
  points[16] = model.height * 0.1 - thickOp - offsetOp - baseOffsetOp;
  points[17] = 0.0;

  // prettier-ignore
  const cells = Uint8Array.from([
    3, 0, 1, 5,
    3, 1, 4, 5,
    3, 1, 4, 3,
    3, 1, 2, 3,
  ]);

  dataset.getPoints().setData(points, 3);
  dataset.getPolys().setData(cells, 1);

  return dataset;
}

function vtk4PointsArrow(publicAPI, model) {
  const dataset = vtkPolyData.newInstance();

  const points = macro.newTypedArray(model.pointType, 4 * 3);

  const thickOp = (model.height / 3) * model.thickness;

  const offsetOp = model.height / 3 - thickOp;

  const baseOffsetOp =
    (model.height - offsetOp - (model.height / 3 - thickOp - offsetOp)) *
    (1 - model.base);

  points[0] = (model.width / 2) * -1;
  points[1] = 0.0 - offsetOp - baseOffsetOp;
  points[2] = 0.0;

  points[3] = 0.0;
  points[4] = model.height - offsetOp - baseOffsetOp;
  points[5] = 0.0;

  points[6] = model.width / 2;
  points[7] = 0.0 - offsetOp - baseOffsetOp;
  points[8] = 0.0;

  points[9] = 0.0;
  points[10] = model.height / 3 - thickOp - offsetOp - baseOffsetOp;
  points[11] = 0.0;

  const cells = Uint8Array.from([3, 0, 1, 3, 3, 1, 2, 3]);

  dataset.getPoints().setData(points, 3);
  dataset.getPolys().setData(cells, 1);

  return dataset;
}

function vtkTriangleSource(publicAPI, model) {
  const dataset = vtkPolyData.newInstance();

  const points = macro.newTypedArray(model.pointType, 3 * 3);

  const baseOffsetOp = model.height * (1 - model.base);

  points[0] = (model.width / 2) * -1;
  points[1] = 0.0 - baseOffsetOp;
  points[2] = 0.0;

  points[3] = 0.0;
  points[4] = model.height - baseOffsetOp;
  points[5] = 0.0;

  points[6] = model.width / 2;
  points[7] = 0.0 - baseOffsetOp;
  points[8] = 0.0;

  const cells = Uint8Array.from([3, 0, 1, 2]);

  dataset.getPoints().setData(points, 3);
  dataset.getPolys().setData(cells, 1);

  return dataset;
}

function vtkArrow2DSource(publicAPI, model) {
  const shapeToSource = {
    [ShapeType.TRIANGLE]: vtkTriangleSource,
    [ShapeType.STAR]: vtkStarSource,
    [ShapeType.ARROW_4]: vtk4PointsArrow,
    [ShapeType.ARROW_6]: vtk6PointsArrow,
  };

  publicAPI.requestData = (inData, outData) => {
    outData[0] = shapeToSource[model.shape](publicAPI, model);

    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([1, 0, 0], model.direction)
      .apply(outData[0].getPoints().getData());
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 * height modifies the size of the source along x axis
 * width modifies the size of the source along y axis

 * thickness modifies the shape of the source, which becomes wider on
 * y axis

 * base modifies the position which lowers the source on x axis for 0 and moves
 * the source up on x axis for 1
 */
function defaultValues(initialValues) {
  return {
    base: 0,
    center: [0, 0, 0],
    height: 1.0,
    direction: [1, 0, 0],
    pointType: 'Float64Array',
    thickness: 0,
    width: 1.0,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['height', 'width', 'thickness', 'base']);
  macro.setGetArray(publicAPI, model, ['center', 'direction'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkArrow2DSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArrow2DSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
