import macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';
import vtkIncrementalOctreePointLocator from 'vtk.js/Sources/Common/DataModel/IncrementalOctreePointLocator';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { CCS_POLYGON_TOLERANCE } from './Constants';
import { PolygonWithPointIntersectionState } from '../../../Common/DataModel/Polygon/Constants';

const { vtkErrorMacro } = macro;

/**
 * Reverse the elements between the indices firstIdx and lastIdx of the given array arr.
 *
 * @param {Array|TypedArray} arr
 * @param {Number} firstIdx
 * @param {Number} lastIdx
 */
export function reverseElements(
  arr,
  firstIdx = undefined,
  lastIdx = undefined
) {
  const first = firstIdx ?? 0;
  const last = lastIdx ?? arr.length - 1;
  const mid = first + Math.floor((last - first) / 2);
  for (let i = first; i <= mid; ++i) {
    [arr[i], arr[last - (i - first)]] = [arr[last - (i - first)], arr[i]];
  }
}

// ---------------------------------------------------
/**
 * Compute the quality of a triangle.
 *
 * @param {Vector3} p0
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {Vector3} normal
 * @returns {Number}
 */
export function vtkCCSTriangleQuality(p0, p1, p2, normal) {
  const u = [];
  const v = [];
  const w = [];

  vtkMath.subtract(p1, p0, u);
  vtkMath.subtract(p2, p1, v);
  vtkMath.subtract(p0, p2, w);

  const area2 =
    (u[1] * v[2] - u[2] * v[1]) * normal[0] +
    (u[2] * v[0] - u[0] * v[2]) * normal[1] +
    (u[0] * v[1] - u[1] * v[0]) * normal[2];

  let perim =
    Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]) +
    Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) +
    Math.sqrt(w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);

  perim *= perim; // square the perimeter
  perim = perim !== 0 ? perim : 1.0;

  // use a normalization factor so equilateral quality is 1.0
  return (area2 / perim) * 10.392304845413264;
}

// ---------------------------------------------------
/**
 * Insert a triangle, and subdivide that triangle if one of
 * its edges originally had more than two points before
 * vtkCCSFindTrueEdges was called. Is called by vtkCCSTriangulate.
 *
 * @param {vtkCellArray} polys
 * @param {Array|TypedArray} poly
 * @param {Vector3} trids
 * @param {Array|TypedArray} polyEdges
 * @param {Array|TypedArray} originalEdges
 */
export function vtkCCSInsertTriangle(
  polys,
  poly,
  trids,
  polyEdges,
  originalEdges
) {
  const nextVert = [1, 2, 0];

  // To store how many of originalEdges match
  let edgeCount = 0;
  const edgeLocs = [-1, -1, -1];

  // Check for original edge matches
  for (let vert = 0; vert < 3; vert++) {
    const currId = trids[vert];
    const edgeLoc = polyEdges[currId];
    if (edgeLoc >= 0) {
      let nextId = currId + 1;
      if (nextId === poly.length) {
        nextId = 0;
      }

      // Is the triangle edge a polygon edge?
      if (nextId === trids[nextVert[vert]]) {
        edgeLocs[vert] = edgeLoc;
        edgeCount++;
      }
    }
  }

  if (edgeCount === 0) {
    // No special edge handling, so just do one triangle
    polys.insertNextCell([poly[trids[0]], poly[trids[1]], poly[trids[2]]]);
  } else {
    // Make triangle fans for edges with extra points
    const edgePts = [
      [poly[trids[0]], poly[trids[1]]],
      [poly[trids[1]], poly[trids[2]]],
      [poly[trids[2]], poly[trids[0]]],
    ];

    // Find out which edge has the most extra points
    let maxPoints = 0;
    let currSide = 0;
    for (let i = 0; i < 3; i++) {
      if (edgeLocs[i] >= 0) {
        const edgeLoc = edgeLocs[i];
        const npts = originalEdges[edgeLoc];
        const pts = originalEdges.slice(edgeLoc + 1, edgeLoc + 1 + npts);
        if (!(edgePts[i][0] === pts[0] || edgePts[i][1] === pts[npts - 1])) {
          vtkErrorMacro('assertion error in vtkCCSInsertTriangle');
        }
        if (npts > maxPoints) {
          maxPoints = npts;
          currSide = i;
        }
        edgePts[i] = pts;
      }
    }

    // Find the edges before/after the edge with most points
    const prevSide = (currSide + 2) % 3;
    const nextSide = (currSide + 1) % 3;

    // If other edges have only 2 points, nothing to do with them
    const prevNeeded = edgePts[prevSide].length > 2;
    const nextNeeded = edgePts[nextSide].length > 2;

    // The tail is the common point in the triangle fan
    const tailPtIds = [];
    tailPtIds[prevSide] = edgePts[currSide][1];
    tailPtIds[currSide] = edgePts[prevSide][0];
    tailPtIds[nextSide] = edgePts[currSide][edgePts[currSide].length - 2];

    // Go through the sides and make the fans
    for (let side = 0; side < 3; side++) {
      if (
        (side !== prevSide || prevNeeded) &&
        (side !== nextSide || nextNeeded)
      ) {
        let m = 0;
        let n = edgePts[side].length - 1;

        if (side === currSide) {
          m += prevNeeded;
          n -= nextNeeded;
        }

        for (let k = m; k < n; k++) {
          polys.insertNextCell([
            edgePts[side][k],
            edgePts[side][k + 1],
            tailPtIds[side],
          ]);
        }
      }
    }
  }
}

// ---------------------------------------------------
/**
 * Triangulate a polygon that has been simplified by FindTrueEdges.
 * This will re-insert the original edges.  The output triangles are
 * appended to "polys" and, for each stored triangle, "color" will
 * be added to "scalars".  The final two arguments (polygon and
 * triangles) are only for temporary storage.
 * The return value is true if triangulation was successful.
 *
 * @param {Array} poly
 * @param {vtkPoints} points
 * @param {Array} polyEdges
 * @param {Array} originalEdges
 * @param {vtkCellArray} polys
 * @param {Vector3} normal
 * @returns {boolean}
 */
