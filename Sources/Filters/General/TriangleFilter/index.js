import macro from 'vtk.js/Sources/macros';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTriangleFilter methods
// ----------------------------------------------------------------------------

function vtkTriangleFilter(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkTriangleFilter');

  // requestData only supports polys for now.
  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const points = input.getPoints().getData();
    const polys = input.getPolys().getData();
    const cellsDataType = input.getPolys().getDataType();
    const pointsDataType = input.getPoints().getDataType();
    // Todo: instantiate TypedArray of the final size
    const newCells = [];
    const newPoints = [];

    model.errorCount = 0;

    if (polys) {
      let npts = 0;
      let isLastPointDuplicated = false;
      for (let c = 0; c < polys.length; c += npts + 1) {
        npts = polys[c];
        // If the first point is duplicated at the end of the cell, ignore it
        isLastPointDuplicated = polys[c + 1] === polys[c + npts];
        if (isLastPointDuplicated) {
          --npts;
        }

        // We can't use cell.map here, it doesn't seems to work properly with Uint32Arrays ...
        const cellPoints = [];
        cellPoints.length = npts;
        for (let i = 0; i < npts; i++) {
          const pointId = polys[c + i + 1];
          cellPoints[i] = [
            points[3 * pointId],
            points[3 * pointId + 1],
            points[3 * pointId + 2],
          ];
        }

        if (npts === 3) {
          const newIdStart = newPoints.length / 3;
          newCells.push(3, newIdStart, newIdStart + 1, newIdStart + 2);
          newPoints.push(...cellPoints[0], ...cellPoints[1], ...cellPoints[2]);
        } else if (npts > 3) {
          const polygon = vtkPolygon.newInstance();
          polygon.setPoints(cellPoints);

          if (!polygon.triangulate()) {
            vtkWarningMacro(`Triangulation failed at cellOffset ${c}`);
            ++model.errorCount;
          }

          const newCellPoints = polygon.getPointArray();
          const numSimplices = Math.floor(newCellPoints.length / 9);
          const triPts = [];
          triPts.length = 9;
          for (let i = 0; i < numSimplices; i++) {
            for (let j = 0; j < 9; j++) {
              triPts[j] = newCellPoints[9 * i + j];
            }
            const newIdStart = newPoints.length / 3;
            newCells.push(3, newIdStart, newIdStart + 1, newIdStart + 2);
            newPoints.push(...triPts);
          }
        }
        if (isLastPointDuplicated) {
          ++npts;
        }
      }
    }

    const dataset = vtkPolyData.newInstance();
    dataset
      .getPoints()
      .setData(macro.newTypedArrayFrom(pointsDataType, newPoints));
    dataset
      .getPolys()
      .setData(macro.newTypedArrayFrom(cellsDataType, newCells));

    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  errorCount: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, []);
  macro.get(publicAPI, model, ['errorCount']);

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

export default { newInstance, extend };
