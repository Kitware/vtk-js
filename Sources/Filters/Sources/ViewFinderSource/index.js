import macro from 'vtk.js/Sources/macros';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

function vtkViewFinderSource(publicAPI, model) {
  publicAPI.requestData = (inData, outData) => {
    const dataset = vtkPolyData.newInstance();

    const points = macro.newTypedArray(model.pointType, 3 * 16);

    points[0] = model.radius;
    points[1] = model.radius / model.width;
    points[2] = 0;
    points[3] = model.radius + model.spacing;
    points[4] = model.radius / model.width;
    points[5] = 0;

    points[6] = model.radius;
    points[7] = (model.radius / model.width) * -1;
    points[8] = 0;
    points[9] = model.radius + model.spacing;
    points[10] = (model.radius / model.width) * -1;
    points[11] = 0;

    points[12] = model.radius * -1;
    points[13] = model.radius / model.width;
    points[14] = 0;
    points[15] = (model.radius + model.spacing) * -1;
    points[16] = model.radius / model.width;
    points[17] = 0;

    points[18] = model.radius * -1;
    points[19] = (model.radius / model.width) * -1;
    points[20] = 0;
    points[21] = (model.radius + model.spacing) * -1;
    points[22] = (model.radius / model.width) * -1;
    points[23] = 0;

    points[24] = model.radius / model.width;
    points[25] = model.radius;
    points[26] = 0;
    points[27] = model.radius / model.width;
    points[28] = model.radius + model.spacing;
    points[29] = 0;

    points[30] = (model.radius / model.width) * -1;
    points[31] = model.radius;
    points[32] = 0;
    points[33] = (model.radius / model.width) * -1;
    points[34] = model.radius + model.spacing;
    points[35] = 0;

    points[36] = model.radius / model.width;
    points[37] = model.radius * -1;
    points[38] = 0;
    points[39] = model.radius / model.width;
    points[40] = (model.radius + model.spacing) * -1;
    points[41] = 0;

    points[42] = (model.radius / model.width) * -1;
    points[43] = model.radius * -1;
    points[44] = 0;
    points[45] = (model.radius / model.width) * -1;
    points[46] = (model.radius + model.spacing) * -1;
    points[47] = 0;

    // prettier-ignore
    const cells = Uint8Array.from([
    3, 0, 1, 2,
    3, 2, 1, 3,
    3, 4, 6, 5,
    3, 6, 5, 7,
    3, 8, 11, 9,
    3, 8, 10, 11,
    3, 12, 13, 15,
    3, 12, 15, 14,
  ]);

    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([1, 0, 0], model.orientation)
      .apply(points);

    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(cells, 1);

    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  radius: 1,
  spacing: 2,
  width: 4,
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  model.center = [0, 0, 0];
  model.orientation = [1, 0, 0];

  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['radius', 'spacing', 'width']);
  macro.setGetArray(publicAPI, model, ['center', 'orientation'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkViewFinderSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArrow2DSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