export function vtkCCSTriangulate(
  poly,
  points,
  polyEdges,
  originalEdges,
  polys,
  normal
) {
  let n = poly.length;

  // If the poly is a line, then skip it
  if (n < 3) {
    return true;
  }

  // If the poly is a triangle, then pass it
  if (n === 3) {
    const trids = [0, 1, 2];
    vtkCCSInsertTriangle(polys, poly, trids, polyEdges, originalEdges);
    return true;
  }

  // If the poly has 4 or more points, triangulate it
  let triangulationFailure = false;
  let ppoint = [];
  let point = [];
  let npoint = [];
  let i = 0;
  let j = 0;
  let k = 0;

  const verts = [];
  verts.length = n;

  for (i = 0; i < n; i++) {
    verts[i] = [i, 0];
  }

  // compute the triangle quality for each vert
  k = n - 2;
  points.getPoint(poly[verts[k][0]], point);
  i = n - 1;
  points.getPoint(poly[verts[i][0]], npoint);

  let concave = 0;
  let maxq = 0;
  let maxi = 0;
  for (j = 0; j < n; j++) {
    [ppoint, point, npoint] = [point, npoint, ppoint];
    points.getPoint(poly[verts[j][0]], npoint);

    const q = vtkCCSTriangleQuality(ppoint, point, npoint, normal);
    if (q > maxq) {
      maxi = i;
      maxq = q;
    }
    concave += q < 0;
    verts[i][1] = q;
    i = j;
  }

  let foundEar;
  // perform the ear-cut triangulation
  for (;;) {
    // if no potential ears were found, then fail
    if (maxq <= Number.MIN_VALUE) {
      triangulationFailure = true;
      break;
    }

    i = maxi;
    j = i + 1 !== n ? i + 1 : 0;
    k = i !== 0 ? i - 1 : n - 1;

    if (verts[i][1] > 0) {
      foundEar = true;
      points.getPoint(poly[verts[j][0]], npoint);
      points.getPoint(poly[verts[k][0]], ppoint);

      // only do ear check if there are concave vertices
      if (concave) {
        // get the normal of the split plane
        const v = [];
        const u = [];

        vtkMath.subtract(npoint, ppoint, v);
        vtkMath.cross(v, normal, u);
        const d = vtkMath.dot(ppoint, u);

        let jj = j + 1 !== n ? j + 1 : 0;
        let x = [];
        points.getPoint(poly[verts[jj][0]], x);
        let side = vtkMath.dot(x, u) < d;
        let foundNegative = side;

        // check for crossings of the split plane
        jj = jj + 1 !== n ? jj + 1 : 0;
        let y = [];
        const s = [];
        const t = [];
        for (; foundEar && jj !== k; jj = jj + 1 !== n ? jj + 1 : 0) {
          [x, y] = [y, x];
          points.getPoint(poly[verts[jj][0]], x);
          const sside = vtkMath.dot(x, u) < d;
          // XOR
          if (side ? !sside : sside) {
            side = !side;
            foundNegative = true;
            foundEar =
              vtkLine.intersection(ppoint, npoint, x, y, s, t) ===
              vtkLine.IntersectionState.NO_INTERSECTION;
          }
        }
        foundEar &&= foundNegative;
      }

      if (!foundEar) {
        // don't try again until it is split
        verts[i][1] = Number.MIN_VALUE;
      } else {
        // create a triangle from vertex and neighbors
        const trids = [verts[i][0], verts[j][0], verts[k][0]];
        vtkCCSInsertTriangle(polys, poly, trids, polyEdges, originalEdges);

        // remove the vertex i
        verts.splice(i, 1);
        k -= i === 0;
        j -= j !== 0;

        // break if this was final triangle
        if (--n < 3) {
          break;
        }

        // re-compute quality of previous point
        const kk = k !== 0 ? k - 1 : n - 1;
        points.getPoint(poly[verts[kk][0]], point);
        const kq = vtkCCSTriangleQuality(point, ppoint, npoint, normal);
        concave -= verts[k][1] < 0 && kq >= 0;
        verts[k][1] = kq;

        // re-compute quality of next point
        const jj = j + 1 !== n ? j + 1 : 0;
        points.getPoint(poly[verts[jj][0]], point);
        const jq = vtkCCSTriangleQuality(ppoint, npoint, point, normal);
        concave -= verts[j][1] < 0 && jq >= 0;
        verts[j][1] = jq;
      }
    }

    // find the highest-quality ear candidate
    maxi = 0;
    maxq = verts[0][1];
    for (i = 1; i < n; i++) {
      const q = verts[i][1];
      if (q > maxq) {
        maxi = i;
        maxq = q;
      }
    }
  }

  return !triangulationFailure;
}

// ---------------------------------------------------
/**
 * Create polygons from line segments.
 *
 * @param {vtkPolyData} polyData
 * @param {Number} firstLine
 * @param {Number} endLine
 * @param {Boolean} oriented
 * @param {Array} newPolys
 * @param {Array} incompletePolys
 */
export function vtkCCSMakePolysFromLines(
  polyData,
  firstLine,
  endLine,
  oriented,
  newPolys,
  incompletePolys
) {
  let npts = 0;
  let pts = [];

  // Bitfield for marking lines as used
  const usedLines = new Uint8Array(endLine - firstLine); // defaults to 0

  // Require cell links to get lines from pointIds
  polyData.buildLinks(polyData.getPoints().getNumberOfPoints());

  let numNewPolys = 0;
  let remainingLines = endLine - firstLine;

  while (remainingLines > 0) {
    // Create a new poly
    const polyId = numNewPolys++;
    const poly = [];
    newPolys.push(poly);

    let lineId = 0;
    let completePoly = false;

    // start the poly
    for (lineId = firstLine; lineId < endLine; lineId++) {
      if (!usedLines[lineId - firstLine]) {
        pts = polyData.getCellPoints(lineId).cellPointIds;
        npts = pts.length;

        let n = npts;
        if (npts > 2 && pts[0] === pts[npts - 1]) {
          n = npts - 1;
          completePoly = true;
        }
        poly.length = n;
        for (let i = 0; i < n; i++) {
          poly[i] = pts[i];
        }
        break;
      }
    }

    usedLines[lineId - firstLine] = 1;
    remainingLines--;

    let noLinesMatch = remainingLines === 0 && !completePoly;

    while (!completePoly && !noLinesMatch && remainingLines > 0) {
      // This is cleared if a match is found
      noLinesMatch = true;

      // Number of points in the poly
      const npoly = poly.length;

      const lineEndPts = [];
      const endPts = [poly[npoly - 1], poly[0]];

      // For both open ends of the polygon
      for (let endIdx = 0; endIdx < 2; endIdx++) {
        const matches = [];
        const cells = polyData.getPointCells(endPts[endIdx]);

        // Go through all lines that contain this endpoint
        for (let icell = 0; icell < cells.length; icell++) {
          lineId = cells[icell];
          if (
            lineId >= firstLine &&
            lineId < endLine &&
            !usedLines[lineId - firstLine]
          ) {
            pts = polyData.getCellPoints(lineId).cellPointIds;
            npts = pts.length;
            lineEndPts[0] = pts[0];
            lineEndPts[1] = pts[npts - 1];

            // Check that poly end matches line end
            if (
              endPts[endIdx] === lineEndPts[endIdx] ||
              (!oriented && endPts[endIdx] === lineEndPts[1 - endIdx])
            ) {
              matches.push(lineId);
            }
          }
        }

        if (matches.length > 0) {
          // Multiple matches mean we need to decide which path to take
          if (matches.length > 1) {
            // Remove double-backs
            let k = matches.length;
            do {
              lineId = matches[--k];
              pts = polyData.getCellPoints(lineId).cellPointIds;
              npts = pts.length;
              lineEndPts[0] = pts[0];
              lineEndPts[1] = pts[npts - 1];
              // check if line is reversed
              const r = endPts[endIdx] !== lineEndPts[endIdx];

              if (
                (!r &&
                  ((endIdx === 0 && poly[npoly - 2] === pts[1]) ||
                    (endIdx === 1 && poly[1] === pts[npts - 2]))) ||
                (r &&
                  ((endIdx === 0 && poly[npoly - 2] === pts[npts - 2]) ||
                    (endIdx === 1 && poly[1] === pts[1])))
              ) {
                matches.splice(k, 1);
              }
            } while (k > 0 && matches.length > 1);

            // If there are multiple matches due to intersections,
            // they should be dealt with here.
          }

          lineId = matches[0];
          pts = polyData.getCellPoints(lineId).cellPointIds;
          npts = pts.length;
          lineEndPts[0] = pts[0];
          lineEndPts[1] = pts[npts - 1];

          // Do both ends match?
          if (endPts[endIdx] === lineEndPts[endIdx]) {
            completePoly = endPts[1 - endIdx] === lineEndPts[1 - endIdx];
          } else {
            completePoly = endPts[1 - endIdx] === lineEndPts[endIdx];
          }

          if (endIdx === 0) {
            for (let i = 1; i < npts - (completePoly ? 1 : 0); i++) {
              poly.push(pts[i]);
            }
          } else {
            for (let i = completePoly ? 1 : 0; i < npts - 1; i++) {
              poly.unshift(pts[i]);
            }
          }

          if (endPts[endIdx] !== lineEndPts[endIdx]) {
            // reverse the ids in the added line
            let pit = poly.length;
            let ptsIt = completePoly ? 1 : 0;
            let ptsEnd = npts - 1;
            if (endIdx === 1) {
              pit = npts - 1 - (completePoly ? 1 : 0);
              ptsIt = pts + 1;
              ptsEnd = pts + npts - (completePoly ? 1 : 0);
            }
            while (ptsIt !== ptsEnd) {
              poly[--pit] = poly[ptsIt++];
            }
          }

          usedLines[lineId - firstLine] = 1;
          remainingLines--;
          noLinesMatch = false;
        }
      }
    }

    // Check for incomplete polygons
    if (noLinesMatch) {
      incompletePolys.push(polyId);
    }
  }
}

