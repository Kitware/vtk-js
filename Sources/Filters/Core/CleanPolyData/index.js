import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkPointLocator from 'vtk.js/Sources/Common/DataModel/PointLocator';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData/index';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// ----------------------------------------------------------------------------
// vtkCleanPolyData methods
// ----------------------------------------------------------------------------

function vtkCleanPolyData(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkCleanPolyData');

  const tempX = [];

  // Point processing
  function processPoint(
    ptId,
    inPts,
    newPts,
    inputPD,
    outputPD,
    pointMap,
    numUsedPts
  ) {
    const newX = [0, 0, 0];

    inPts.getPoint(ptId, tempX);
    publicAPI.operateOnPoint(tempX, newX);

    if (!model.pointMerging) {
      if (pointMap[ptId] === -1) {
        pointMap[ptId] = numUsedPts.value++;
        newPts.setPoint(pointMap[ptId], newX);
        outputPD.passData(inputPD, ptId, pointMap[ptId]);
      }
      return pointMap[ptId];
    }
    const newPtId = model._locator.insertUniquePoint(newX).id;
    if (!model.copiedPoints.has(newPtId)) {
      model.copiedPoints.add(newPtId);
      outputPD.passData(inputPD, ptId, newPtId);
    }
    return newPtId;
  }

  publicAPI.operateOnPoint = (inPt, outPt) => {
    outPt[0] = inPt[0];
    outPt[1] = inPt[1];
    outPt[2] = inPt[2];
  };

  publicAPI.operateOnBounds = (inBounds, outBounds) => {
    vtkBoundingBox.setBounds(outBounds, inBounds);
  };

  publicAPI.createDefaultLocator = (input) => {
    let tol;
    if (model.toleranceIsAbsolute) {
      tol = model.absoluteTolerance;
    } else if (input) {
      tol = model.tolerance * input.getLength();
    } else {
      tol = model.tolerance;
    }

    if (!model._locator) {
      model._locator =
        tol === 0.0
          ? vtkMergePoints.newInstance()
          : vtkPointLocator.newInstance();
      return;
    }

    if (tol === 0.0 && model._locator?.getTolerance() !== 0.0) {
      model._locator = vtkMergePoints.newInstance();
    } else if (tol > 0.0 && !(model._locator?.getTolerance() > 0.0)) {
      model._locator = vtkPointLocator.newInstance();
    }
  };

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();
    outData[0] = output;

    const inPts = input.getPoints();
    const numPts = input.getNumberOfPoints();

    if (!inPts || numPts < 1) {
      return;
    }

    const updatedPts = new Array(input.getMaxCellSize());
    const numUsedPts = { value: 0 };

    const precision = model.outputPointsPrecision;
    let pointType = inPts.getDataType();
    if (precision) {
      pointType =
        precision === DesiredOutputPrecision.DOUBLE
          ? VtkDataTypes.DOUBLE
          : VtkDataTypes.FLOAT;
    }
    const newPts = vtkPoints.newInstance({ dataType: pointType });
    const inVerts = input.getVerts();
    const inLines = input.getLines();
    const inPolys = input.getPolys();
    const inStrips = input.getStrips();

    let newVerts = null;
    let newLines = null;
    let newPolys = null;
    let newStrips = null;

    const inputPD = input.getPointData();
    const inputCD = input.getCellData();
    const outputPD = output.getPointData();
    const outputCD = output.getCellData();

    let pointMap = null;
    if (model.pointMerging) {
      publicAPI.createDefaultLocator(input);

      if (model.toleranceIsAbsolute) {
        model._locator.setTolerance(model.absoluteTolerance);
      } else {
        model._locator.setTolerance(model.tolerance * input.getLength());
      }

      const originalBounds = input.getBounds();
      const mappedBounds = [];
      publicAPI.operateOnBounds(originalBounds, mappedBounds);
      model._locator.initPointInsertion(newPts, mappedBounds);
    } else {
      pointMap = new Array(numPts).fill(-1);
    }

    // Copy data attributes setup
    outputPD.copyStructure(inputPD);
    outputCD.copyStructure(inputCD);

    model.copiedPoints.clear();

    let outLineData = null;
    let outPolyData = null;
    let outStrpData = null;
    let vertIDcounter = 0;
    let lineIDcounter = 0;
    let polyIDcounter = 0;
    let strpIDcounter = 0;

    // Process vertices
    let inCellID = 0;
    if (inVerts && inVerts.getNumberOfCells() > 0) {
      newVerts = vtkCellArray.newInstance();

      let currentIdx = 0;
      const cellData = inVerts.getData();
      while (currentIdx < cellData.length) {
        const npts = cellData[currentIdx++];
        const inputPointIds = cellData.slice(currentIdx, currentIdx + npts);
        currentIdx += npts;

        let numNewPts = 0;

        for (let i = 0; i < inputPointIds.length; i++) {
          const ptId = inputPointIds[i];
          const newPtId = processPoint(
            ptId,
            inPts,
            newPts,
            inputPD,
            outputPD,
            pointMap,
            numUsedPts
          );
          updatedPts[numNewPts++] = newPtId;
        }

        if (numNewPts > 0) {
          newVerts.insertNextCell(updatedPts.slice(0, numNewPts));
          outputCD.passData(inputCD, inCellID, vertIDcounter);
          vertIDcounter++;
        }
        inCellID++;
      }
    }

    // Process lines
    if (inLines && inLines.getNumberOfCells() > 0) {
      newLines = vtkCellArray.newInstance();

      let currentIdx = 0;
      const cellData = inLines.getData();
      while (currentIdx < cellData.length) {
        const npts = cellData[currentIdx++];
        const inputPointIds = cellData.slice(currentIdx, currentIdx + npts);
        currentIdx += npts;

        let numNewPts = 0;

        for (let i = 0; i < inputPointIds.length; i++) {
          const ptId = inputPointIds[i];
          const newPtId = processPoint(
            ptId,
            inPts,
            newPts,
            inputPD,
            outputPD,
            pointMap,
            numUsedPts
          );

          if (i === 0 || newPtId !== updatedPts[numNewPts - 1]) {
            updatedPts[numNewPts++] = newPtId;
          }
        }

        if (numNewPts >= 2) {
          newLines.insertNextCell(updatedPts.slice(0, numNewPts));
          if (!outLineData) {
            outLineData = [];
          }
          outLineData.push({ inputId: inCellID, outputId: lineIDcounter });
          lineIDcounter++;
        } else if (
          numNewPts === 1 &&
          (inputPointIds.length === numNewPts || model.convertLinesToPoints)
        ) {
          if (!newVerts) {
            newVerts = vtkCellArray.newInstance();
          }
          newVerts.insertNextCell(updatedPts.slice(0, numNewPts));
          outputCD.passData(inputCD, inCellID, vertIDcounter);
          vertIDcounter++;
        }
        inCellID++;
      }
    }

    // Process polygons
    if (inPolys && inPolys.getNumberOfCells() > 0) {
      newPolys = vtkCellArray.newInstance();

      let currentIdx = 0;
      const cellData = inPolys.getData();
      while (currentIdx < cellData.length) {
        const npts = cellData[currentIdx++];
        const inputPointIds = cellData.slice(currentIdx, currentIdx + npts);
        currentIdx += npts;

        let numNewPts = 0;

        for (let i = 0; i < inputPointIds.length; i++) {
          const ptId = inputPointIds[i];
          const newPtId = processPoint(
            ptId,
            inPts,
            newPts,
            inputPD,
            outputPD,
            pointMap,
            numUsedPts
          );

          if (i === 0 || newPtId !== updatedPts[numNewPts - 1]) {
            updatedPts[numNewPts++] = newPtId;
          }
        }

        // Remove duplicate last point if it matches first
        if (numNewPts > 2 && updatedPts[0] === updatedPts[numNewPts - 1]) {
          numNewPts--;
        }

        if (numNewPts > 2) {
          newPolys.insertNextCell(updatedPts.slice(0, numNewPts));
          if (!outPolyData) {
            outPolyData = [];
          }
          outPolyData.push({ inputId: inCellID, outputId: polyIDcounter });
          polyIDcounter++;
        } else if (
          numNewPts === 2 &&
          (inputPointIds.length === numNewPts || model.convertPolysToLines)
        ) {
          if (!newLines) {
            newLines = vtkCellArray.newInstance();
            outLineData = [];
          }
          newLines.insertNextCell(updatedPts.slice(0, numNewPts));
          outLineData.push({ inputId: inCellID, outputId: lineIDcounter });
          lineIDcounter++;
        } else if (
          numNewPts === 1 &&
          (inputPointIds.length === numNewPts || model.convertLinesToPoints)
        ) {
          if (!newVerts) {
            newVerts = vtkCellArray.newInstance();
          }
          newVerts.insertNextCell(updatedPts.slice(0, numNewPts));
          outputCD.passData(inputCD, inCellID, vertIDcounter);
          vertIDcounter++;
        }
        inCellID++;
      }
    }

    // Process triangle strips
    if (inStrips && inStrips.getNumberOfCells() > 0) {
      newStrips = vtkCellArray.newInstance();

      let currentIdx = 0;
      const cellData = inStrips.getData();
      while (currentIdx < cellData.length) {
        const npts = cellData[currentIdx++];
        const inputPointIds = cellData.slice(currentIdx, currentIdx + npts);
        currentIdx += npts;

        let numNewPts = 0;

        for (let i = 0; i < inputPointIds.length; i++) {
          const ptId = inputPointIds[i];
          const newPtId = processPoint(
            ptId,
            inPts,
            newPts,
            inputPD,
            outputPD,
            pointMap,
            numUsedPts
          );

          if (i === 0 || newPtId !== updatedPts[numNewPts - 1]) {
            updatedPts[numNewPts++] = newPtId;
          }
        }

        // Remove duplicate last point if it matches first
        if (numNewPts > 1 && updatedPts[0] === updatedPts[numNewPts - 1]) {
          numNewPts--;
        }

        if (numNewPts > 3) {
          newStrips.insertNextCell(updatedPts.slice(0, numNewPts));
          if (!outStrpData) {
            outStrpData = [];
          }
          outStrpData.push({ inputId: inCellID, outputId: strpIDcounter });
          strpIDcounter++;
        } else if (
          numNewPts === 3 &&
          (inputPointIds.length === numNewPts || model.convertStripsToPolys)
        ) {
          if (!newPolys) {
            newPolys = vtkCellArray.newInstance();
            outPolyData = [];
          }
          newPolys.insertNextCell(updatedPts.slice(0, numNewPts));
          outPolyData.push({ inputId: inCellID, outputId: polyIDcounter });
          polyIDcounter++;
        } else if (
          numNewPts === 2 &&
          (inputPointIds.length === numNewPts || model.convertPolysToLines)
        ) {
          if (!newLines) {
            newLines = vtkCellArray.newInstance();
            outLineData = [];
          }
          newLines.insertNextCell(updatedPts.slice(0, numNewPts));
          outLineData.push({ inputId: inCellID, outputId: lineIDcounter });
          lineIDcounter++;
        } else if (
          numNewPts === 1 &&
          (inputPointIds.length === numNewPts || model.convertLinesToPoints)
        ) {
          if (!newVerts) {
            newVerts = vtkCellArray.newInstance();
          }
          newVerts.insertNextCell(updatedPts.slice(0, numNewPts));
          outputCD.passData(inputCD, inCellID, vertIDcounter);
          vertIDcounter++;
        }
        inCellID++;
      }
    }

    // Clean up
    if (model.pointMerging) {
      model._locator.initialize();
    } else {
      newPts.setNumberOfPoints(numUsedPts.value);
    }

    // Copy cell data in correct order
    let combinedCellID = vertIDcounter;

    if (outLineData) {
      outLineData.forEach((item) => {
        outputCD.passData(inputCD, item.inputId, combinedCellID);
        combinedCellID++;
      });
    }

    if (outPolyData) {
      outPolyData.forEach((item) => {
        outputCD.passData(inputCD, item.inputId, combinedCellID);
        combinedCellID++;
      });
    }

    if (outStrpData) {
      outStrpData.forEach((item) => {
        outputCD.passData(inputCD, item.inputId, combinedCellID);
        combinedCellID++;
      });
    }

    // Set output
    output.setPoints(newPts);
    if (newVerts) output.setVerts(newVerts);
    if (newLines) output.setLines(newLines);
    if (newPolys) output.setPolys(newPolys);
    if (newStrips) output.setStrips(newStrips);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pointMerging: true,
  toleranceIsAbsolute: false,
  tolerance: 0.0,
  absoluteTolerance: 1.0,
  convertLinesToPoints: true,
  convertPolysToLines: true,
  convertStripsToPolys: true,
  locator: null,
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Generate macros for properties
  macro.setGet(publicAPI, model, [
    'pointMerging',
    'toleranceIsAbsolute',
    'tolerance',
    'absoluteTolerance',
    'convertPolysToLines',
    'convertLinesToPoints',
    'convertStripsToPolys',
    'outputPointsPrecision',
  ]);

  // Internal state
  model.copiedPoints = new Set();

  // Object methods
  vtkCleanPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCleanPolyData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
