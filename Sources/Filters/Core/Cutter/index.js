import macro        from 'vtk.js/Sources/macro';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints    from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData  from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkCutter methods
// ----------------------------------------------------------------------------

function vtkCutter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCutter');

  function dataSetCutter(input, output) {
    const numCells = input.getNumberOfCells();
    const numPts = input.getPoints().getNumberOfPoints();
    const points = input.getPoints();
    const newPoints = vtkPoints.newInstance();
    newPoints.setNumberOfComponents(3);
    const newPointsData = [];
    const newLinesData = [];
    const newLines = vtkCellArray.newInstance();
    const cutScalars = vtkDataArray.newInstance({
      numberOfComponents: 1,
      size: numPts,
      values: new Array(numPts),
    });

    // Loop over all points evaluating scalar function at each point
    for (let i = 0; i < numPts; i++) {
      const s = model.cutFunction.evaluateFunction(input.getPoints().getPoint(i));
      cutScalars.setComponent(i, 0, s);
    }

    const dataCell = input.getPolys().getData();
    const crossedEdges = [];
    // Loop over all cells; get scalar values for all cell points
    // and process each cell.
    for (let cellId = 0; cellId < numCells; cellId++) {
      const nbPointsInCell = dataCell[0];
      // Check that cells have at least 3 points
      if (nbPointsInCell > 2) {
        // Get ids of points that constitute the current cell and its assotiated scalar
        const cellPointsID = [];
        const cellPointsScalars = [];
        for (let pointIndex = ((nbPointsInCell + 1) * cellId) + 1;
          pointIndex < (nbPointsInCell + 1) * (cellId + 1); pointIndex++) {
          cellPointsID.push(dataCell[pointIndex]);
          const val = cutScalars.getComponent(dataCell[pointIndex], 0);
          cellPointsScalars.push(val);
        }

        // Check if all cell points are on same side (same side == cell not crossed by cut function)
        const sideFirstPoint = cellPointsScalars[0] > 0;
        let allPointsSameSide = true;
        for (let i = 1; i < cellPointsScalars.length; i++) {
          const sideCurrentPoint = cellPointsScalars[i] > 0;
          if (sideCurrentPoint !== sideFirstPoint) {
            allPointsSameSide = false;
            break;
          }
        }

        // Go to next cell if cell is not crossed by cut function
        if (!allPointsSameSide) {
          // Find and compute edges which intersect cells
          const intersectedEdgesList = [];
          for (let i = 0; i < cellPointsID.length; i++) {
            const idNext = i + 1 === cellPointsID.length ? 0 : i + 1;

            // Check if edge is crossed
            const signPoint0 = cellPointsScalars[i] > 0;
            const signPoint1 = cellPointsScalars[idNext] > 0;
            if (signPoint1 !== signPoint0) {
              const vert = [i, idNext];
              // Compute preferred interpolation direction
              let deltaScalar = cellPointsScalars[vert[1]] - cellPointsScalars[vert[0]];
              let e1 = vert[0];
              let e2 = vert[1];
              if (deltaScalar <= 0) {
                e1 = vert[1];
                e2 = vert[0];
                deltaScalar *= -1;
              }

              // linear interpolation
              let t = 0.0;
              if (deltaScalar !== 0.0) {
                t = (model.cutValue - cellPointsScalars[e1]) / deltaScalar;
              }

              const pointID1 = cellPointsID[e1];
              const pointID2 = cellPointsID[e2];
              const x1 = [];
              const x2 = [];
              points.getPoint(pointID1, x1);
              points.getPoint(pointID2, x2);

              // Compute the intersected point on edge
              const computedIntersectedPoint = [];
              for (let j = 0; j < 3; j++) {
                computedIntersectedPoint[j] = x1[j] + (t * (x2[j] - x1[j]));
              }

              intersectedEdgesList.push({ pointEdge1: pointID1, // id of one point of the edge
                point2Edge: pointID2, // id of one point of the edge
                intersectedPoint: computedIntersectedPoint, // 3D coordinate of points that intersected edge
                newPointID: -1 }); // id of the intersected point when it will be added into vtkPoints
            } // end if signPoint1 != signPoint0
          }

          // Add points into newPointList
          for (let i = 0; i < intersectedEdgesList.length; i++) {
            const intersectedEdge = intersectedEdgesList[i];
            let alreadyAdded = false;
            for (let j = 0; j < crossedEdges.length; j++) {
              const crossedEdge = crossedEdges[j];
              const sameEdge = intersectedEdge.pointEdge1 === crossedEdge.pointEdge1 &&
                               intersectedEdge.pointEdge2 === crossedEdge.pointEdge2;
              const samePoint = intersectedEdge.intersectedPoint[0] === crossedEdge.intersectedPoint[0] &&
                                intersectedEdge.intersectedPoint[1] === crossedEdge.intersectedPoint[1] &&
                                intersectedEdge.intersectedPoint[2] === crossedEdge.intersectedPoint[2];
              if (sameEdge || samePoint) {
                alreadyAdded = true;
                intersectedEdgesList[i].newPointID = crossedEdges[j].newPointID;
                break;
              }
            }
            if (!alreadyAdded) {
              newPointsData.push(intersectedEdge.intersectedPoint[0]);
              newPointsData.push(intersectedEdge.intersectedPoint[1]);
              newPointsData.push(intersectedEdge.intersectedPoint[2]);
              intersectedEdgesList[i].newPointID = (newPointsData.length / 3) - 1;
              crossedEdges.push(intersectedEdgesList[i]);
            }
          }

          // Create lines
          for (let i = 0; i < intersectedEdgesList.length - 1; i++) {
            const intersectedEdge = intersectedEdgesList[i];
            const nextIntersectedEdge = intersectedEdgesList[i + 1];
            newLinesData.push(2); // nb components
            newLinesData.push(intersectedEdge.newPointID);
            newLinesData.push(nextIntersectedEdge.newPointID);
          }
        } // end if allPointsSameSide
      } // end if nbPointsInCell
    }

    newPoints.setData(newPointsData);
    newLines.setData(newLinesData);
    output.setPoints(newPoints);
    output.setLines(newLines);
  }

  // expose requestData
  publicAPI.requestData = (inData, outData) => { // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    if (!model.cutFunction) {
      vtkErrorMacro('Missing cut function');
      return;
    }

    const output = vtkPolyData.newInstance();

    dataSetCutter(input, output);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cutFunction: null, // support method with evaluateFunction method
  cutValue: 0.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Set implicit function use to cut the input data (is vtkPlane)
  macro.setGet(publicAPI, model, ['cutFunction', 'cutValue']);

  // Object specific methods
  vtkCutter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCutter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