// ---------------------------------------------------
/**
 * Join polys that have loose ends, as indicated by incompletePolys.
 * Any polys created will have a normal opposite to the supplied normal,
 * and any new edges that are created will be on the hull of the point set.
 * Shorter edges will be preferred over long edges.
 *
 * @param {Array[]} polys
 * @param {Array} incompletePolys
 * @param {vtkPoints} points
 * @param {Vector3} normal
 */
export function vtkCCSJoinLooseEnds(polys, incompletePolys, points, normal) {
  // Relative tolerance for checking whether an edge is on the hull
  const tol = CCS_POLYGON_TOLERANCE;

  // A list of polys to remove when everything is done
  const removePolys = [];

  const p1 = [];
  const p2 = [];
  let poly1;
  let poly2;
  let pt1;
  let pt2;
  let dMin;
  let iMin;
  let v;
  let d;

  let n = incompletePolys.length;
  while (n !== 0) {
    poly1 = polys[incompletePolys[n - 1]];
    pt1 = poly1[poly1.length - 1];
    points.getPoint(pt1, p1);

    dMin = Number.MAX_VALUE;
    iMin = 0;

    for (let i = 0; i < n; i++) {
      poly2 = polys[incompletePolys[i]];
      pt2 = poly2[0];
      points.getPoint(pt2, p2);

      // The next few steps verify that edge [p1, p2] is on the hull
      v = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
      d = vtkMath.norm(v);
      if (d !== 0) {
        v[0] /= d;
        v[1] /= d;
        v[2] /= d;
      }

      // Compute the midpoint of the edge
      const pm = [
        0.5 * (p1[0] + p2[0]),
        0.5 * (p1[1] + p2[1]),
        0.5 * (p1[2] + p2[2]),
      ];

      // Create a plane equation
      const pc = [];
      vtkMath.cross(normal, v, pc);
      pc[3] = -vtkMath.dot(pc, pm);

      // Check that all points are inside the plane.  If they aren't, then
      // the edge is not on the hull of the pointset.
      let badPoint = false;
      const m = polys.length;
      const p = [];
      for (let j = 0; j < m && !badPoint; j++) {
        const poly = polys[j];
        const npts = poly.length;
        for (let k = 0; k < npts; k++) {
          const ptId = poly[k];
          if (ptId !== pt1 && ptId !== pt2) {
            points.getPoint(ptId, p);
            const val = p[0] * pc[0] + p[1] * pc[1] + p[2] * pc[2] + pc[3];
            const r2 = vtkMath.distance2BetweenPoints(p, pm);

            // Check distance from plane against the tolerance
            if (val < 0 && val * val > tol * tol * r2) {
              badPoint = true;
              break;
            }
          }
        }

        // If no bad points, then this edge is a candidate
        if (!badPoint && d < dMin) {
          dMin = d;
          iMin = i;
        }
      }
    }

    // If a match was found, append the polys
    if (dMin < Number.MAX_VALUE) {
      // Did the poly match with itself?
      if (iMin === n - 1) {
        // Mark the poly as closed
        incompletePolys.pop();
      } else {
        const id2 = incompletePolys[iMin];

        // Combine the polys
        // for (let i = 1; i < polys[id2].length; i++) {
        //   poly1.push(polys[id2][i]);
        // }
        poly1.push(...polys[id2]);

        // Erase the second poly
        removePolys.push(id2);
        incompletePolys.splice(iMin, 1);
      }
    } else {
      // If no match, erase this poly from consideration
      removePolys.push(incompletePolys[n - 1]);
      incompletePolys.pop();
    }
    n = incompletePolys.length;
  }

  // Remove polys that couldn't be completed
  removePolys.sort((a, b) => a - b);
  let i = removePolys.length;
  while (i > 0) {
    // Remove items in reverse order
    polys.splice(removePolys[--i], 1);
  }

  // Clear the incompletePolys vector, it's indices are no longer valid
  incompletePolys.length = 0;
}

// ---------------------------------------------------
/**
 * Given three vectors p.p1, p.p2, and p.p3, this routine
 * checks to see if progressing from p1 to p2 to p3 is a clockwise
 * or counterclockwise progression with respect to the normal.
 * The return value is -1 for clockwise, +1 for counterclockwise,
 * and 0 if any two of the vectors are coincident.
 *
 * @param {Vector3} p
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {Vector3} p3
 * @param {Vector3} normal
 * @returns {Number}
 */
export function vtkCCSVectorProgression(p, p1, p2, p3, normal) {
  const v1 = [p1[0] - p[0], p1[1] - p[1], p1[2] - p[2]];
  const v2 = [p2[0] - p[0], p2[1] - p[1], p2[2] - p[2]];
  const v3 = [p3[0] - p[0], p3[1] - p[1], p3[2] - p[2]];
  const w1 = [];
  const w2 = [];

  vtkMath.cross(v2, v1, w1);
  vtkMath.cross(v2, v3, w2);
  const s1 = vtkMath.dot(w1, normal);
  const s2 = vtkMath.dot(w2, normal);

  if (s1 !== 0 && s2 !== 0) {
    const sb1 = s1 < 0;
    const sb2 = s2 < 0;

    // if sines have different signs
    // XOR
    if (sb1 ? !sb2 : sb2) {
      // return -1 if s2 is -ve
      return 1 - 2 * sb2;
    }

    const c1 = vtkMath.dot(v2, v1);
    const l1 = vtkMath.norm(v1);
    const c2 = vtkMath.dot(v2, v3);
    const l2 = vtkMath.norm(v3);

    // ck is the difference of the cosines, flipped in sign if sines are +ve
    const ck = (c2 * l2 - c1 * l1) * (1 - sb1 * 2);

    if (ck !== 0) {
      // return the sign of ck
      return 1 - 2 * (ck < 0);
    }
  }

  return 0;
}

// ---------------------------------------------------
/**
 * Check for self-intersection. Split the figure-eights.
 * This assumes that all intersections occur at existing
 * vertices, i.e. no new vertices will be created. Returns
 * the number of splits made.
 *
 * @param {Array[]} polys
 * @param {vtkPoints} points
 * @param {Array} polyGroups
 * @param {Array} polyEdges
 * @param {Vector3} normal
 * @param {Boolean} oriented
 */
