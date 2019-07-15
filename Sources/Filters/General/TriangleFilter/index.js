import macro from 'vtk.js/Sources/macro';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// vtkTriangleFilter methods
// ----------------------------------------------------------------------------

function vtkTriangleFilter(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkTriangleFilter');

  // requestData only supports polys for now.
  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const polys = input.getPolys();
    const points = input.getPoints().getData();
    const cells = polys.getData();
    let newCells = [];
    let newPoints = [];

    if (cells && cells.length > 0) {
      let cellOffset = 0;
      while (cellOffset < cells.length - 1) {
        const npts = cells[cellOffset] - 1;
        const cell = cells.slice(1 + cellOffset, 2 + cellOffset + npts);
        // We can't use cell.map here, it doesn't seems to work properly with Uint32Arrays ...
        const cellPoints = [];
        for (let i = 0; i < npts; i++) {
          cellPoints.push([
            points[3 * cell[i] + 0],
            points[3 * cell[i] + 1],
            points[3 * cell[i] + 2],
          ]);
        }

        if (npts === 3) {
          const newIdStart = newPoints.length;
          newCells = newCells.concat([
            3,
            newIdStart,
            newIdStart + 1,
            newIdStart + 2,
          ]);
          newPoints = newPoints.concat([
            ...cellPoints[0],
            ...cellPoints[1],
            ...cellPoints[2],
          ]);
        } else if (npts > 3) {
          const polygon = vtkPolygon.newInstance();
          polygon.setPoints(cellPoints);

          if (!polygon.triangulate()) {
            console.log('triangulation failed!');
          }

          const newCellPoints = polygon.getPointArray();
          const numSimplices = Math.floor(newCellPoints.length / 9);
          for (let i = 0; i < numSimplices; i++) {
            const triPts = [];
            for (let j = 0; j < 9; j++) {
              triPts.push(newCellPoints[9 * i + j]);
            }
            const newIdStart = newPoints.length / 3;
            newCells = newCells.concat([
              3,
              newIdStart,
              newIdStart + 1,
              newIdStart + 2,
            ]);
            newPoints = newPoints.concat(triPts);
          }
        }

        cellOffset += 1 + npts;
      }
    }

    const dataset = vtkPolyData.newInstance();
    dataset.getPoints().setData(newPoints);
    dataset.getPolys().setData(newCells);

    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, []);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkTriangleFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTriangleFilter');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
