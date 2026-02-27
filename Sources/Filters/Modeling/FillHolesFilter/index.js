import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';
import vtkTriangleStrip from 'vtk.js/Sources/Common/DataModel/TriangleStrip';

// ----------------------------------------------------------------------------
// vtkFillHolesFilter methods
// ----------------------------------------------------------------------------

function vtkFillHolesFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFillHolesFilter');

  function getSingleLineNeighbor(linesPolyData, currentCellId, pointId) {
    const pointCells = linesPolyData.getPointCells(pointId);
    let neighborId = -1;
    let neighborCount = 0;
    for (let i = 0; i < pointCells.length; i++) {
      const cellId = pointCells[i];
      if (cellId !== currentCellId) {
        neighborId = cellId;
        neighborCount += 1;
        if (neighborCount > 1) {
          return -2;
        }
      }
    }
    return neighborId;
  }

  function mapTriangulatedPointToLocalId(pointToLocalIds, x, y, z) {
    const key = `${x},${y},${z}`;
    const ids = pointToLocalIds.get(key);
    if (!ids || ids.length === 0) {
      return -1;
    }
    return ids[0];
  }

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    if (!input) {
      outData[0] = output;
      return;
    }

    const inPts = input.getPoints();
    const inPolys = input.getPolys();
    const numPts = inPts?.getNumberOfPoints();
    const numPolys = inPolys?.getNumberOfCells();
    const inStrips = input.getStrips();
    const numStrips = inStrips?.getNumberOfCells();

    if (numPts < 1 || !inPts || (numPolys < 1 && numStrips < 1)) {
      outData[0] = input;
      return;
    }

    const mesh = vtkPolyData.newInstance();
    mesh.setPoints(inPts);

    let polysForConnectivity = inPolys;
    if (numStrips > 0) {
      const decomposedPolys = vtkCellArray.newInstance();
      if (numPolys > 0) {
        decomposedPolys.deepCopy(inPolys);
      }

      const stripValues = inStrips.getData();
      const stripPtIds = [];
      let offset = 0;
      while (offset < stripValues.length) {
        const npts = stripValues[offset];
        stripPtIds.length = npts;
        for (let i = 0; i < npts; i++) {
          stripPtIds[i] = stripValues[offset + 1 + i];
        }
        vtkTriangleStrip.decomposeStrip(stripPtIds, decomposedPolys);
        offset += npts + 1;
      }
      polysForConnectivity = decomposedPolys;
    }

    mesh.setPolys(polysForConnectivity);
    mesh.buildLinks();

    // Allocate storage for lines/points (arbitrary allocation sizes).
    const newLines = vtkCellArray.newInstance();
    const polyValues = polysForConnectivity.getData();
    const edgePtIds = [0, 0];
    let polyOffset = 0;
    let cellId = 0;
    // Grab all free edges and place them into a temporary polydata.
    while (polyOffset < polyValues.length) {
      const npts = polyValues[polyOffset];
      const polyPtsOffset = polyOffset + 1;
      for (let i = 0; i < npts; i++) {
        const p1 = polyValues[polyPtsOffset + i];
        const p2 = polyValues[polyPtsOffset + ((i + 1) % npts)];
        const neighbors = mesh.getCellEdgeNeighbors(cellId, p1, p2);
        if (neighbors.length < 1) {
          edgePtIds[0] = p1;
          edgePtIds[1] = p2;
          newLines.insertNextCell(edgePtIds);
        }
      }

      polyOffset += npts + 1;
      cellId++;
    }

    const numLines = newLines.getNumberOfCells();
    let newCells = null;

    // Track all free edges and see whether polygons can be built from them.
    // For each polygon of appropriate HoleSize, triangulate the hole and
    // add to the output list of cells.
    if (numLines >= 3) {
      newCells = vtkCellArray.newInstance();
      newCells.deepCopy(inPolys);

      const linesPolyData = vtkPolyData.newInstance();
      linesPolyData.setPoints(inPts);
      linesPolyData.setLines(newLines);
      linesPolyData.buildLinks();

      const visited = new Uint8Array(numLines);
      for (let lineCellId = 0; lineCellId < numLines; lineCellId++) {
        if (visited[lineCellId] === 0) {
          visited[lineCellId] = 1;

          // Setup the polygon.
          const linePts = linesPolyData.getCellPoints(lineCellId).cellPointIds;
          const startId = linePts[0];
          const polygonPtIds = [startId];
          const polygonPts = [inPts.getPoint(startId)];
          let endId = linePts[1];
          let currentCellId = lineCellId;
          let valid = true;

          // Work around the loop and terminate when the loop ends.
          while (startId !== endId && valid) {
            polygonPtIds.push(endId);
            polygonPts.push(inPts.getPoint(endId));
            const neighborId = getSingleLineNeighbor(
              linesPolyData,
              currentCellId,
              endId
            );
            if (neighborId === -1) {
              valid = false;
            } else if (neighborId === -2) {
              // Have to logically split this vertex.
              valid = false;
            } else {
              visited[neighborId] = 1;
              const neiPts =
                linesPolyData.getCellPoints(neighborId).cellPointIds;
              endId = neiPts[0] !== endId ? neiPts[0] : neiPts[1];
              currentCellId = neighborId;
            }
          }

          // Evaluate the size of the loop and see if it is small enough.
          if (valid) {
            const flatPts = polygonPts.flat();
            const sphere = vtkSphere.computeBoundingSphere(flatPts);
            const holeSize = Number.isFinite(model.holeSize)
              ? Math.max(0, model.holeSize)
              : 0;

            if (sphere[3] <= holeSize) {
              // Now triangulate the loop and pass to the output.
              const polygon = vtkPolygon.newInstance();
              polygon.setPoints(polygonPts);
              if (polygon.triangulate()) {
                const triangles = polygon.getPointArray();
                const pointToLocalIds = new Map();
                for (let i = 0; i < polygonPts.length; i++) {
                  const pt = polygonPts[i];
                  const key = `${pt[0]},${pt[1]},${pt[2]}`;
                  if (!pointToLocalIds.has(key)) {
                    pointToLocalIds.set(key, []);
                  }
                  pointToLocalIds.get(key).push(i);
                }

                const trianglePtIds = [0, 0, 0];
                for (let i = 0; i < triangles.length; i += 9) {
                  const localId0 = mapTriangulatedPointToLocalId(
                    pointToLocalIds,
                    triangles[i],
                    triangles[i + 1],
                    triangles[i + 2]
                  );
                  const localId1 = mapTriangulatedPointToLocalId(
                    pointToLocalIds,
                    triangles[i + 3],
                    triangles[i + 4],
                    triangles[i + 5]
                  );
                  const localId2 = mapTriangulatedPointToLocalId(
                    pointToLocalIds,
                    triangles[i + 6],
                    triangles[i + 7],
                    triangles[i + 8]
                  );

                  if (
                    localId0 >= 0 &&
                    localId1 >= 0 &&
                    localId2 >= 0 &&
                    localId0 !== localId1 &&
                    localId1 !== localId2 &&
                    localId2 !== localId0
                  ) {
                    trianglePtIds[0] = polygonPtIds[localId0];
                    trianglePtIds[1] = polygonPtIds[localId1];
                    trianglePtIds[2] = polygonPtIds[localId2];
                    newCells.insertNextCell(trianglePtIds);
                  }
                }
              }
            }
          }
        }
      }
    }

    // No new points are created, so the points and point data can be passed
    // through to the output.
    output.setPoints(inPts);
    output.getPointData().passData(input.getPointData());

    // New cells are created, so we do not pass cell data.
    output.setVerts(input.getVerts());
    output.setLines(input.getLines());
    if (newCells) {
      output.setPolys(newCells);
    } else {
      output.setPolys(inPolys);
    }
    output.setStrips(input.getStrips());

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  holeSize: 1.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['holeSize']);

  // Object specific methods
  vtkFillHolesFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFillHolesFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
