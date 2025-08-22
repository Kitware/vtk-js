import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTransformPolyDataFilter methods
// ----------------------------------------------------------------------------

function vtkTransformPolyDataFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTransformPolyDataFilter');

  // Internal method to handle the actual transformation
  function transformPolyData(input, output) {
    if (!model.transform) {
      vtkErrorMacro('No transform defined!');
      return false;
    }

    const inPts = input.getPoints();
    const inPtData = input.getPointData();
    const outPD = output.getPointData();
    const inCellData = input.getCellData();
    const outCD = output.getCellData();

    if (!inPts) {
      // Input polydata is empty. This is not an error, the output will be just empty, too.
      return true;
    }

    const numPoints = inPts.getNumberOfPoints();

    // Get input vectors and normals (points and cells)
    const inVectors = inPtData.getVectors();
    const inNormals = inPtData.getNormals();
    const inCellVectors = inCellData.getVectors();
    const inCellNormals = inCellData.getNormals();

    // Set the desired precision for the points in the output
    let pointType = inPts.getDataType();
    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }

    // Create output points with appropriate precision
    const outPts = vtkPoints.newInstance({
      dataType: pointType,
    });

    // Transform points
    const inPtsData = inPts.getData();

    outPts.setNumberOfPoints(numPoints);
    const outPtsData = outPts.getData();

    // Transform vectors if present
    let outVectors = null;
    if (inVectors) {
      outVectors = vtkDataArray.newInstance({
        name: inVectors.getName(),
        numberOfComponents: 3,
        size: numPoints * 3,
      });
    }

    // Transform normals if present
    let outNormals = null;
    if (inNormals) {
      outNormals = vtkDataArray.newInstance({
        name: inNormals.getName(),
        numberOfComponents: 3,
        size: numPoints * 3,
      });
    }

    if (inVectors || inNormals) {
      model.transform.transformPointsNormalsVectors(
        inPts,
        outPts,
        inNormals,
        outNormals,
        inVectors,
        outVectors
      );
    } else {
      model.transform.transformPoints(inPtsData, outPtsData);
    }

    // Transform cell vectors if present
    let outCellVectors = null;
    if (inCellVectors) {
      const numCells = inCellVectors.getNumberOfTuples();
      outCellVectors = vtkDataArray.newInstance({
        name: inCellVectors.getName(),
        numberOfComponents: 3,
        size: numCells * 3,
      });
      model.transform.transformVectors(inCellVectors, outCellVectors);
    }

    // Transform cell normals if present
    let outCellNormals = null;
    if (inCellNormals) {
      const numCells = inCellNormals.getNumberOfTuples();
      outCellNormals = vtkDataArray.newInstance({
        name: inCellNormals.getName(),
        numberOfComponents: 3,
        size: numCells * 3,
      });
      model.transform.transformNormals(inCellNormals, outCellNormals);
    }

    // Set output data
    output.setPoints(outPts);

    // Copy cell topology
    output.setVerts(input.getVerts());
    output.setLines(input.getLines());
    output.setPolys(input.getPolys());
    output.setStrips(input.getStrips());

    // Set transformed point data
    if (outNormals) {
      outPD.setNormals(outNormals);
      outPD.copyFieldOff(outNormals.getName());
    }
    if (outVectors) {
      outPD.setVectors(outVectors);
      outPD.copyFieldOff(outVectors.getName());
    }

    // Set transformed cell data
    if (outCellNormals) {
      outCD.setNormals(outCellNormals);
      outCD.copyFieldOff(outCellNormals.getName());
    }
    if (outCellVectors) {
      outCD.setVectors(outCellVectors);
      outCD.copyFieldOff(outCellVectors.getName());
    }

    // Pass through other data
    outPD.passData(inPtData);
    outCD.passData(inCellData);

    return true;
  }

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    if (transformPolyData(input, output)) {
      outData[0] = output;
    } else {
      vtkErrorMacro('TransformPolyDataFilter failed to transform input data.');
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  transform: null,
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Set/Get methods
  macro.setGet(publicAPI, model, ['transform', 'outputPointsPrecision']);

  // Object specific methods
  vtkTransformPolyDataFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTransformPolyDataFilter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
