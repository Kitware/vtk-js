import macro from 'vtk.js/Sources/macros';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkOBBNode from 'vtk.js/Sources/Filters/General/OBBTree/OBBNode';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

import {
  getCellTriangles,
  pushArray,
  // eslint-disable-next-line import/named
} from 'vtk.js/Sources/Filters/General/OBBTree/helper';

import { vec4, mat4 } from 'gl-matrix';

const { vtkErrorMacro } = macro;
const VTK_DOUBLE_MAX = Number.MAX_SAFE_INTEGER;

// ----------------------------------------------------------------------------
// vtkOBBTree methods
// ----------------------------------------------------------------------------

function vtkOBBTree(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkOBBTree');

  /**
   * Compute an OBB from the list of cells given.  This used to be
   * public but should not have been.  A public call has been added
   * so that the functionality can be accessed.
   * @param {Array} cells
   * @param {Array[3]} corner
   * @param {Array[3]} max
   * @param {Array[3]} mid
   * @param {Array[3]} min
   * @param {Array[3]} size
   */
  function computeOBB(cells, corner, max, mid, min, size) {
    model.OBBCount++;
    model.pointsList = [];
    //
    // Compute mean & moments
    //

    const numCells = cells.length;
    const mean = [0, 0, 0];
    let totMass = 0.0;
    const a0 = [0, 0, 0];
    const a1 = [0, 0, 0];
    const a2 = [0, 0, 0];
    const a = [a0, a1, a2];
    const dp0 = [0, 0, 0];
    const dp1 = [0, 0, 0];
    const c = [0, 0, 0];
    let triMass = 0;

    if (!model.dataset.getCells()) {
      model.dataset.buildCells();
    }

    for (let i = 0; i < numCells; i++) {
      const cellId = cells[i];
      const type = model.dataset.getCells().getCellType(cellId);
      const ptIds = model.dataset.getCellPoints(cellId).cellPointIds;
      const numPts = ptIds.length;

      for (let j = 0; j < numPts - 2; j++) {
        const cellsIds = getCellTriangles(ptIds, type, j);
        const pId = cellsIds.ptId0;
        const qId = cellsIds.ptId1;
        const rId = cellsIds.ptId2;

        if (pId < 0) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const p = [];
        const q = [];
        const r = [];
        model.dataset.getPoints().getPoint(pId, p);
        model.dataset.getPoints().getPoint(qId, q);
        model.dataset.getPoints().getPoint(rId, r);

        // p, q, and r are the oriented triangle points.
        // Compute the components of the moment of inertia tensor.
        for (let k = 0; k < 3; k++) {
          // two edge vectors
          dp0[k] = q[k] - p[k];
          dp1[k] = r[k] - p[k];
          // centroid
          c[k] = (p[k] + q[k] + r[k]) / 3;
        }
        const xp = vtkMath.cross(dp0, dp1, []);
        triMass = 0.5 * vtkMath.norm(xp);
        totMass += triMass;
        for (let k = 0; k < 3; k++) {
          mean[k] += triMass * c[k];
        }

        // on-diagonal terms
        a0[0] +=
          (triMass *
            (9 * c[0] * c[0] + p[0] * p[0] + q[0] * q[0] + r[0] * r[0])) /
          12;
        a1[1] +=
          (triMass *
            (9 * c[1] * c[1] + p[1] * p[1] + q[1] * q[1] + r[1] * r[1])) /
          12;
        a2[2] +=
          (triMass *
            (9 * c[2] * c[2] + p[2] * p[2] + q[2] * q[2] + r[2] * r[2])) /
          12;

        // off-diagonal terms
        a0[1] +=
          (triMass *
            (9 * c[0] * c[1] + p[0] * p[1] + q[0] * q[1] + r[0] * r[1])) /
          12;
        a0[2] +=
          (triMass *
            (9 * c[0] * c[2] + p[0] * p[2] + q[0] * q[2] + r[0] * r[2])) /
          12;
        a1[2] +=
          (triMass *
            (9 * c[1] * c[2] + p[1] * p[2] + q[1] * q[2] + r[1] * r[2])) /
          12;
      } // end foreach triangle

      // While computing cell moments, gather all the cell's
      // point coordinates into a single list.
      for (let j = 0; j < numPts; j++) {
        if (model.insertedPoints[ptIds[j]] !== model.OBBCount) {
          model.insertedPoints[ptIds[j]] = model.OBBCount;
          const pt = [];
          model.dataset.getPoints().getPoint(ptIds[j], pt);
          model.pointsList.push(pt);
        }
      } // for all points of this cell
    } // end foreach cell

    // normalize data
    for (let i = 0; i < 3; i++) {
      mean[i] /= totMass;
    }

    // matrix is symmetric
    a1[0] = a0[1];
    a2[0] = a0[2];
    a2[1] = a1[2];

    // get covariance from moments
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        a[i][j] = a[i][j] / totMass - mean[i] * mean[j];
      }
    }

    //
    // Extract axes (i.e., eigenvectors) from covariance matrix.
    //
    const v0 = [0, 0, 0];
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    const v = [v0, v1, v2];
    vtkMath.jacobi(a, size, v);
    max[0] = v[0][0];
    max[1] = v[1][0];
    max[2] = v[2][0];
    mid[0] = v[0][1];
    mid[1] = v[1][1];
    mid[2] = v[2][1];
    min[0] = v[0][2];
    min[1] = v[1][2];
    min[2] = v[2][2];

    for (let i = 0; i < 3; i++) {
      a[0][i] = mean[i] + max[i];
      a[1][i] = mean[i] + mid[i];
      a[2][i] = mean[i] + min[i];
    }

    //
    // Create oriented bounding box by projecting points onto eigenvectors.
    //
    const tMin = [VTK_DOUBLE_MAX, VTK_DOUBLE_MAX, VTK_DOUBLE_MAX];
    const tMax = [-VTK_DOUBLE_MAX, -VTK_DOUBLE_MAX, -VTK_DOUBLE_MAX];

    const numPts = model.pointsList.length;
    for (let ptId = 0; ptId < numPts; ptId++) {
      const p = model.pointsList[ptId];
      for (let i = 0; i < 3; i++) {
        const out = vtkLine.distanceToLine(p, mean, a[i], []);
        if (out.t < tMin[i]) {
          tMin[i] = out.t;
        }
        if (out.t > tMax[i]) {
          tMax[i] = out.t;
        }
      }
    } // for all points

    for (let i = 0; i < 3; i++) {
      corner[i] =
        mean[i] + tMin[0] * max[i] + tMin[1] * mid[i] + tMin[2] * min[i];

      max[i] *= tMax[0] - tMin[0];
      mid[i] *= tMax[1] - tMin[1];
      min[i] *= tMax[2] - tMin[2];
    }
  }

  /**
   * Build the OBB tree
   * @param {Array} cells
   * @param {vtkOBBNode} obbNode
   * @param {Number} level
   */
  function buildTree(cells, obbNode, level) {
    const numCells = cells.length;

    if (level > model.level) {
      model.level = level;
    }

    const axes = obbNode.getAxes();
    const corner = obbNode.getCorner();
    const size = [0, 0, 0];
    computeOBB(cells, corner, axes[0], axes[1], axes[2], size);
    obbNode.setAxes(axes);
    obbNode.setCorner(corner);

    // Check whether to continue recursing; if so, create two children and
    // assign cells to appropriate child.
    if (level < model.maxLevel && numCells > model.numberOfCellsPerNode) {
      let LHlist = [];
      let RHlist = [];
      const p = [0, 0, 0];
      const n = [0, 0, 0];

      // loop over three split planes to find acceptable one
      for (let i = 0; i < 3; i++) {
        // compute split point
        p[i] = corner[i] + axes[0][i] / 2 + axes[1][i] / 2 + axes[2][i] / 2;
      }

      let splitPlane = 0;
      let splitAcceptable = 0;
      let bestRatio = 1;
      let foundBestSplit = 0;
      let bestPlane = 0;
      for (; !splitAcceptable && splitPlane < 3; ) {
        // compute split normal
        for (let i = 0; i < 3; i++) {
          n[i] = axes[splitPlane][i];
        }
        vtkMath.normalize(n);

        // traverse cells, assigning to appropriate child list as necessary
        for (let i = 0; i < numCells; i++) {
          const cellId = cells[i];
          const pointsIDs = model.dataset.getCellPoints(cellId).cellPointIds;
          const cellPts = [];
          pointsIDs.forEach((id) => {
            const pt = [];
            model.dataset.getPoints().getPoint(pointsIDs[id], pt);
            cellPts.push(pt);
          });

          const c = [0, 0, 0];
          const numPts = cellPts.length;
          let negative = 0;
          let positive = 0;
          for (let j = 0; j < numPts; j++) {
            const ptId = pointsIDs[j];
            const x = model.dataset.getPoints().getPoint(ptId);
            const val =
              n[0] * (x[0] - p[0]) +
              n[1] * (x[1] - p[1]) +
              n[2] * (x[2] - p[2]);
            c[0] += x[0];
            c[1] += x[1];
            c[2] += x[2];
            if (val < 0.0) {
              negative = 1;
            } else {
              positive = 1;
            }
          }

          if (negative && positive) {
            // Use centroid to decide straddle cases
            c[0] /= numPts;
            c[1] /= numPts;
            c[2] /= numPts;
            const val =
              n[0] * (c[0] - p[0]) +
              n[1] * (c[1] - p[1]) +
              n[2] * (c[2] - p[2]);
            if (val < 0.0) {
              LHlist.push(cellId);
            } else {
              RHlist.push(cellId);
            }
          } else if (negative) {
            LHlist.push(cellId);
          } else {
            RHlist.push(cellId);
          }
        } // for all cells

        // evaluate this split
        const numInLHnode = LHlist.length;
        const numInRHnode = RHlist.length;
        const ratio = Math.abs((numInRHnode - numInLHnode) / numCells);

        // see whether we've found acceptable split plane
        if (ratio < 0.6 || foundBestSplit) {
          // accept right off the bat
          splitAcceptable = 1;
        } else {
          // not a great split try another
          LHlist = [];
          RHlist = [];
          if (ratio < bestRatio) {
            bestRatio = ratio;
            bestPlane = splitPlane;
          }
          if (++splitPlane === 3 && bestRatio < 0.95) {
            // at closing time, even the ugly ones look good
            splitPlane = bestPlane;
            foundBestSplit = 1;
          }
        } // try another split
      } // for each split

      if (splitAcceptable) {
        // otherwise recursion terminates
        const LHnode = vtkOBBNode.newInstance();
        const RHnode = vtkOBBNode.newInstance();
        obbNode.setKids([LHnode, RHnode]);
        LHnode.setParent(obbNode);
        RHnode.setParent(obbNode);

        cells.length = 0;
        buildTree(LHlist, LHnode, level + 1);
        buildTree(RHlist, RHnode, level + 1);
      } else {
        // free up local objects
        LHlist = [];
        RHlist = [];
      }
    } // if should build tree

    if (cells && model.retainCellLists) {
      obbNode.setCells(cells);
    } else if (cells) {
      cells.length = 0;
    }
  }

  function generatePolygons(obbNode, level, repLevel, points, cells) {
    if (level === repLevel || (repLevel < 0 && obbNode.getKids())) {
      let nbPoints = points.getNumberOfPoints();
      const newPoints = [];
      const newCells = [];
      const cubeIds = [];

      newPoints.push(...obbNode.getCorner());
      cubeIds[0] = nbPoints++;

      const x = [];
      newPoints.push(
        ...vtkMath.add(obbNode.getCorner(), obbNode.getAxis(0), x)
      );
      cubeIds[1] = nbPoints++;

      const y = [];
      newPoints.push(
        ...vtkMath.add(obbNode.getCorner(), obbNode.getAxis(1), y)
      );
      cubeIds[2] = nbPoints++;

      const xy = [];
      newPoints.push(...vtkMath.add(x, obbNode.getAxis(1), xy));
      cubeIds[3] = nbPoints++;

      const z = [];
      newPoints.push(
        ...vtkMath.add(obbNode.getCorner(), obbNode.getAxis(2), z)
      );
      cubeIds[4] = nbPoints++;

      const xz = [];
      newPoints.push(...vtkMath.add(x, obbNode.getAxis(2), xz));
      cubeIds[5] = nbPoints++;

      const yz = [];
      newPoints.push(...vtkMath.add(y, obbNode.getAxis(2), yz));
      cubeIds[6] = nbPoints++;

      const xyz = [];
      newPoints.push(...vtkMath.add(xy, obbNode.getAxis(2), xyz));
      cubeIds[7] = nbPoints++;

      newCells.push(4, cubeIds[0], cubeIds[2], cubeIds[3], cubeIds[1]);
      newCells.push(4, cubeIds[0], cubeIds[1], cubeIds[5], cubeIds[4]);
      newCells.push(4, cubeIds[0], cubeIds[4], cubeIds[6], cubeIds[2]);
      newCells.push(4, cubeIds[1], cubeIds[3], cubeIds[7], cubeIds[5]);
      newCells.push(4, cubeIds[4], cubeIds[5], cubeIds[7], cubeIds[6]);
      newCells.push(4, cubeIds[2], cubeIds[6], cubeIds[7], cubeIds[3]);

      points.setData(pushArray(points.getData(), newPoints));
      cells.setData(pushArray(cells.getData(), newCells));
    } else if ((level < repLevel || repLevel < 0) && obbNode.getKids()) {
      generatePolygons(
        obbNode.getKids()[0],
        level + 1,
        repLevel,
        points,
        cells
      );
      generatePolygons(
        obbNode.getKids()[1],
        level + 1,
        repLevel,
        points,
        cells
      );
    }
  }

  /**
   * Transform the whole OBB tree by using input transform
   * @param {Transform} transform vtkjs Transform object
   */
  publicAPI.transform = (transform) => {
    // Setup matrix used to transform vectors
    const matrix = mat4.create();
    mat4.copy(matrix, transform.getMatrix());
    matrix[12] = 0;
    matrix[13] = 0;
    matrix[14] = 0;
    matrix[15] = 1;
    const transformVector = vtkMatrixBuilder
      .buildFromRadian()
      .setMatrix(matrix);

    const obbStack = new Array(model.level + 1);
    obbStack[0] = model.tree;
    let depth = 1;
    while (depth > 0) {
      depth -= 1;
      const node = obbStack[depth];

      const corner = node.getCorner();
      const max = node.getAxis(0);
      const mid = node.getAxis(1);
      const min = node.getAxis(2);

      transform.apply(corner);
      transformVector.apply(max);
      transformVector.apply(mid);
      transformVector.apply(min);

      node.setCorner(corner);
      node.setAxes([max, mid, min]);

      if (node.getKids() !== null) {
        // push kids onto stack
        obbStack[depth] = node.getKids()[0];
        obbStack[depth + 1] = node.getKids()[1];
        depth += 2;
      }
    }
  };

  /**
   * Deep copy input node into class attribute tree
   * @param {vtkOBBNode} tree
   * @returns
   */
  publicAPI.deepCopy = (tree) => {
    if (!tree) {
      return;
    }

    publicAPI.setLevel(tree.getLevel());
    publicAPI.setRetainCellLists(tree.getRetainCellLists());
    publicAPI.setDataset(tree.getDataset());
    publicAPI.setAutomatic(tree.getAutomatic());
    publicAPI.setNumberOfCellsPerNode(tree.getNumberOfCellsPerNode());
    publicAPI.setTolerance(tree.getTolerance());

    const root = tree.getTree();
    if (root) {
      model.tree = vtkOBBNode.newInstance();
      model.tree.deepCopy(root);
    }
  };

  /**
   * A method to compute the OBB of a dataset without having to go through the
   * Execute method; It does set
   * @param {vtkPolyData} input
   * @param {Array[3]} corner
   * @param {Array[3]} max
   * @param {Array[3]} mid
   * @param {Array[3]} min
   * @param {Array[3]} size
   */
  publicAPI.computeOBBFromDataset = (input, corner, max, mid, min, size) => {
    if (!input) {
      return;
    }
    const numPts = input.getPoints().getNumberOfPoints();
    const numCells = input.getNumberOfCells();
    if (numPts < 1 || numCells < 1) {
      vtkErrorMacro("Can't compute OBB - no data available!");
      return;
    }

    model.dataset = input;
    model.OBBCount = 0;
    model.insertedPoints = Array.from({ length: numPts }, (_) => 0);
    model.pointsList = [];
    const cellList = Array.from({ length: numCells }, (_, i) => i);
    computeOBB(cellList, corner, max, mid, min, size);
  };

  /**
   * Returns true if nodeB and nodeA are disjoint after optional
   * transformation of nodeB with matrix XformBtoA
   * @param {vtkOBBNode} nodeA
   * @param {vtkOBBNode} nodeB
   * @param {mat4} XformBtoA
   */
  publicAPI.disjointOBBNodes = (nodeA, nodeB, XformBtoA) => {
    if (!nodeA || !nodeB) {
      return 5; // A and B are disjoint
    }
    const input = new Array(4);
    const output = new Array(4);
    const eps = model.tolerance;
    const pA = nodeA;
    let pB = vtkOBBNode.newInstance();
    const dotAB = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    if (XformBtoA) {
      // Here we assume that XformBtoA is an orthogonal matrix
      input[0] = nodeB.getCorner()[0];
      input[1] = nodeB.getCorner()[1];
      input[2] = nodeB.getCorner()[2];
      input[3] = 1.0;
      vec4.transformMat4(output, input, XformBtoA);
      pB.setCorner([
        output[0] / output[3],
        output[1] / output[3],
        output[2] / output[3],
      ]);
      // Clean this up when the bug input MultiplyVectors is fixed!
      for (let ii = 0; ii < 3; ii++) {
        pB.getAxis(0)[ii] = nodeB.getCorner()[ii] + nodeB.getAxis(0)[ii];
        pB.getAxis(1)[ii] = nodeB.getCorner()[ii] + nodeB.getAxis(1)[ii];
        pB.getAxis(2)[ii] = nodeB.getCorner()[ii] + nodeB.getAxis(2)[ii];
      }
      for (let ii = 0; ii < 3; ii++) {
        input[0] = pB.getAxis(ii)[0];
        input[1] = pB.getAxis(ii)[1];
        input[2] = pB.getAxis(ii)[2];
        input[3] = 1.0;
        vec4.transformMat4(output, input, XformBtoA);
        pB.getAxis(ii)[0] = output[0] / output[3];
        pB.getAxis(ii)[1] = output[1] / output[3];
        pB.getAxis(ii)[2] = output[2] / output[3];
      }
      for (let ii = 0; ii < 3; ii++) {
        pB.getAxis(0)[ii] = pB.getAxis(0)[ii] - pB.getCorner()[ii];
        pB.getAxis(1)[ii] = pB.getAxis(1)[ii] - pB.getCorner()[ii];
        pB.getAxis(2)[ii] = pB.getAxis(2)[ii] - pB.getCorner()[ii];
      }
    } else {
      pB = nodeB;
    }
    const centerA = [0, 0, 0];
    const centerB = [0, 0, 0];
    const AtoB = [0, 0, 0];
    for (let ii = 0; ii < 3; ii++) {
      centerA[ii] =
        pA.getCorner()[ii] +
        0.5 * (pA.getAxis(0)[ii] + pA.getAxis(1)[ii] + pA.getAxis(2)[ii]);
      centerB[ii] =
        pB.getCorner()[ii] +
        0.5 * (pB.getAxis(0)[ii] + pB.getAxis(1)[ii] + pB.getAxis(2)[ii]);
      AtoB[ii] = centerB[ii] - centerA[ii];
    }

    // Project maximal and minimal corners onto line between centers
    let rangeAmin = vtkMath.dot(pA.getCorner(), AtoB);
    let rangeAmax = rangeAmin;
    let rangeBmin = vtkMath.dot(pB.getCorner(), AtoB);
    let rangeBmax = rangeBmin;
    let dotA = 0;
    let dotB = 0;
    for (let ii = 0; ii < 3; ii++) {
      // compute A range
      dotA = vtkMath.dot(pA.getAxis(ii), AtoB);
      if (dotA > 0) {
        rangeAmax += dotA;
      } else {
        rangeAmin += dotA;
      }

      // compute B range
      dotB = vtkMath.dot(pB.getAxis(ii), AtoB);
      if (dotB > 0) {
        rangeBmax += dotB;
      } else {
        rangeBmin += dotB;
      }
    }
    if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
      return 1; // A and B are Disjoint by the 1st test.
    }

    // now check for a separation plane parallel to the faces of B
    for (let ii = 0; ii < 3; ii++) {
      // plane is normal to pB.getAxis(ii)
      // computing B range is easy...
      rangeBmin = vtkMath.dot(pB.getCorner(), pB.getAxis(ii));
      rangeBmax = rangeBmin;
      rangeBmax += vtkMath.dot(pB.getAxis(ii), pB.getAxis(ii));

      // compute A range...
      rangeAmin = vtkMath.dot(pA.getCorner(), pB.getAxis(ii));
      rangeAmax = rangeAmin;
      for (let jj = 0; jj < 3; jj++) {
        // (note: we are saving all 9 dotproducts for future use)
        dotA = vtkMath.dot(pB.getAxis(ii), pA.getAxis(jj));
        dotAB[ii][jj] = dotA;
        if (dotA > 0) {
          rangeAmax += dotA;
        } else {
          rangeAmin += dotA;
        }
      }
      if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
        return 2; // A and B are Disjoint by the 3rd test.
      }
    }

    // now check for a separation plane parallel to the faces of A
    for (let ii = 0; ii < 3; ii++) {
      // plane is normal to pA.getAxis(ii)
      // computing A range is easy...
      rangeAmin = vtkMath.dot(pA.getCorner(), pA.getAxis(ii));
      rangeAmax = rangeAmin;
      rangeAmax += vtkMath.dot(pA.getAxis(ii), pA.getAxis(ii));

      // compute B range...
      rangeBmin = vtkMath.dot(pB.getCorner(), pA.getAxis(ii));
      rangeBmax = rangeBmin;
      for (let jj = 0; jj < 3; jj++) {
        // (note: we are using the 9 dotproducts computed earlier)
        dotB = dotAB[jj][ii];
        if (dotB > 0) {
          rangeBmax += dotB;
        } else {
          rangeBmin += dotB;
        }
      }
      if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
        return 3; // A and B are Disjoint by the 2nd test.
      }
    }

    // Bad luck: now we must look for a separation plane parallel
    // to one edge from A and one edge from B.
    for (let ii = 0; ii < 3; ii++) {
      for (let jj = 0; jj < 3; jj++) {
        // the plane is normal to pA.getAxis(ii) X pB.getAxis(jj)
        vtkMath.cross(pA.getAxis(ii), pB.getAxis(jj), AtoB);
        rangeAmin = vtkMath.dot(pA.getCorner(), AtoB);
        rangeAmax = rangeAmin;
        rangeBmin = vtkMath.dot(pB.getCorner(), AtoB);
        rangeBmax = rangeBmin;
        for (let kk = 0; kk < 3; kk++) {
          // compute A range
          dotA = vtkMath.dot(pA.getAxis(kk), AtoB);
          if (dotA > 0) {
            rangeAmax += dotA;
          } else {
            rangeAmin += dotA;
          }

          // compute B range
          dotB = vtkMath.dot(pB.getAxis(kk), AtoB);
          if (dotB > 0) {
            rangeBmax += dotB;
          } else {
            rangeBmin += dotB;
          }
        }
        if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
          return 4; // A and B are Disjoint by the 4th test.
        }
      }
    }
    // if we fall through to here, the OBB's overlap
    return 0;
  };

  /**
   * Intersect this OBBTree with OBBTreeB (as transformed) and
   * call processing function for each intersecting leaf node pair.
   * If the processing function returns a negative integer, terminate.
   * For each intersecting leaf node pair, call callback.
   * OBBTreeB is optionally transformed by XformBtoA before testing
   * @param {vtkOBBTree} obbTreeB
   * @param {mat4|null|undefined} XformBtoA
   * @param {function|null|undefined} callback Compared function that takes in argument:
   * nodeA (vtkOBBNode), nodeB (vtkOBBNode), XForm (mat4), arg
   */
  publicAPI.intersectWithOBBTree = (
    obbTreeB,
    XformBtoA,
    onIntersect = () => -1
  ) => {
    let maxDepth = model.level;
    let minDepth = obbTreeB.getLevel();
    if (minDepth > maxDepth) {
      minDepth = maxDepth;
      maxDepth = obbTreeB.getLevel();
    }

    const maxStackDepth = 3 * minDepth + 2 * (maxDepth - minDepth) + 1;
    const OBBStackA = new Array(maxStackDepth);
    const OBBStackB = new Array(maxStackDepth);
    OBBStackA[0] = model.tree;
    OBBStackB[0] = obbTreeB.getTree();
    let depth = 1;
    let count = 0;
    let returnValue = 0;
    // simulate recursion without overhead of real recursion.
    while (depth > 0 && returnValue > -1) {
      depth--;
      const nodeA = OBBStackA[depth];
      const nodeB = OBBStackB[depth];
      if (!publicAPI.disjointOBBNodes(nodeA, nodeB, XformBtoA)) {
        // Collision
        if (!nodeA.getKids()) {
          if (!nodeB.getKids()) {
            returnValue = onIntersect(nodeA, nodeB, XformBtoA);
            count += Math.abs(returnValue);
          } else {
            // A is a leaf, but B goes deeper.
            OBBStackA[depth] = nodeA;
            OBBStackB[depth] = nodeB.getKids()[0];
            OBBStackA[depth + 1] = nodeA;
            OBBStackB[depth + 1] = nodeB.getKids()[1];
            depth += 2;
          }
        } else if (!nodeB.getKids()) {
          // B is a leaf, but A goes deeper.
          OBBStackB[depth] = nodeB;
          OBBStackA[depth] = nodeA.getKids()[0];
          OBBStackB[depth + 1] = nodeB;
          OBBStackA[depth + 1] = nodeA.getKids()[1];
          depth += 2;
        } else {
          // neither A nor B are leaves. Go to the next level.
          OBBStackA[depth] = nodeA.getKids()[0];
          OBBStackB[depth] = nodeB.getKids()[0];
          OBBStackA[depth + 1] = nodeA.getKids()[1];
          OBBStackB[depth + 1] = nodeB.getKids()[0];
          OBBStackA[depth + 2] = nodeA.getKids()[0];
          OBBStackB[depth + 2] = nodeB.getKids()[1];
          OBBStackA[depth + 3] = nodeA.getKids()[1];
          OBBStackB[depth + 3] = nodeB.getKids()[1];
          depth += 4;
        }
      }
    }

    return count;
  };

  publicAPI.triangleIntersectsNode = (nodeA, p0, p1, p2, XformBtoA) => {
    const eps = model.tolerance;
    const pA = nodeA;
    const pB = [[...p0], [...p1], [...p2]];
    if (XformBtoA) {
      // Here we assume that XformBtoA is an orthogonal matrix
      const input = [0, 0, 0, 1];
      const output = [];
      for (let ii = 0; ii < 3; ii++) {
        input[0] = pB[ii][0];
        input[1] = pB[ii][1];
        input[2] = pB[ii][2];
        vec4.transformMat4(output, input, XformBtoA);
        pB[ii][0] = output[0] / output[3];
        pB[ii][1] = output[1] / output[3];
        pB[ii][2] = output[2] / output[3];
      }
    }

    // now check for a separation plane parallel to the triangle
    const v0 = [];
    const v1 = [];
    for (let ii = 0; ii < 3; ii++) {
      // plane is normal to the triangle
      v0[ii] = pB[1][ii] - pB[0][ii];
      v1[ii] = pB[2][ii] - pB[0][ii];
    }
    const xprod = vtkMath.cross(v0, v1, []);
    // computing B range is easy...
    let rangeBmax = vtkMath.dot(pB[0], xprod);
    let rangeBmin = rangeBmax;
    // compute A range...
    let rangeAmax = vtkMath.dot(pA.getCorner(), xprod);
    let rangeAmin = rangeAmax;
    let dotA;
    for (let jj = 0; jj < 3; jj++) {
      dotA = vtkMath.dot(xprod, pA.getAxis(jj));
      if (dotA > 0) {
        rangeAmax += dotA;
      } else {
        rangeAmin += dotA;
      }
    }
    if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
      return 0; // A and B are Disjoint by the 1st test.
    }

    // now check for a separation plane parallel to the faces of A
    for (let ii = 0; ii < 3; ii++) {
      // plane is normal to pA->Axes[ii]
      // computing A range is easy...
      rangeAmax = vtkMath.dot(pA.getCorner(), pA.getAxis(ii));
      rangeAmin = rangeAmax;
      rangeAmax += vtkMath.dot(pA.getAxis(ii), pA.getAxis(ii));

      // compute B range...
      rangeBmax = vtkMath.dot(pB[0], pA.getAxis(ii));
      rangeBmin = rangeBmax;
      let dotB = vtkMath.dot(pB[1], pA.getAxis(ii));
      if (dotB > rangeBmax) {
        rangeBmax = dotB;
      } else {
        rangeBmin = dotB;
      }

      dotB = vtkMath.dot(pB[2], pA.getAxis(ii));
      if (dotB > rangeBmax) {
        rangeBmax = dotB;
      } else if (dotB < rangeBmin) {
        rangeBmin = dotB;
      }

      if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
        return 0; // A and B are Disjoint by the 2nd test.
      }
    }

    // Bad luck: now we must look for a separation plane parallel
    // to one edge from A and one edge from B.
    const AtoB = [];
    let dotB;
    for (let ii = 0; ii < 3; ii++) {
      for (let jj = 0; jj < 3; jj++) {
        // the plane is normal to pA->Axes[ii] X (pB[jj+1]-pB[jj])
        v0[0] = pB[(jj + 1) % 3][0] - pB[jj][0];
        v0[1] = pB[(jj + 1) % 3][1] - pB[jj][1];
        v0[2] = pB[(jj + 1) % 3][2] - pB[jj][2];
        vtkMath.cross(pA.getAxis(ii), v0, AtoB);
        rangeAmax = vtkMath.dot(pA.getCorner(), AtoB);
        rangeAmin = rangeAmax;
        rangeBmax = vtkMath.dot(pB[jj], AtoB);
        rangeBmin = rangeBmax;
        for (let kk = 0; kk < 3; kk++) {
          // compute A range
          dotA = vtkMath.dot(pA.getAxis(kk), AtoB);
          if (dotA > 0) {
            rangeAmax += dotA;
          } else {
            rangeAmin += dotA;
          }
        }
        // compute B range
        dotB = vtkMath.dot(pB[(jj + 2) % 3], AtoB);
        if (dotB > rangeBmax) {
          rangeBmax = dotB;
        } else {
          rangeBmin = dotB;
        }

        if (rangeAmax + eps < rangeBmin || rangeBmax + eps < rangeAmin) {
          return 0; // A and B are Disjoint by the 3rd test.
        }
      }
    }

    // if we fall through to here, the OBB overlaps the triangle.
    return 1;
  };

  /**
   *
   * @param {*} info must be an object with { obbTree1, intersectionLines }
   * @param {*} node0
   * @param {*} node1
   * @param {*} transform
   * @returns the number of intersection lines found
   */
  publicAPI.findTriangleIntersections = (info, node0, node1, transform) => {
    // Set up local structures to hold Impl array information
    // vtkOBBTree* obbTree1 = info->OBBTree1;
    // vtkCellArray* intersectionLines = info->IntersectionLines;
    // vtkIdTypeArray* intersectionSurfaceId = info->SurfaceId;
    // vtkIdTypeArray* intersectionCellIds0 = info->CellIds[0];
    // vtkIdTypeArray* intersectionCellIds1 = info->CellIds[1];
    // vtkPointLocator* pointMerger = info->PointMerger;
    // double tolerance = info->Tolerance;
    const mesh0 = publicAPI.getDataset();
    const mesh1 = info.obbTree1.getDataset();
    const pointOffset = info.intersectionLines.getPoints().getNumberOfPoints();
    const intersectionPoints = [];
    const intersectionLines = [];

    // The number of cells in OBBTree
    const numCells0 = node0.getCells().length;

    for (let id0 = 0; id0 < numCells0; id0++) {
      const cellId0 = node0.getCells()[id0];
      const type0 = mesh0.getCellType(cellId0);

      // Make sure the cell is a triangle
      if (type0 === CellType.VTK_TRIANGLE) {
        const { cellPointIds: triPtIds0 } = mesh0.getCellPoints(cellId0);
        const triPts0 = [[], [], []];
        for (let id = 0; id < triPtIds0.length; id++) {
          mesh0.getPoints().getPoint(triPtIds0[id], triPts0[id]);
        }
        if (
          info.obbTree1.triangleIntersectsNode(
            node1,
            triPts0[0],
            triPts0[1],
            triPts0[2],
            transform
          )
        ) {
          const numCells1 = node1.getCells().length;
          for (let id1 = 0; id1 < numCells1; id1++) {
            const cellId1 = node1.getCells()[id1];
            const type1 = mesh1.getCellType(cellId1);
            if (type1 === CellType.VTK_TRIANGLE) {
              // See if the two cells actually intersect. If they do,
              // add an entry into the intersection maps and add an
              // intersection line.
              const { cellPointIds: triPtIds1 } = mesh1.getCellPoints(cellId1);
              const triPts1 = [[], [], []];
              for (let id = 0; id < triPtIds1.length; id++) {
                mesh1.getPoints().getPoint(triPtIds1[id], triPts1[id]);
              }

              const {
                intersect,
                coplanar,
                pt1: outpt0,
                pt2: outpt1,
                // surfaceId,
              } = vtkTriangle.intersectWithTriangle(
                ...triPts0,
                ...triPts1,
                model.tolerance
              );

              if (intersect && !coplanar) {
                const pointId = intersectionPoints.length / 3;
                intersectionPoints.push(...outpt0, ...outpt1);
                intersectionLines.push(
                  2,
                  pointOffset + pointId,
                  pointOffset + pointId + 1
                );
              }

              // If actual intersection, add point and cell to edge, line,
              // and surface maps!
              /*
              if (coplanar) {
                // Coplanar triangle intersection is not handled.
                // This intersection will not be included in the output. TODO
                // vtkDebugMacro(<<"Coplanar");
                intersects = false;
                continue;
              }
              if (intersects)
              {
                vtkIdType lineId = info.intersectionLines->GetNumberOfCells();
  
                vtkIdType ptId0, ptId1;
                int unique[2];
                unique[0] = pointMerger->InsertUniquePoint(outpt0, ptId0);
                unique[1] = pointMerger->InsertUniquePoint(outpt1, ptId1);
  
                int addline = 1;
                if (ptId0 == ptId1)
                {
                  addline = 0;
                }
  
                if (ptId0 == ptId1 && surfaceid[0] != surfaceid[1])
                {
                  intersectionSurfaceId->InsertValue(ptId0, 3);
                }
                else
                {
                  if (unique[0])
                  {
                    intersectionSurfaceId->InsertValue(ptId0, surfaceid[0]);
                  }
                  else
                  {
                    if (intersectionSurfaceId->GetValue(ptId0) != 3)
                    {
                      intersectionSurfaceId->InsertValue(ptId0, surfaceid[0]);
                    }
                  }
                  if (unique[1])
                  {
                    intersectionSurfaceId->InsertValue(ptId1, surfaceid[1]);
                  }
                  else
                  {
                    if (intersectionSurfaceId->GetValue(ptId1) != 3)
                    {
                      intersectionSurfaceId->InsertValue(ptId1, surfaceid[1]);
                    }
                  }
                }
  
                info->IntersectionPtsMap[0]->insert(std::make_pair(ptId0, cellId0));
                info->IntersectionPtsMap[1]->insert(std::make_pair(ptId0, cellId1));
                info->IntersectionPtsMap[0]->insert(std::make_pair(ptId1, cellId0));
                info->IntersectionPtsMap[1]->insert(std::make_pair(ptId1, cellId1));
  
                // Check to see if duplicate line. Line can only be a duplicate
                // line if both points are not unique and they don't
                // equal each other
                if (!unique[0] && !unique[1] && ptId0 != ptId1)
                {
                  vtkSmartPointer<vtkPolyData> lineTest = vtkSmartPointer<vtkPolyData>::New();
                  lineTest->SetPoints(pointMerger->GetPoints());
                  lineTest->SetLines(intersectionLines);
                  lineTest->BuildLinks();
                  int newLine = info->CheckLine(lineTest, ptId0, ptId1);
                  if (newLine == 0)
                  {
                    addline = 0;
                  }
                }
                if (addline)
                {
                  // If the line is new and does not consist of two identical
                  // points, add the line to the intersection and update
                  // mapping information
                  intersectionLines->InsertNextCell(2);
                  intersectionLines->InsertCellPoint(ptId0);
                  intersectionLines->InsertCellPoint(ptId1);
  
                  intersectionCellIds0->InsertNextValue(cellId0);
                  intersectionCellIds1->InsertNextValue(cellId1);
  
                  info->PointCellIds[0]->InsertValue(ptId0, cellId0);
                  info->PointCellIds[0]->InsertValue(ptId1, cellId0);
                  info->PointCellIds[1]->InsertValue(ptId0, cellId1);
                  info->PointCellIds[1]->InsertValue(ptId1, cellId1);
  
                  info->IntersectionMap[0]->insert(std::make_pair(cellId0, lineId));
                  info->IntersectionMap[1]->insert(std::make_pair(cellId1, lineId));
  
                  // Check which edges of cellId0 and cellId1 outpt0 and
                  // outpt1 are on, if any.
                  int isOnEdge = 0;
                  int m0p0 = 0, m0p1 = 0, m1p0 = 0, m1p1 = 0;
                  for (vtkIdType edgeId = 0; edgeId < 3; edgeId++)
                  {
                    isOnEdge = info->AddToPointEdgeMap(
                      0, ptId0, outpt0, mesh0, cellId0, edgeId, lineId, triPtIds0);
                    if (isOnEdge != -1)
                    {
                      m0p0++;
                    }
                    isOnEdge = info->AddToPointEdgeMap(
                      0, ptId1, outpt1, mesh0, cellId0, edgeId, lineId, triPtIds0);
                    if (isOnEdge != -1)
                    {
                      m0p1++;
                    }
                    isOnEdge = info->AddToPointEdgeMap(
                      1, ptId0, outpt0, mesh1, cellId1, edgeId, lineId, triPtIds1);
                    if (isOnEdge != -1)
                    {
                      m1p0++;
                    }
                    isOnEdge = info->AddToPointEdgeMap(
                      1, ptId1, outpt1, mesh1, cellId1, edgeId, lineId, triPtIds1);
                    if (isOnEdge != -1)
                    {
                      m1p1++;
                    }
                  }
                  // Special cases caught by tolerance and not from the Point
                  // Merger
                  if (m0p0 > 0 && m1p0 > 0)
                  {
                    intersectionSurfaceId->InsertValue(ptId0, 3);
                  }
                  if (m0p1 > 0 && m1p1 > 0)
                  {
                    intersectionSurfaceId->InsertValue(ptId1, 3);
                  }
                }
                // Add information about origin surface to std::maps for
                // checks later
                if (intersectionSurfaceId->GetValue(ptId0) == 1)
                {
                  info->IntersectionPtsMap[0]->insert(std::make_pair(ptId0, cellId0));
                }
                else if (intersectionSurfaceId->GetValue(ptId0) == 2)
                {
                  info->IntersectionPtsMap[1]->insert(std::make_pair(ptId0, cellId1));
                }
                else
                {
                  info->IntersectionPtsMap[0]->insert(std::make_pair(ptId0, cellId0));
                  info->IntersectionPtsMap[1]->insert(std::make_pair(ptId0, cellId1));
                }
                if (intersectionSurfaceId->GetValue(ptId1) == 1)
                {
                  info->IntersectionPtsMap[0]->insert(std::make_pair(ptId1, cellId0));
                }
                else if (intersectionSurfaceId->GetValue(ptId1) == 2)
                {
                  info->IntersectionPtsMap[1]->insert(std::make_pair(ptId1, cellId1));
                }
                else
                {
                  info->IntersectionPtsMap[0]->insert(std::make_pair(ptId1, cellId0));
                  info->IntersectionPtsMap[1]->insert(std::make_pair(ptId1, cellId1));
                }
              }
              */
            }
          }
        }
      }
    }

    if (intersectionPoints.length) {
      const points = vtkPoints.newInstance();
      points.setData(
        pushArray(
          info.intersectionLines.getPoints().getData(),
          intersectionPoints
        )
      );
      info.intersectionLines.setPoints(points);

      const lines = vtkCellArray.newInstance();
      lines.setData(
        pushArray(
          info.intersectionLines.getLines().getData(),
          intersectionLines
        )
      );
      info.intersectionLines.setLines(lines);
    }
    return intersectionLines.length / 3;
  };

  /**
   * Create polygonal representation for OBB tree at specified level. If
   * level < 0, then the leaf OBB nodes will be gathered. The aspect ratio (ar)
   * and line diameter (d) are used to control the building of the
   * representation. If a OBB node edge ratio's are greater than ar, then the
   * dimension of the OBB is collapsed (OBB->plane->line). A "line" OBB will be
   * represented either as two crossed polygons, or as a line, depending on
   * the relative diameter of the OBB compared to the diameter (d).
   * @param {Number} level Level of the representation
   * @returns {vtkPolyData}
   */
  publicAPI.generateRepresentation = (level) => {
    if (!model.tree) {
      vtkErrorMacro('No tree to generate representation for');
      return null;
    }

    const points = vtkPoints.newInstance();
    const polys = vtkCellArray.newInstance();

    generatePolygons(model.tree, 0, level, points, polys);

    const output = vtkPolyData.newInstance();
    output.setPoints(points);
    output.setPolys(polys);
    return output;
  };

  publicAPI.buildLocator = () => {
    if (model.dataset === null) {
      vtkErrorMacro("Can't build OBB tree - no data available!");
      return;
    }

    const numPts = model.dataset.getPoints().getNumberOfPoints();
    const numCells = model.dataset.getNumberOfCells();
    if (numPts < 1 || numCells < 1) {
      vtkErrorMacro("Can't build OBB tree - no data available!");
      return;
    }

    model.OBBCount = 0;
    // Initialize an array of numPts elements set to value 0
    model.insertedPoints = Array.from({ length: numPts }, (_) => 0);
    model.pointsList = [];

    const cellList = Array.from({ length: numCells }, (_, i) => i);

    model.tree = vtkOBBNode.newInstance();
    model.level = 0;

    buildTree(cellList, model.tree, 0);

    model.insertedPoints = [];
    model.pointsList = [];
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tolerance: 0.01,
  automatic: true,
  numberOfCellsPerNode: 32,
  dataset: null,
  tree: null,
  pointsList: [],
  insertedPoints: [],
  OBBCount: 0,
  level: 8,
  maxLevel: 8,
  retainCellLists: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'tolerance',
    'automatic',
    'numberOfCellsPerNode',
    'dataset',
    'tree',
    'maxLevel',
    'level',
    'retainCellLists',
  ]);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Object specific methods
  vtkOBBTree(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBBTree');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
