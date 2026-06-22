import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';

// ----------------------------------------------------------------------------
// vtkRegularPolygonSource methods
// ----------------------------------------------------------------------------

function vtkRegularPolygonSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRegularPolygonSource');

  publicAPI.requestData = (inData, outData) => {
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();
    const numPts = model.numberOfSides;

    const newPoints = vtkPoints.newInstance({
      dataType:
        model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE
          ? VtkDataTypes.DOUBLE
          : VtkDataTypes.FLOAT,
    });

    // Generate polyline if requested
    if (model.generatePolyline) {
      const newLine = vtkCellArray.newInstance();
      const linePoints = [];
      for (let i = 0; i < numPts; i++) {
        linePoints.push(i);
      }
      linePoints.push(0); // close the polyline
      newLine.insertNextCell(linePoints);
      output.setLines(newLine);
    }

    // Generate polygon if requested
    if (model.generatePolygon) {
      const newPoly = vtkCellArray.newInstance();
      const polyPoints = [];
      for (let i = 0; i < numPts; i++) {
        polyPoints.push(i);
      }
      newPoly.insertNextCell(polyPoints);
      output.setPolys(newPoly);
    }

    // Make sure the polygon normal is a unit vector
    const n = [...model.normal];
    const nLength = vtkMath.normalize(n);
    if (nLength === 0.0) {
      n[0] = 0.0;
      n[1] = 0.0;
      n[2] = 1.0;
    }

    // Find a vector in the polygon plane (perpendicular to normal)
    const px = [0, 0, 0];
    const py = [0, 0, 0];
    let foundPlaneVector = false;

    // Cross with unit axis vectors and eventually find vector in the polygon plane
    const axis = [1.0, 0.0, 0.0];
    vtkMath.cross(n, axis, px);
    const pxLength = vtkMath.normalize(px);
    if (pxLength > 1.0e-3) {
      foundPlaneVector = true;
    }

    if (!foundPlaneVector) {
      axis[0] = 0.0;
      axis[1] = 1.0;
      axis[2] = 0.0;
      vtkMath.cross(n, axis, px);
      const pxLength2 = vtkMath.normalize(px);
      if (pxLength2 > 1.0e-3) {
        foundPlaneVector = true;
      }
    }

    if (!foundPlaneVector) {
      axis[0] = 0.0;
      axis[1] = 0.0;
      axis[2] = 1.0;
      vtkMath.cross(n, axis, px);
      vtkMath.normalize(px);
    }

    // Create second orthogonal axis in polygon plane
    vtkMath.cross(px, n, py);

    // Generate polygon points
    const theta = (2.0 * Math.PI) / numPts;
    const points = [];
    const r = [0, 0, 0];
    const x = [0, 0, 0];

    for (let j = 0; j < numPts; j++) {
      const cosTheta = Math.cos(j * theta);
      const sinTheta = Math.sin(j * theta);

      r[0] = px[0] * cosTheta + py[0] * sinTheta;
      r[1] = px[1] * cosTheta + py[1] * sinTheta;
      r[2] = px[2] * cosTheta + py[2] * sinTheta;

      x[0] = model.center[0] + model.radius * r[0];
      x[1] = model.center[1] + model.radius * r[1];
      x[2] = model.center[2] + model.radius * r[2];

      points.push(x[0], x[1], x[2]);
    }

    newPoints.setData(points);
    output.setPoints(newPoints);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfSides: 6,
  center: [0.0, 0.0, 0.0],
  normal: [0.0, 0.0, 1.0],
  radius: 0.5,
  generatePolygon: true,
  generatePolyline: true,
  outputPointsPrecision: DesiredOutputPrecision.FLOAT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 1);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'numberOfSides',
    'radius',
    'generatePolygon',
    'generatePolyline',
    'outputPointsPrecision',
  ]);

  macro.setGetArray(publicAPI, model, ['center', 'normal'], 3);

  vtkRegularPolygonSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRegularPolygonSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