export function vtkCCSSplitAtPinchPoints(
  polys,
  points,
  polyGroups,
  polyEdges,
  normal,
  oriented
) {
  const tryPoints = vtkPoints.newInstance({
    dataType: VtkDataTypes.DOUBLE,
    empty: true,
  });

  const locator = vtkIncrementalOctreePointLocator.newInstance();

  let splitCount = 0;
  let poly;
  let n;
  let bounds;
  let tol;

  for (let i = 0; i < polys.length; i++) {
    poly = polys[i];
    n = poly.length;

    bounds = [];
    tol =
      CCS_POLYGON_TOLERANCE *
      Math.sqrt(vtkPolygon.getBounds(poly, points, bounds));

    if (tol === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    tryPoints.initialize();
    locator.setTolerance(tol);
    locator.initPointInsertion(tryPoints, bounds);

    let foundMatch = false;
    let idx1 = 0;
    let idx2 = 0;
    let unique = 0;
    const point = [];
    const p1 = [];
    const p2 = [];
    const p3 = [];

    for (idx2 = 0; idx2 < n; idx2++) {
      points.getPoint(poly[idx2], point);

      const { success, pointIdx } = locator.insertUniquePoint(point, 0);
      if (!success) {
        // Need vertIdx to match poly indices, so force point insertion
        locator.insertNextPoint(point);

        // Do the points have different pointIds?
        idx1 = pointIdx;
        unique = poly[idx2] !== poly[idx1];

        if (idx2 > idx1 + 2 - unique && n + idx1 > idx2 + 2 - unique) {
          if (oriented) {
            // Make sure that splitting this poly won't create a hole poly
            let prevIdx = n + idx1 - 1;
            let midIdx = idx1 + 1;
            let nextIdx = idx2 + 1;
            if (prevIdx >= n) {
              prevIdx -= n;
            }
            if (midIdx >= n) {
              midIdx -= n;
            }
            if (nextIdx >= n) {
              nextIdx -= n;
            }

            points.getPoint(poly[prevIdx], p1);
            points.getPoint(poly[midIdx], p2);
            points.getPoint(poly[nextIdx], p3);

            if (vtkCCSVectorProgression(point, p1, p2, p3, normal) > 0) {
              foundMatch = true;
              break;
            }
          } else {
            foundMatch = true;
            break;
          }
        }
      }
    }

    if (foundMatch) {
      splitCount++;

      // Split off a new poly
      const m = idx2 - idx1;
      const oldPoly = polys[i];
      const oldEdges = polyEdges[i];
      const newPoly1 = oldPoly.slice(idx1, idx1 + m + unique);
      const newEdges1 = oldEdges.slice(idx1, idx1 + m + unique);
      const newPoly2 = new Array(n - m + unique);
      const newEdges2 = new Array(n - m + unique);

      if (unique) {
        newEdges1[m] = -1;
      }

      // The poly that is split off, which might have more intersections
      for (let j = 0; j < idx1 + unique; j++) {
        newPoly2[j] = oldPoly[j];
        newEdges2[j] = oldEdges[j];
      }
      if (unique) {
        newEdges2[idx1] = -1;
      }
      for (let k = idx2; k < n; k++) {
        newPoly2[k - m + unique] = oldPoly[k];
        newEdges2[k - m + unique] = oldEdges[k];
      }

      polys[i] = newPoly1;
      polyEdges[i] = newEdges1;
      polys.push(newPoly2);
      polyEdges.push(newEdges2);

      // Unless polygroup was clear (because poly was reversed),
      // make a group with one entry for the new poly
      polyGroups.length = polys.length;
      if (polyGroups[i].length > 0) {
        polyGroups[polys.length - 1].push(polys.length - 1);
      }
    }
  }
  return splitCount;
}

// ---------------------------------------------------
/**
 * The polygons might have a lot of extra points, i.e. points
 * in the middle of the edges.  Remove those points, but keep
 * the original edges as polylines in the originalEdges array.
 * Only original edges with more than two points will be kept.
 *
 * @param {Array[]} polys
 * @param {vtkPoints} points
 * @param {Array} polyEdges
 * @param {Array} originalEdges
 */
export function vtkCCSFindTrueEdges(polys, points, polyEdges, originalEdges) {
  // Tolerance^2 for angle to see if line segments are parallel
  const atol2 = CCS_POLYGON_TOLERANCE * CCS_POLYGON_TOLERANCE;

  const p0 = [];
  const p1 = [];
  const p2 = [];
  const v1 = [];
  const v2 = [];
  let l1;
  let l2;

  for (let polyId = 0; polyId < polys.length; polyId++) {
    const oldPoly = polys[polyId];
    const n = oldPoly.length;
    const newEdges = [];
    polyEdges.push(newEdges);

    // Only useful if poly has more than three sides
    if (n < 4) {
      newEdges[0] = -1;
      newEdges[1] = -1;
      newEdges[2] = -1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // While we remove points, m keeps track of how many points are left
    let m = n;

    // Compute bounds for tolerance
    const bounds = [];
    const tol2 = vtkPolygon.getBounds(oldPoly, points, bounds) * atol2;

    // The new poly
    const newPoly = [];
    let cornerPointId = 0;
    let oldOriginalId = -1;

    // Keep the partial edge from before the first corner is found
    const partialEdge = [];
    let cellCount = 0;

    points.getPoint(oldPoly[n - 1], p0);
    points.getPoint(oldPoly[0], p1);
    vtkMath.subtract(p1, p0, v1);
    l1 = vtkMath.dot(v1, v1);

    for (let j = 0; j < n; j++) {
      let k = j + 1;
      if (k >= n) {
        k -= n;
      }

      points.getPoint(oldPoly[k], p2);
      vtkMath.subtract(p2, p1, v2);
      l2 = vtkMath.dot(v2, v2);

      // Dot product is |v1||v2|cos(theta)
      const c = vtkMath.dot(v1, v2);
      // sin^2(theta) = (1 - cos^2(theta))
      // and   c*c = l1*l2*cos^2(theta)
      const s2 = l1 * l2 - c * c;

      // In the small angle approximation, sin(theta) == theta, so
      // s2/(l1*l2) is the angle that we want to check, but it's not
      // a valid check if l1 or l2 is very close to zero.

      const pointId = oldPoly[j];

      // Keep the point if:
      // 1) removing it would create a 2-point poly OR
      // 2) it's more than "tol" distance from the prev point AND
      // 3) the angle is greater than atol:
      if (
        m <= 3 ||
        (l1 > tol2 && (c < 0 || l1 < tol2 || l2 < tol2 || s2 > l1 * l2 * atol2))
      ) {
        // Complete the previous edge only if the final point count
        // will be greater than two
        if (cellCount > 1) {
          if (pointId !== oldOriginalId) {
            originalEdges.push(pointId);
            cellCount++;
          }
          // Update the number of segments in the edge
          const countLocation = originalEdges.length - cellCount - 1;
          originalEdges[countLocation] = cellCount;
          newEdges.push(countLocation);
        } else if (cellCount === 0) {
          partialEdge.push(pointId);
        } else {
          newEdges.push(-1);
        }

        newPoly.push(pointId);

        // Start a new edge with cornerPointId as a "virtual" point
        cornerPointId = pointId;
        oldOriginalId = pointId;
        cellCount = 1;

        // Rotate to the next point
        p0[0] = p2[0];
        p0[1] = p2[1];
        p0[2] = p2[2];
        p1[0] = p2[0];
        p1[1] = p2[1];
        p1[2] = p2[2];
        v1[0] = v2[0];
        v1[1] = v2[1];
        v1[2] = v2[2];
        l1 = l2;
      } else {
        if (cellCount > 0 && pointId !== oldOriginalId) {
          // First check to see if we have to add cornerPointId
          if (cellCount === 1) {
            originalEdges.push(1); // new edge
            originalEdges.push(cornerPointId);
          }
          // Then add the new point
          originalEdges.push(pointId);
          oldOriginalId = pointId;
          cellCount++;
        } else {
          // No corner yet, so save the point
          partialEdge.push(pointId);
        }

        // Reduce the count
        m--;

        // Join the previous two segments, since the point was removed
        p1[0] = p2[0];
        p1[1] = p2[1];
        p1[2] = p2[2];
        vtkMath.subtract(p2, p0, v1);
        l1 = vtkMath.dot(v1, v1);
      }
    }

    // Add the partial edge to the end
    for (let ii = 0; ii < partialEdge.length; ii++) {
      const pointId = partialEdge[ii];
      if (pointId !== oldOriginalId) {
        if (cellCount === 1) {
          originalEdges.push(1); // new edge
          originalEdges.push(cornerPointId);
        }
        originalEdges.push(pointId);
        oldOriginalId = pointId;
        cellCount++;
      }
    }

    // Finalize
    if (cellCount > 1) {
      // Update the number of segments in the edge
      const countLocation = originalEdges.length - cellCount - 1;
      originalEdges[countLocation] = cellCount;
      newEdges.push(countLocation);
    }
    polys[polyId] = newPoly;
  }
}

// ---------------------------------------------------
/**
 * Reverse a cleaned-up polygon along with the info about
 * all of its original vertices.
 *
 * @param {Array} poly
 * @param {Array} edges
 * @param {Array} originalEdges
 */
export function vtkCCSReversePoly(poly, edges, originalEdges) {
  reverseElements(poly, 1, poly.length - 1);
  edges.reverse();
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] >= 0) {
      const firstPtsIdx = edges[i] + 1;
      const npts = originalEdges[edges[i]];
      reverseElements(originalEdges, firstPtsIdx, firstPtsIdx + npts - 1);
    }
  }
}

