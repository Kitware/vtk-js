import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';

const { vtkErrorMacro } = macro;
const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------
// vtkEllipseArcSource methods
// ----------------------------------------------------------------------------

function vtkEllipseArcSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkEllipseArcSource');

  publicAPI.requestData = (inData, outData) => {
    const isClosedShape = Math.abs(model.segmentAngle - 360.0) < 1e-5;
    const resolution =
      model.close && !isClosedShape ? model.resolution + 1 : model.resolution;

    const numLines = resolution;
    const numPts = resolution + 1;
    const tc = [0.0, 0.0];

    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    // Make sure the normal vector is normalized
    const normal = [...model.normal];
    vtkMath.normalize(normal);

    // Get orthogonal vector between user-defined major radius and normal
    const orthogonalVect = [0, 0, 0];
    vtkMath.cross(normal, model.majorRadiusVector, orthogonalVect);

    if (vtkMath.norm(orthogonalVect) < 1e-10) {
      vtkErrorMacro(
        'Ellipse normal vector and major radius axis are collinear'
      );
      return;
    }

    vtkMath.normalize(orthogonalVect);

    const majorRadiusVect = [0, 0, 0];
    vtkMath.cross(orthogonalVect, normal, majorRadiusVect);
    vtkMath.normalize(majorRadiusVect);

    const a = vtkMath.norm(model.majorRadiusVector);
    const b = a * model.ratio;

    let startAngleRad = vtkMath.radiansFromDegrees(model.startAngle);
    if (startAngleRad < 0) {
      startAngleRad += 2.0 * Math.PI;
    }

    const segmentAngleRad = vtkMath.radiansFromDegrees(model.segmentAngle);

    const angleIncRad = segmentAngleRad / model.resolution;

    let pointType = VtkDataTypes.FLOAT;
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

    const skipLastPoint = model.close && isClosedShape;

    let theta = startAngleRad;
    let pointIndex = 0;

    for (let i = 0; i <= resolution; ++i, theta += angleIncRad) {
      const quotient = Math.floor(theta / (2.0 * Math.PI));
      const normalizedTheta = theta - quotient * 2.0 * Math.PI;

      let thetaEllipse = Math.atan(Math.tan(normalizedTheta) * model.ratio);

      if (normalizedTheta > Math.PI / 2 && normalizedTheta <= Math.PI) {
        thetaEllipse += Math.PI;
      } else if (
        normalizedTheta > Math.PI &&
        normalizedTheta <= 1.5 * Math.PI
      ) {
        thetaEllipse -= Math.PI;
      }

      const cosTheta = Math.cos(thetaEllipse);
      const sinTheta = Math.sin(thetaEllipse);

      const p = [
        model.center[0] +
          a * cosTheta * majorRadiusVect[0] +
          b * sinTheta * orthogonalVect[0],
        model.center[1] +
          a * cosTheta * majorRadiusVect[1] +
          b * sinTheta * orthogonalVect[1],
        model.center[2] +
          a * cosTheta * majorRadiusVect[2] +
          b * sinTheta * orthogonalVect[2],
      ];

      tc[0] = i / resolution;
      tc[1] = 0.0;

      if (i !== resolution || !skipLastPoint) {
        points.setPoint(pointIndex, ...p);
        tcoords.setTuple(pointIndex, tc);
        pointIndex++;
      }
    }

    const actualNumPts = pointIndex;
    const pointIds = [];

    for (let k = 0; k < actualNumPts - 1; ++k) {
      pointIds.push(k);
    }

    if (model.close) {
      pointIds.push(0);
    } else {
      pointIds.push(actualNumPts - 1);
    }

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
  center: [0.0, 0.0, 0.0],
  normal: [0.0, 0.0, 1.0],
  majorRadiusVector: [1.0, 0.0, 0.0],
  startAngle: 0.0,
  segmentAngle: 90.0,
  resolution: 100,
  close: false,
  outputPointsPrecision: DesiredOutputPrecision.SINGLE,
  ratio: 1.0,
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
    'startAngle',
    'segmentAngle',
    'close',
    'outputPointsPrecision',
    'ratio',
  ]);

  macro.setGetArray(
    publicAPI,
    model,
    ['center', 'normal', 'majorRadiusVector'],
    3
  );

  vtkEllipseArcSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkEllipseArcSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
