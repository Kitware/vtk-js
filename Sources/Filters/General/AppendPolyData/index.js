import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;

function offsetCellArray(typedArray, offset) {
  let currentIdx = 0;
  return typedArray.map((value, index) => {
    if (index === currentIdx) {
      currentIdx += value + 1;
      return value;
    }
    return value + offset;
  });
}

function appendCellData(dest, src, ptOffset, cellOffset) {
  dest.set(offsetCellArray(src, ptOffset), cellOffset);
}

// ----------------------------------------------------------------------------
// vtkAppendPolyData methods
// ----------------------------------------------------------------------------

function vtkAppendPolyData(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkAppendPolyData');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const numberOfInputs = publicAPI.getNumberOfInputPorts();
    if (!numberOfInputs) {
      vtkErrorMacro('No input specified.');
      return;
    }

    if (numberOfInputs === 1) {
      // pass through filter
      outData[0] = inData[0];
      return;
    }

    // Allocate output
    const output = vtkPolyData.newInstance();

    let numPts = 0;
    let pointType = 0;
    let ttype = 1;
    let firstType = 1;
    let numVerts = 0;
    let numLines = 0;
    let numStrips = 0;
    let numPolys = 0;

    // Field data is propogated to output only if present in all inputs
    let hasPtNormals = true; // assume present by default
    let hasPtTCoords = true;
    let hasPtScalars = true;

    for (let i = 0; i < numberOfInputs; i++) {
      const ds = inData[i];
      if (!ds) {
        vtkErrorMacro('Invalid or missing input');
        return;
      }
      const dsNumPts = ds.getPoints().getNumberOfPoints();
      numPts += dsNumPts;
      numVerts += ds.getVerts().getNumberOfValues();
      numLines += ds.getLines().getNumberOfValues();
      numStrips += ds.getStrips().getNumberOfValues();
      numPolys += ds.getPolys().getNumberOfValues();

      if (dsNumPts) {
        if (firstType) {
          firstType = 0;
          pointType = ds.getPoints().getDataType();
        }
        ttype = ds.getPoints().getDataType();
        pointType = pointType > ttype ? pointType : ttype;
      }

      const ptD = ds.getPointData();
      if (ptD) {
        hasPtNormals = hasPtNormals && ptD.getNormals() !== null;
        hasPtTCoords = hasPtTCoords && ptD.getTCoords() !== null;
        hasPtScalars = hasPtScalars && ptD.getScalars() !== null;
      } else {
        hasPtNormals = false;
        hasPtTCoords = false;
        hasPtScalars = false;
      }
    }

    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }

    const points = vtkPoints.newInstance({ dataType: pointType });
    points.setNumberOfPoints(numPts);
    const pointData = points.getData();

    const vertData = new Uint32Array(numVerts);
    const lineData = new Uint32Array(numLines);
    const stripData = new Uint32Array(numStrips);
    const polyData = new Uint32Array(numPolys);

    let newPtNormals = null;
    let newPtTCoords = null;
    let newPtScalars = null;

    const lds = inData[numberOfInputs - 1];
    if (hasPtNormals) {
      const dsNormals = lds.getPointData().getNormals();
      newPtNormals = vtkDataArray.newInstance({
        numberOfComponents: 3,
        numberOfTuples: numPts,
        size: 3 * numPts,
        dataType: dsNormals.getDataType(),
        name: dsNormals.getName(),
      });
    }
    if (hasPtTCoords) {
      const dsTCoords = lds.getPointData().getTCoords();
      newPtTCoords = vtkDataArray.newInstance({
        numberOfComponents: 2,
        numberOfTuples: numPts,
        size: 2 * numPts,
        dataType: dsTCoords.getDataType(),
        name: dsTCoords.getName(),
      });
    }
    if (hasPtScalars) {
      const dsScalars = lds.getPointData().getScalars();
      newPtScalars = vtkDataArray.newInstance({
        numberOfComponents: dsScalars.getNumberOfComponents(),
        numberOfTuples: numPts,
        size: numPts * dsScalars.getNumberOfComponents(),
        dataType: dsScalars.getDataType(),
        name: dsScalars.getName(),
      });
    }

    numPts = 0;
    numVerts = 0;
    numLines = 0;
    numStrips = 0;
    numPolys = 0;
    for (let i = 0; i < numberOfInputs; i++) {
      const ds = inData[i];
      pointData.set(ds.getPoints().getData(), numPts * 3);
      appendCellData(vertData, ds.getVerts().getData(), numPts, numVerts);
      numVerts += ds.getVerts().getNumberOfValues();
      appendCellData(lineData, ds.getLines().getData(), numPts, numLines);
      numLines += ds.getLines().getNumberOfValues();
      appendCellData(stripData, ds.getStrips().getData(), numPts, numStrips);
      numStrips += ds.getStrips().getNumberOfValues();
      appendCellData(polyData, ds.getPolys().getData(), numPts, numPolys);
      numPolys += ds.getPolys().getNumberOfValues();

      const dsPD = ds.getPointData();
      if (hasPtNormals) {
        const ptNorms = dsPD.getNormals();
        newPtNormals.getData().set(ptNorms.getData(), numPts * 3);
      }
      if (hasPtTCoords) {
        const ptTCoords = dsPD.getTCoords();
        newPtTCoords.getData().set(ptTCoords.getData(), numPts * 2);
      }
      if (hasPtScalars) {
        const ptScalars = dsPD.getScalars();
        newPtScalars
          .getData()
          .set(
            ptScalars.getData(),
            numPts * newPtScalars.getNumberOfComponents()
          );
      }

      numPts += ds.getPoints().getNumberOfPoints();
    }

    output.setPoints(points);
    output.getVerts().setData(vertData);
    output.getLines().setData(lineData);
    output.getStrips().setData(stripData);
    output.getPolys().setData(polyData);
    if (newPtNormals) {
      output.getPointData().setNormals(newPtNormals);
    }
    if (newPtTCoords) {
      output.getPointData().setTCoords(newPtTCoords);
    }
    if (newPtScalars) {
      output.getPointData().setScalars(newPtScalars);
    }
    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, ['outputPointsPrecision']);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkAppendPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAppendPolyData');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