// ---------------------------------------------------
/**
 * Check the sense of the polygon against the given normal. Returns
 * zero if the normal is zero.
 *
 * @param {Array} poly
 * @param {vtkPoints} points
 * @param {Vector3} normal
 */
export function vtkCCSCheckPolygonSense(poly, points, normal) {
  // Compute the normal
  const pnormal = [0.0, 0.0, 0.0];
  const p0 = [];
  const p1 = [];
  const p2 = [];
  const v1 = [];
  const v2 = [];
  const v = [];

  points.getPoint(poly[0], p0);
  points.getPoint(poly[1], p1);
  vtkMath.subtract(p1, p0, v1);

  for (let jj = 2; jj < poly.length; jj++) {
    points.getPoint(poly[jj], p2);
    vtkMath.subtract(p2, p0, v2);
    vtkMath.cross(v1, v2, v);
    vtkMath.add(pnormal, v, pnormal);
    p1[0] = p2[0];
    p1[1] = p2[1];
    p1[2] = p2[2];
    v1[0] = v2[0];
    v1[1] = v2[1];
    v1[2] = v2[2];
  }

  // Check the normal
  const d = vtkMath.dot(pnormal, normal);

  return { isNormalNotZero: d !== 0, sense: d > 0 };
}

// ---------------------------------------------------
/**
 * Check whether innerPoly is inside outerPoly.
 * The normal is needed to verify the polygon orientation.
 * The values of pp, bounds, and tol2 must be precomputed
 * by calling vtkCCSPrepareForPolyInPoly() on outerPoly.
 *
 * @param {Array} outerPoly
 * @param {Array} innerPoly
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @param {Float64Array} pp
 * @param {Bounds} bounds
 * @param {Number} tol2
 */
export function vtkCCSPolyInPoly(
  outerPoly,
  innerPoly,
  points,
  normal,
  pp,
  bounds,
  tol2
) {
  // Find a vertex of poly "j" that isn't on the edge of poly "i".
  // This is necessary or the PointInPolygon might return "true"
  // based only on roundoff error.
  const n = outerPoly.length;
  const m = innerPoly.length;
  const p = [];
  const q1 = [];
  const q2 = [];

  for (let jj = 0; jj < m; jj++) {
    // Semi-randomize the point order
    // eslint-disable-next-line no-bitwise
    const kk = (jj >> 1) + (jj & 1) * ((m + 1) >> 1);
    points.getPoint(innerPoly[kk], p);
    const intersectionState = vtkPolygon.pointInPolygon(p, pp, bounds, normal);
    if (intersectionState === PolygonWithPointIntersectionState.FAILURE) {
      vtkErrorMacro('Error finding point in polygon in vtkCCSPolyInPoly');
    }
    if (intersectionState !== PolygonWithPointIntersectionState.OUTSIDE) {
      let pointOnEdge = 0;
      points.getPoint(outerPoly[n - 1], q1);

      for (let ii = 0; ii < n; ii++) {
        points.getPoint(outerPoly[ii], q2);
        // This method returns distance squared
        const { distance } = vtkLine.distanceToLine(p, q1, q2);
        if (distance < tol2) {
          pointOnEdge = 1;
          break;
        }
        q1[0] = q2[0];
        q1[1] = q2[1];
        q1[2] = q2[2];
      }

      if (!pointOnEdge) {
        // Good result, point is in polygon
        return true;
      }
    }
  }

  // No matches found
  return false;
}

// ---------------------------------------------------
/**
 * Precompute values needed for the PolyInPoly check.
 * The values that are returned are as follows:
 * pp: an array of the polygon vertices
 * bounds: the polygon bounds
 * tol2: a tolerance value based on the size of the polygon
 * (note: pp must be pre-allocated to the 3*outerPoly.length)
 *
 * @param {Array} outerPoly
 * @param {vtkPoints} points
 * @param {Float64Array} pp
 * @param {Bounds} bounds
 */
export function vtkCCSPrepareForPolyInPoly(outerPoly, points, pp, bounds) {
  const n = outerPoly.length;

  if (n === 0) {
    return 0.0; // to avoid false positive warning about uninitialized value
  }

  // Pull out the points
  const point = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    points.getPoint(outerPoly[i], point);
    pp[j++] = point[0];
    pp[j++] = point[1];
    pp[j++] = point[2];
  }

  // Find the bounding box and tolerance for the polygon
  return (
    vtkPolygon.getBounds(outerPoly, points, bounds) *
    (CCS_POLYGON_TOLERANCE * CCS_POLYGON_TOLERANCE)
  );
}

// ---------------------------------------------------
/**
 * Check for polygons within polygons. Group the polygons
 * if they are within each other. Reverse the sense of
 * the interior "hole" polygons. A hole within a hole
 * will be reversed twice and will become its own group.
 *
 * @param {Array} newPolys
 * @param {vtkPoints} points
 * @param {Array} polyGroups
 * @param {Array} polyEdges
 * @param {Array} originalEdges
 * @param {Vector3} normal
 * @param {Boolean} oriented
 */
