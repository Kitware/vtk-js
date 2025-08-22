import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';

const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------
// vtkArcSource methods
// ----------------------------------------------------------------------------

function vtkArcSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArcSource');

  publicAPI.requestData = (inData, outData) => {
    const numLines = model.resolution;
    const numPts = model.resolution + 1;
    const tc = [0.0, 0.0];

    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    let angle = 0.0;
    let radius = 0.5;
    const perpendicular = [0, 0, 0];
    const v1 = [0, 0, 0];

    if (model.useNormalAndAngle) {
      angle = vtkMath.radiansFromDegrees(model.angle);

      v1[0] = model.polarVector[0];
      v1[1] = model.polarVector[1];
      v1[2] = model.polarVector[2];

      vtkMath.cross(model.normal, model.polarVector, perpendicular);

      radius = vtkMath.normalize(v1);
    } else {
      vtkMath.subtract(model.point1, model.center, v1);

      const v2 = [0, 0, 0];
      vtkMath.subtract(model.point2, model.center, v2);

      const normal = [0, 0, 0];
      vtkMath.cross(v1, v2, normal);
      vtkMath.cross(normal, v1, perpendicular);

      const dotProduct =
        vtkMath.dot(v1, v2) / (vtkMath.norm(v1) * vtkMath.norm(v2));
      angle = Math.acos(dotProduct);

      if (model.negative) {
        angle -= 2.0 * Math.PI;
      }

      radius = vtkMath.normalize(v1);
    }

    const angleInc = angle / model.resolution;

    vtkMath.normalize(perpendicular);

    let pointType = 0;
    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }

    const points = vtkPoints.newInstance({
      dataType: pointType,
    });
    points.setNumberOfPoints(numPts);

    const tcoords = vtkDataArray.newInstance({
      numberOfComponents: 2,
      size: numPts * 2,
      dataType: VtkDataTypes.FLOAT,
      name: 'TextureCoordinates',
    });

    const lines = vtkCellArray.newInstance();
    lines.allocate(numLines);

    let theta = 0.0;
    for (let i = 0; i <= model.resolution; ++i, theta += angleInc) {
      const cosine = Math.cos(theta);
      const sine = Math.sin(theta);

      const p = [
        model.center[0] +
          cosine * radius * v1[0] +
          sine * radius * perpendicular[0],
        model.center[1] +
          cosine * radius * v1[1] +
          sine * radius * perpendicular[1],
        model.center[2] +
          cosine * radius * v1[2] +
          sine * radius * perpendicular[2],
      ];

      tc[0] = i / model.resolution;
      tc[1] = 0.0;

      points.setPoint(i, ...p);
      tcoords.setTuple(i, tc);
    }

    const pointIds = Array.from({ length: numPts }, (_, i) => i);

    lines.insertNextCell(pointIds);

    output.setPoints(points);
    output.getPointData().setTCoords(tcoords);
    output.setLines(lines);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  point1: [0.0, 0.5, 0.0],
  point2: [0.5, 0.0, 0.0],
  center: [0.0, 0.0, 0.0],
  normal: [0.0, 0.0, 1.0],
  polarVector: [1.0, 0.0, 0.0],
  angle: 90.0,
  resolution: 6,
  negative: false,
  useNormalAndAngle: false,
  outputPointsPrecision: DesiredOutputPrecision.SINGLE,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Ensure resolution is at least 1
  if (model.resolution < 1) {
    model.resolution = 1;
  }

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 1);

  macro.setGet(publicAPI, model, [
    'resolution',
    'angle',
    'negative',
    'useNormalAndAngle',
    'outputPointsPrecision',
  ]);

  macro.setGetArray(
    publicAPI,
    model,
    ['point1', 'point2', 'center', 'normal', 'polarVector'],
    3
  );

  vtkArcSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArcSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
