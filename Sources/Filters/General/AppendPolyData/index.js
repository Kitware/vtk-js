import macro            from 'vtk.js/Sources/macro';
import vtkPoints        from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData      from 'vtk.js/Sources/Common/DataModel/PolyData';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;

export const PointPrecision = {
  DEFAULT: 0, // use the point type that does not truncate any data
  SINGLE: 1,  // use Float32Array
  DOUBLE: 2,  // use Float64Array
};

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

  publicAPI.requestData = (inData, outData) => { // implement requestData
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
    }

    if (model.outputPointsPrecision === PointPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === PointPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }

    const points = vtkPoints.newInstance({ dataType: pointType });
    points.setNumberOfPoints(numPts);
    const pointData = points.getData();

    const vertData = new Uint32Array(numVerts);
    const lineData = new Uint32Array(numLines);
    const stripData = new Uint32Array(numStrips);
    const polyData = new Uint32Array(numPolys);

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
      appendCellData(vertData, ds.getLines().getData(), numPts, numLines);
      numLines += ds.getLines().getNumberOfValues();
      appendCellData(stripData, ds.getStrips().getData(), numPts, numStrips);
      numStrips += ds.getStrips().getNumberOfValues();
      appendCellData(polyData, ds.getPolys().getData(), numPts, numPolys);
      numPolys += ds.getPolys().getNumberOfValues();
      numPts += ds.getPoints().getNumberOfPoints();
    }

    output.setPoints(points);
    output.getVerts().setData(vertData);
    output.getLines().setData(lineData);
    output.getStrips().setData(stripData);
    output.getPolys().setData(polyData);
    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  outputPointsPrecision: PointPrecision.DEFAULT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);


  // Build VTK API
  macro.setGet(publicAPI, model, [
    'outputPointsPrecision',
  ]);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 2, 1);

  // Object specific methods
  vtkAppendPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAppendPolyData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