export function vtkCCSMakeHoleyPolys(
  newPolys,
  points,
  polyGroups,
  polyEdges,
  originalEdges,
  normal,
  oriented
) {
  const numNewPolys = newPolys.length;
  if (numNewPolys <= 1) {
    return;
  }

  // Use bit arrays to keep track of inner polys
  const polyReversed = [];
  const innerPolys = [];

  // GroupCount is an array only needed for unoriented polys
  let groupCount;
  if (!oriented) {
    groupCount = new Int32Array(numNewPolys);
  }

  // Find the maximum poly size
  let nmax = 1;
  for (let kk = 0; kk < numNewPolys; kk++) {
    nmax = Math.max(nmax, newPolys[kk].length);
  }

  // These are some values needed for poly-in-poly checks
  const pp = new Float64Array(3 * nmax);
  const bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  let tol2;

  // Go through all polys
  for (let i = 0; i < numNewPolys; i++) {
    const n = newPolys[i].length;

    if (n < 3) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Check if poly is reversed
    const { isNormalNotZero, sense } = vtkCCSCheckPolygonSense(
      newPolys[i],
      points,
      normal
    );
    if (isNormalNotZero) {
      polyReversed[i] = !sense;
    }

    // Precompute some values needed for poly-in-poly checks
    tol2 = vtkCCSPrepareForPolyInPoly(newPolys[i], points, pp, bounds);

    // Look for polygons inside of this one
    for (let j = 0; j < numNewPolys; j++) {
      if (j !== i && newPolys[j].length >= 3) {
        // Make sure polygon i is not in polygon j
        const pg = polyGroups[j];
        if (!pg.includes(i)) {
          if (
            vtkCCSPolyInPoly(
              newPolys[i],
              newPolys[j],
              points,
              normal,
              pp.subarray(3 * n),
              bounds,
              tol2
            )
          ) {
            // Add to group
            polyGroups[i].push(j);
            if (groupCount) {
              groupCount[j] += 1;
            }
          }
        }
      }
    }
  }

  if (!oriented) {
    // build a stack of polys that aren't inside other polys=
    const outerPolyStack = [];
    for (let ll = 0; ll < numNewPolys; ll++) {
      if (groupCount[ll] === 0) {
        outerPolyStack.push(ll);
      }
    }

    let j;
    while (outerPolyStack.length > 0) {
      j = outerPolyStack.length - 1;
      outerPolyStack.pop();

      if (polyReversed[j]) {
        vtkCCSReversePoly(newPolys[j], polyEdges[j], originalEdges);
        polyReversed[j] = false;
      }

      if (polyGroups[j].length > 1) {
        // Convert the group into a bit array, to make manipulation easier
        innerPolys.length = 0;
        for (let k = 1; k < polyGroups[j].length; k++) {
          const jj = polyGroups[j][k];
          if (groupCount[jj] > 1) {
            groupCount[jj] -= 2;
            if (groupCount[jj] === 0) {
              outerPolyStack.push(jj);
            }
          } else {
            innerPolys[jj] = 1;
            polyGroups[jj].length = 0;
            if (!polyReversed[jj]) {
              vtkCCSReversePoly(newPolys[jj], polyEdges[jj], originalEdges);
              polyReversed[jj] = false;
            }
          }
        }

        // Use the bit array to recreate the polyGroup
        polyGroups[j].length = 0;
        polyGroups[j].push(j);
        for (let jj = 0; jj < numNewPolys; jj++) {
          if (innerPolys[jj]) {
            polyGroups[j].push(jj);
          }
        }
      }
    }
  } else {
    // oriented
    for (let j = 0; j < numNewPolys; j++) {
      // Remove the groups for reversed polys
      if (polyReversed[j]) {
        polyGroups[j].length = 0;
      }
      // Polys inside the interior polys have their own groups, so remove
      // them from this group
      else if (polyGroups[j].length > 1) {
        // Convert the group into a bit array, to make manipulation easier
        innerPolys.length = 0;
        for (let k = 1; k < polyGroups[j].length; k++) {
          innerPolys[polyGroups[j][k]] = true;
        }

        // Look for non-reversed polys inside this one
        for (let kk = 1; kk < polyGroups[j].length; kk++) {
          // jj is the index of the inner poly
          const jj = polyGroups[j][kk];
          // If inner poly is not reversed then
          if (!polyReversed[jj]) {
            // Remove that poly and all polys inside of it from the group
            for (let ii = 0; ii < polyGroups[jj].length; ii++) {
              innerPolys[polyGroups[jj][ii]] = false;
            }
          }
        }

        // Use the bit array to recreate the polyGroup
        polyGroups[j].length = 0;
        polyGroups[j].push(j);
        for (let jj = 0; jj < numNewPolys; jj++) {
          if (innerPolys[jj]) {
            polyGroups[j].push(jj);
          }
        }
      }
    }
  }

  // delete[] groupCount;
}

// ---------------------------------------------------
/**
 * Check line segment with point Ids (i, j) to make sure that it
 * doesn't cut through the edges of any polys in the group.
 * Return value of zero means check failed and the cut is not
 * usable.
 *
 * @param {Array[]} polys
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @param {Array} polyGroup
 * @param {Number} outerPolyId
 * @param {Number} innerPolyId
 * @param {Number} outerIdx
 * @param {Number} innerIdx
 */
export function vtkCCSCheckCut(
  polys,
  points,
  normal,
  polyGroup,
  outerPolyId,
  innerPolyId,
  outerIdx,
  innerIdx
) {
  const ptId1 = polys[outerPolyId][outerIdx];
  const ptId2 = polys[innerPolyId][innerIdx];

  const tol = CCS_POLYGON_TOLERANCE;

  const p1 = [];
  const p2 = [];
  points.getPoint(ptId1, p1);
  points.getPoint(ptId2, p2);

  const w = [];
  vtkMath.subtract(p2, p1, w);
  const l = vtkMath.normalize(w);

  // Cuts between coincident points are good
  if (l === 0) {
    return true;
  }

  // Define a tolerance with units of distance squared
  const tol2 = l * l * tol * tol;

  // Check the sense of the cut: it must be pointing "in" for both polys.
  let polyId = outerPolyId;
  let polyIdx = outerIdx;

  let r = p1;
  const r1 = [];
  let r2 = p2;
  const r3 = [];

  for (let ii = 0; ii < 2; ii++) {
    const poly = polys[polyId];
    const n = poly.length;
    let prevIdx = n - polyIdx - 1;
    let nextIdx = polyIdx + 1;
    if (prevIdx >= n) {
      prevIdx -= n;
    }
    if (nextIdx >= n) {
      nextIdx -= n;
    }

    points.getPoint(poly[prevIdx], r1);
    points.getPoint(poly[nextIdx], r3);

    if (vtkCCSVectorProgression(r, r1, r2, r3, normal) > 0) {
      return false;
    }

    polyId = innerPolyId;
    polyIdx = innerIdx;
    r = p2;
    r2 = p1;
  }

  // Check for intersections of the cut with polygon edges.
  // First, create a cut plane that divides space at the cut line.
  const pc = [];
  vtkMath.cross(normal, w, pc);
  pc[3] = -vtkMath.dot(pc, p1);

  for (let i = 0; i < polyGroup.length; i++) {
    const poly = polys[polyGroup[i]];
    const n = poly.length;

    const q1 = [];
    const q2 = [];
    let qtId1 = poly[n - 1];
    points.getPoint(qtId1, q1);
    let v1 = pc[0] * q1[0] + pc[1] * q1[1] + pc[2] * q1[2] + pc[3];
    let c1 = v1 > 0;

    for (let j = 0; j < n; j++) {
      const qtId2 = poly[j];
      points.getPoint(qtId2, q2);
      const v2 = pc[0] * q2[0] + pc[1] * q2[1] + pc[2] * q2[2] + pc[3];
      const c2 = v2 > 0;

      // If lines share an endpoint, they can't intersect,
      // so don't bother with the check.
      if (
        ptId1 !== qtId1 &&
        ptId1 !== qtId2 &&
        ptId2 !== qtId1 &&
        ptId2 !== qtId2
      ) {
        // Check for intersection
        if ((c1 ? !c2 : c2) || v1 * v1 < tol2 || v2 * v2 < tol2) {
          vtkMath.subtract(q2, q1, w);
          if (vtkMath.dot(w, w) > 0) {
            const qc = [];
            vtkMath.cross(w, normal, qc);
            qc[3] = -vtkMath.dot(qc, q1);

            const u1 = qc[0] * p1[0] + qc[1] * p1[1] + qc[2] * p1[2] + qc[3];
            const u2 = qc[0] * p2[0] + qc[1] * p2[1] + qc[2] * p2[2] + qc[3];
            const d1 = u1 > 0;
            const d2 = u2 > 0;

            if (d1 ? !d2 : d2) {
              // One final check to make sure endpoints aren't coincident
              let p = p1;
              let q = q1;
              if (v2 * v2 < v1 * v1) {
                p = p2;
              }
              if (u2 * u2 < u1 * u1) {
                q = q2;
              }
              if (vtkMath.distance2BetweenPoints(p, q) > tol2) {
                return false;
              }
            }
          }
        }
      }

      qtId1 = qtId2;
      q1[0] = q2[0];
      q1[1] = q2[1];
      q1[2] = q2[2];
      v1 = v2;
      c1 = c2;
    }
  }

  return true;
}

// ---------------------------------------------------
/**
 * Check the quality of a cut between an outer and inner polygon.
 * An ideal cut is one that forms a 90 degree angle with each
 * line segment that it joins to.  Smaller values indicate a
 * higher quality cut.
 *
 * @param {Array} outerPoly
 * @param {Array} innerPoly
 * @param {Number} i
 * @param {Number} j
 * @param {vtkPoints} points
 */
export function vtkCCSCutQuality(outerPoly, innerPoly, i, j, points) {
  const n = outerPoly.length;
  const m = innerPoly.length;

  const a = i > 0 ? i - 1 : n - 1;
  const b = i < n - 1 ? i + 1 : 0;

  const c = j > 0 ? j - 1 : m - 1;
  const d = j < m - 1 ? j + 1 : 0;

  const p0 = [];
  const p1 = [];
  const p2 = [];
  points.getPoint(outerPoly[i], p1);
  points.getPoint(innerPoly[j], p2);

  const v1 = [];
  const v2 = [];
  vtkMath.subtract(p2, p1, v1);

  const l1 = vtkMath.dot(v1, v1);
  let l2;
  let qmax = 0;
  let q;

  points.getPoint(outerPoly[a], p0);
  vtkMath.subtract(p0, p1, v2);
  l2 = vtkMath.dot(v2, v2);
  if (l2 > 0) {
    q = vtkMath.dot(v1, v2);
    q *= q / l2;
    if (q > qmax) {
      qmax = q;
    }
  }

  points.getPoint(outerPoly[b], p0);
  vtkMath.subtract(p0, p1, v2);
  l2 = vtkMath.dot(v2, v2);
  if (l2 > 0) {
    q = vtkMath.dot(v1, v2);
    q *= q / l2;
    if (q > qmax) {
      qmax = q;
    }
  }

  points.getPoint(innerPoly[c], p0);
  vtkMath.subtract(p2, p0, v2);
  l2 = vtkMath.dot(v2, v2);
  if (l2 > 0) {
    q = vtkMath.dot(v1, v2);
    q *= q / l2;
    if (q > qmax) {
      qmax = q;
    }
  }

  points.getPoint(innerPoly[d], p0);
  vtkMath.subtract(p2, p0, v2);
  l2 = vtkMath.dot(v2, v2);
  if (l2 > 0) {
    q = vtkMath.dot(v1, v2);
    q *= q / l2;
    if (q > qmax) {
      qmax = q;
    }
  }

  if (l1 > 0) {
    return qmax / l1; // also l1 + qmax, incorporates distance;
  }

  return Number.MAX_VALUE;
}

// ---------------------------------------------------
/**
 * Find the two sharpest verts on an inner (i.e. inside-out) poly.
 *
 * @param {Array} poly
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @param {[Number, Number]} verts
 */
export function vtkCCSFindSharpestVerts(poly, points, normal, verts) {
  const p1 = [];
  const p2 = [];
  const v1 = [];
  const v2 = [];
  const v = [];
  let l1;
  let l2;

  const minVal = [0, 0];

  verts[0] = 0;
  verts[1] = 0;

  const n = poly.length;
  points.getPoint(poly[n - 1], p2);
  points.getPoint(poly[0], p1);

  vtkMath.subtract(p1, p2, v1);
  l1 = Math.sqrt(vtkMath.dot(v1, v1));

  for (let j = 0; j < n; j++) {
    let k = j + 1;
    if (k === n) {
      k = 0;
    }

    points.getPoint(poly[k], p2);
    vtkMath.subtract(p2, p1, v2);
    l2 = Math.sqrt(vtkMath.dot(v2, v2));

    vtkMath.cross(v1, v2, v);
    const b = vtkMath.dot(v, normal);

    if (b < 0 && l1 * l2 > 0) {
      // Dot product is |v1||v2|cos(theta), range [-1, +1]
      const val = vtkMath.dot(v1, v2) / (l1 * l2);
      if (val < minVal[0]) {
        minVal[1] = minVal[0];
        minVal[0] = val;
        verts[1] = verts[0];
        verts[0] = j;
      }
    }

    // Rotate to the next point
    p1[0] = p2[0];
    p1[1] = p2[1];
    p1[2] = p2[2];
    v1[0] = v2[0];
    v1[1] = v2[1];
    v1[2] = v2[2];
    l1 = l2;
  }
}

// ---------------------------------------------------
/**
 * Find two valid cuts between outerPoly and innerPoly.
 * Used by vtkCCSCutHoleyPolys.
 *
 * @param {Array} polys
 * @param {Array} polyGroup
 * @param {Number} outerPolyId
 * @param {Number} innerPolyId
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @param {Array[]} cuts
 * @param {Boolean} exhaustive
 */
export function vtkCCSFindCuts(
  polys,
  polyGroup,
  outerPolyId,
  innerPolyId,
  points,
  normal,
  cuts,
  exhaustive
) {
  const outerPoly = polys[outerPolyId];
  const innerPoly = polys[innerPolyId];
  const innerSize = innerPoly.length;
  // Find the two sharpest points on the inner poly
  const verts = [];
  vtkCCSFindSharpestVerts(innerPoly, points, normal, verts);

  // A list of cut locations according to quality
  const cutlist = [];
  cutlist.length = outerPoly.length;

  // Search for potential cuts (need to find two cuts)
  let cutId = 0;
  cuts[0][0] = 0;
  cuts[0][1] = 0;
  cuts[1][0] = 0;
  cuts[1][1] = 0;

  let foundCut = false;
  for (cutId = 0; cutId < 2; cutId++) {
    const count = exhaustive ? innerSize : 3;

    for (let i = 0; i < count && !foundCut; i++) {
      // Semi-randomize the search order
      // TODO: Does this do the same as in C++?
      // eslint-disable-next-line no-bitwise
      let j = (i >> 1) + (i & 1) * ((innerSize + 1) >> 1);
      // Start at the best first point
      j = (j + verts[cutId]) % innerSize;

      for (let kk = 0; kk < outerPoly.length; kk++) {
        const q = vtkCCSCutQuality(outerPoly, innerPoly, kk, j, points);
        cutlist[kk] = [q, kk];
      }

      cutlist.sort((a, b) => a[0] - b[0]);

      for (let lid = 0; lid < cutlist.length; lid++) {
        const k = cutlist[lid][1];

        // If this is the second cut, do extra checks
        if (cutId > 0) {
          // Make sure cuts don't share an endpoint
          if (j === cuts[0][1] || k === cuts[0][0]) {
            // eslint-disable-next-line no-continue
            continue;
          }

          // Make sure cuts don't intersect
          const p1 = [];
          const p2 = [];
          points.getPoint(outerPoly[cuts[0][0]], p1);
          points.getPoint(innerPoly[cuts[0][1]], p2);

          const q1 = [];
          const q2 = [];
          points.getPoint(outerPoly[k], q1);
          points.getPoint(innerPoly[j], q2);

          let u;
          let v;
          if (
            vtkLine.intersection(p1, p2, q1, q2, u, v) ===
            vtkLine.IntersectionState.YES_INTERSECTION
          ) {
            // eslint-disable-next-line no-continue
            continue;
          }
        }

        // This check is done for both cuts
        if (
          vtkCCSCheckCut(
            polys,
            points,
            normal,
            polyGroup,
            outerPolyId,
            innerPolyId,
            k,
            j
          )
        ) {
          cuts[cutId][0] = k;
          cuts[cutId][1] = j;
          foundCut = true;
          break;
        }
      }
    }

    if (!foundCut) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------
/**
 * Helper for vtkCCSCutHoleyPolys.  Change a polygon and a hole
 * into two separate polygons by making two cuts between them.
 *
 * @param {Array[]} polys
 * @param {Array} polyEdges
 * @param {Number} outerPolyId
 * @param {Number} innerPolyId
 * @param {vtkPoints} points
 * @param {Array[]} cuts
 */
export function vtkCCSMakeCuts(
  polys,
  polyEdges,
  outerPolyId,
  innerPolyId,
  points,
  cuts
) {
  const q = [];
  const r = [];
  for (let bb = 0; bb < 2; bb++) {
    const ptId1 = polys[outerPolyId][cuts[bb][0]];
    const ptId2 = polys[innerPolyId][cuts[bb][1]];
    points.getPoint(ptId1, q);
    points.getPoint(ptId2, r);
  }

  const outerPoly = polys[outerPolyId];
  const innerPoly = polys[innerPolyId];

  const outerEdges = polyEdges[outerPolyId];
  const innerEdges = polyEdges[innerPolyId];

  // Generate new polys from the cuts
  const n = outerPoly.length;
  const m = innerPoly.length;
  let idx;

  // Generate poly1
  const n1 = n * (cuts[1][0] < cuts[0][0]) + cuts[1][0] - cuts[0][0] + 1;
  const n2 = n1 + m * (cuts[0][1] < cuts[1][1]) + cuts[0][1] - cuts[1][1] + 1;

  const poly1 = [];
  poly1.length = n2;
  const edges1 = new Array(n2);

  idx = cuts[0][0];
  for (let i1 = 0; i1 < n1; i1++) {
    const k = idx++;
    poly1[i1] = outerPoly[k];
    edges1[i1] = outerEdges[k];
    idx *= idx !== n;
  }
  edges1[n1 - 1] = -1;

  idx = cuts[1][1];
  for (let i2 = n1; i2 < n2; i2++) {
    const k = idx++;
    poly1[i2] = innerPoly[k];
    edges1[i2] = innerEdges[k];
    idx *= idx !== m;
  }
  edges1[n2 - 1] = -1;

  // Generate poly2
  const m1 = n * (cuts[0][0] < cuts[1][0]) + cuts[0][0] - cuts[1][0] + 1;
  const m2 = m1 + m * (cuts[1][1] < cuts[0][1]) + cuts[1][1] - cuts[0][1] + 1;

  const poly2 = [];
  poly2.length = m2;
  const edges2 = new Array(m2);

  idx = cuts[1][0];
  for (let j1 = 0; j1 < m1; j1++) {
    const k = idx++;
    poly2[j1] = outerPoly[k];
    edges2[j1] = outerEdges[k];
    idx *= idx !== n;
  }
  edges2[m1 - 1] = -1;

  idx = cuts[0][1];
  for (let j2 = m1; j2 < m2; j2++) {
    const k = idx++;
    poly2[j2] = innerPoly[k];
    edges2[j2] = innerEdges[k];
    idx *= idx !== m;
  }
  edges2[m2 - 1] = -1;

  // Replace outerPoly and innerPoly with these new polys
  polys[outerPolyId] = poly1;
  polys[innerPolyId] = poly2;
  polyEdges[outerPolyId] = edges1;
  polyEdges[innerPolyId] = edges2;
}

// ---------------------------------------------------
/**
 * After the holes have been identified, make cuts between the
 * outer poly and each hole.  Make two cuts per hole.  The only
 * strict requirement is that the cut must not intersect any
 * edges, but it's best to make sure that no really sharp angles
 * are created.
 *
 * @param {Array[]} polys
 * @param {vtkPoints} points
 * @param {Array[]} polyGroups
 * @param {Array} polyEdges
 * @param {Vector3} normal
 * @returns {boolean}
 */
export function vtkCCSCutHoleyPolys(
  polys,
  points,
  polyGroups,
  polyEdges,
  normal
) {
  let cutFailure = 0;

  // Go through all groups and cut out the first inner poly that is
  // found.  Every time an inner poly is cut out, the groupId counter
  // is reset because cutting a poly creates a new group.
  let groupId = 0;
  while (groupId < polyGroups.length) {
    const polyGroup = polyGroups[groupId];

    // Only need to make a cut if the group size is greater than 1
    if (polyGroup.length > 1) {
      // The first member of the group is the outer poly
      const outerPolyId = polyGroup[0];

      // The second member of the group is the first inner poly
      let innerPolyId = polyGroup[1];

      // Sort the group by size, do largest holes first
      let innerBySize = new Array(polyGroup.length);

      for (let i = 1; i < polyGroup.length; i++) {
        innerBySize[i] = [polys[polyGroup[i]].length, i];
      }

      innerBySize = [
        innerBySize[0],
        ...innerBySize.splice(1).sort((a, b) => a[0] - b[0]),
      ];
      reverseElements(innerBySize, 1, innerBySize.length - 1);

      // Need to check all inner polys in sequence, until one succeeds.
      // Do a quick search first, then do an exhaustive search.
      let madeCut = 0;
      let inner = 0;
      for (let exhaustive = 0; exhaustive < 2 && !madeCut; exhaustive++) {
        for (let j = 1; j < polyGroup.length; j++) {
          inner = innerBySize[j][1];
          innerPolyId = polyGroup[inner];

          const cuts = [];
          if (
            vtkCCSFindCuts(
              polys,
              polyGroup,
              outerPolyId,
              innerPolyId,
              points,
              normal,
              cuts,
              exhaustive
            )
          ) {
            vtkCCSMakeCuts(
              polys,
              polyEdges,
              outerPolyId,
              innerPolyId,
              points,
              cuts
            );
            madeCut = 1;
            break;
          }
        }
      }

      if (madeCut) {
        // Move successfully cut innerPolyId into its own group
        polyGroup.splice(inner, 1);
        // Only add if innerPolyId hasn't been set already.
        // Having the same poly occur as both polyGroup and
        // innerPoly would cause an infinite loop.
        if (polyGroups[innerPolyId].length === 0) {
          polyGroups[innerPolyId].push(innerPolyId);
        }
      } else {
        // Remove all failed inner polys from the group
        for (let k = 1; k < polyGroup.length; k++) {
          innerPolyId = polyGroup[k];
          // Only add if innerPolyId hasn't been set already.
          // Having the same poly occur as both polyGroup and
          // innerPoly would cause an infinite loop.
          if (polyGroups[innerPolyId].length === 0) {
            polyGroups[innerPolyId].push(innerPolyId);
          }
        }
        polyGroup.length = 1;
        cutFailure = 1;
      }

      // If there are other interior polys in the group, find out whether
      // they are in poly1 or poly2
      if (polyGroup.length > 1) {
        const poly1 = polys[outerPolyId];
        const pp = new Float64Array(3 * poly1.length);
        const bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        const tol2 = vtkCCSPrepareForPolyInPoly(poly1, points, pp, bounds);

        let nextGroupId = groupId;
        let ii = 1;
        while (ii < polyGroup.length) {
          if (
            vtkCCSPolyInPoly(
              poly1,
              polys[polyGroup[ii]],
              points,
              normal,
              pp,
              bounds,
              tol2
            )
          ) {
            // Keep this poly in polyGroup
            ii++;
          } else {
            // Move this poly to poly2 group
            polyGroups[innerPolyId].push(polyGroup[ii]);
            polyGroup.splice(ii, 1);

            // Reduce the groupId to ensure that this new group will get cut
            if (innerPolyId < nextGroupId) {
              nextGroupId = innerPolyId;
            }
          }
        }

        // Set the groupId for the next iteration
        groupId = nextGroupId;
        // eslint-disable-next-line no-continue
        continue;
      }
    }
    // Increment to the next group
    groupId++;
  }
  return !cutFailure;
}
