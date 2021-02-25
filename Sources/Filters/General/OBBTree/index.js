import macro from 'vtk.js/Sources/macro';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkOBBNode from 'vtk.js/Sources/Filters/General/OBBTree/OBBNode';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import {
  getCellTriangles,
  Float32Concat,
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
      let pointsData = points.getData();
      let nbPoints = points.getNumberOfPoints();
      let cellsData = cells.getData();
      const x = new Float32Array(3);
      const cubeIds = new Array(8);
      const ptIds = new Float32Array(4);

      x[0] = obbNode.getCorner()[0];
      x[1] = obbNode.getCorner()[1];
      x[2] = obbNode.getCorner()[2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[0] = nbPoints++;

      x[0] = obbNode.getCorner()[0] + obbNode.getAxes()[0][0];
      x[1] = obbNode.getCorner()[1] + obbNode.getAxes()[0][1];
      x[2] = obbNode.getCorner()[2] + obbNode.getAxes()[0][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[1] = nbPoints++;

      x[0] = obbNode.getCorner()[0] + obbNode.getAxes()[1][0];
      x[1] = obbNode.getCorner()[1] + obbNode.getAxes()[1][1];
      x[2] = obbNode.getCorner()[2] + obbNode.getAxes()[1][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[2] = nbPoints++;

      x[0] =
        obbNode.getCorner()[0] +
        obbNode.getAxes()[0][0] +
        obbNode.getAxes()[1][0];
      x[1] =
        obbNode.getCorner()[1] +
        obbNode.getAxes()[0][1] +
        obbNode.getAxes()[1][1];
      x[2] =
        obbNode.getCorner()[2] +
        obbNode.getAxes()[0][2] +
        obbNode.getAxes()[1][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[3] = nbPoints++;

      x[0] = obbNode.getCorner()[0] + obbNode.getAxes()[2][0];
      x[1] = obbNode.getCorner()[1] + obbNode.getAxes()[2][1];
      x[2] = obbNode.getCorner()[2] + obbNode.getAxes()[2][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[4] = nbPoints++;

      x[0] =
        obbNode.getCorner()[0] +
        obbNode.getAxes()[0][0] +
        obbNode.getAxes()[2][0];
      x[1] =
        obbNode.getCorner()[1] +
        obbNode.getAxes()[0][1] +
        obbNode.getAxes()[2][1];
      x[2] =
        obbNode.getCorner()[2] +
        obbNode.getAxes()[0][2] +
        obbNode.getAxes()[2][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[5] = nbPoints++;

      x[0] =
        obbNode.getCorner()[0] +
        obbNode.getAxes()[1][0] +
        obbNode.getAxes()[2][0];
      x[1] =
        obbNode.getCorner()[1] +
        obbNode.getAxes()[1][1] +
        obbNode.getAxes()[2][1];
      x[2] =
        obbNode.getCorner()[2] +
        obbNode.getAxes()[1][2] +
        obbNode.getAxes()[2][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[6] = nbPoints++;

      x[0] =
        obbNode.getCorner()[0] +
        obbNode.getAxes()[0][0] +
        obbNode.getAxes()[1][0] +
        obbNode.getAxes()[2][0];
      x[1] =
        obbNode.getCorner()[1] +
        obbNode.getAxes()[0][1] +
        obbNode.getAxes()[1][1] +
        obbNode.getAxes()[2][1];
      x[2] =
        obbNode.getCorner()[2] +
        obbNode.getAxes()[0][2] +
        obbNode.getAxes()[1][2] +
        obbNode.getAxes()[2][2];
      pointsData = Float32Concat(pointsData, x);
      cubeIds[7] = nbPoints++;

      ptIds[0] = cubeIds[0];
      ptIds[1] = cubeIds[2];
      ptIds[2] = cubeIds[3];
      ptIds[3] = cubeIds[1];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      ptIds[0] = cubeIds[0];
      ptIds[1] = cubeIds[1];
      ptIds[2] = cubeIds[5];
      ptIds[3] = cubeIds[4];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      ptIds[0] = cubeIds[0];
      ptIds[1] = cubeIds[4];
      ptIds[2] = cubeIds[6];
      ptIds[3] = cubeIds[2];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      ptIds[0] = cubeIds[1];
      ptIds[1] = cubeIds[3];
      ptIds[2] = cubeIds[7];
      ptIds[3] = cubeIds[5];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      ptIds[0] = cubeIds[4];
      ptIds[1] = cubeIds[5];
      ptIds[2] = cubeIds[7];
      ptIds[3] = cubeIds[6];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      ptIds[0] = cubeIds[2];
      ptIds[1] = cubeIds[6];
      ptIds[2] = cubeIds[7];
      ptIds[3] = cubeIds[3];
      cellsData = Float32Concat(cellsData, [4, ...cubeIds]);

      points.setData(pointsData);
      cells.setData(cellsData);
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
   * Copy a vtkOBBNode into an other one
   * @param {vtkOBBNode} nodeSource
   * @param {vtkOBBNode} nodeTarget
   */
  function copyOBBNode(nodeSource, nodeTarget) {
    nodeTarget.setCorner(nodeSource.getCorner());
    const axes = nodeSource.getAxes();
    const newAxes = [[...axes[0]], [...axes[1]], [...axes[2]]];
    nodeTarget.setAxes(newAxes);
    nodeTarget.setCells([...nodeSource.getCells()]);

    if (nodeSource.getKids()) {
      const kids0 = vtkOBBNode.newInstance();
      kids0.setParent(nodeTarget);
      const kids1 = vtkOBBNode.newInstance();
      kids1.setParent(nodeTarget);

      copyOBBNode(nodeSource.getKids()[0], kids0);
      copyOBBNode(nodeSource.getKids()[1], kids1);

      nodeTarget.setKids([kids0, kids1]);
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
      const max = node.getAxes()[0];
      const mid = node.getAxes()[1];
      const min = node.getAxes()[2];

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
      copyOBBNode(root, model.tree);
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
        pB.getAxes()[0][ii] = nodeB.getCorner()[ii] + nodeB.getAxes()[0][ii];
        pB.getAxes()[1][ii] = nodeB.getCorner()[ii] + nodeB.getAxes()[1][ii];
        pB.getAxes()[2][ii] = nodeB.getCorner()[ii] + nodeB.getAxes()[2][ii];
      }
      for (let ii = 0; ii < 3; ii++) {
        input[0] = pB.getAxes()[ii][0];
        input[1] = pB.getAxes()[ii][1];
        input[2] = pB.getAxes()[ii][2];
        input[3] = 1.0;
        vec4.transformMat4(output, input, XformBtoA);
        pB.getAxes()[ii][0] = output[0] / output[3];
        pB.getAxes()[ii][1] = output[1] / output[3];
        pB.getAxes()[ii][2] = output[2] / output[3];
      }
      for (let ii = 0; ii < 3; ii++) {
        pB.getAxes()[0][ii] = pB.getAxes()[0][ii] - pB.getCorner()[ii];
        pB.getAxes()[1][ii] = pB.getAxes()[1][ii] - pB.getCorner()[ii];
        pB.getAxes()[2][ii] = pB.getAxes()[2][ii] - pB.getCorner()[ii];
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
        0.5 * (pA.getAxes()[0][ii] + pA.getAxes()[1][ii] + pA.getAxes()[2][ii]);
      centerB[ii] =
        pB.getCorner()[ii] +
        0.5 * (pB.getAxes()[0][ii] + pB.getAxes()[1][ii] + pB.getAxes()[2][ii]);
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
      dotA = vtkMath.dot(pA.getAxes()[ii], AtoB);
      if (dotA > 0) {
        rangeAmax += dotA;
      } else {
        rangeAmin += dotA;
      }

      // compute B range
      dotB = vtkMath.dot(pB.getAxes()[ii], AtoB);
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
      // plane is normal to pB.getAxes()[ii]
      // computing B range is easy...
      rangeBmin = vtkMath.dot(pB.getCorner(), pB.getAxes()[ii]);
      rangeBmax = rangeBmin;
      rangeBmax += vtkMath.dot(pB.getAxes()[ii], pB.getAxes()[ii]);

      // compute A range...
      rangeAmin = vtkMath.dot(pA.getCorner(), pB.getAxes()[ii]);
      rangeAmax = rangeAmin;
      for (let jj = 0; jj < 3; jj++) {
        // (note: we are saving all 9 dotproducts for future use)
        dotA = vtkMath.dot(pB.getAxes()[ii], pA.getAxes()[jj]);
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
      // plane is normal to pA.getAxes()[ii]
      // computing A range is easy...
      rangeAmin = vtkMath.dot(pA.getCorner(), pA.getAxes()[ii]);
      rangeAmax = rangeAmin;
      rangeAmax += vtkMath.dot(pA.getAxes()[ii], pA.getAxes()[ii]);

      // compute B range...
      rangeBmin = vtkMath.dot(pB.getCorner(), pA.getAxes()[ii]);
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
        // the plane is normal to pA.getAxes()[ii] X pB.getAxes()[jj]
        vtkMath.cross(pA.getAxes()[ii], pB.getAxes()[jj], AtoB);
        rangeAmin = vtkMath.dot(pA.getCorner(), AtoB);
        rangeAmax = rangeAmin;
        rangeBmin = vtkMath.dot(pB.getCorner(), AtoB);
        rangeBmax = rangeBmin;
        for (let kk = 0; kk < 3; kk++) {
          // compute A range
          dotA = vtkMath.dot(pA.getAxes()[kk], AtoB);
          if (dotA > 0) {
            rangeAmax += dotA;
          } else {
            rangeAmin += dotA;
          }

          // compute B range
          dotB = vtkMath.dot(pB.getAxes()[kk], AtoB);
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
   * @param {mat4} XformBtoA
   * @param {function} callback Compared function that takes in argument:
   * nodeA (vtkOBBNode), nodeB (vtkOBBNode), XForm (mat4), arg
   * @param {*} dataArg
   */
  publicAPI.intersectWithOBBTree = (obbTreeB, XformBtoA, callback, dataArg) => {
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
    const returnValue = 0;
    // simulate recursion without overhead of real recursion.
    while (depth > 0 && returnValue > -1) {
      depth--;
      const nodeA = OBBStackA[depth];
      const nodeB = OBBStackB[depth];
      if (!publicAPI.disjointOBBNodes(nodeA, nodeB, XformBtoA)) {
        // Collision
        if (!nodeA.getKids()) {
          if (!nodeB.getKids()) {
            return true;
          }
          // A is a leaf, but B goes deeper.
          OBBStackA[depth] = nodeA;
          OBBStackB[depth] = nodeB.getKids()[0];
          OBBStackA[depth + 1] = nodeA;
          OBBStackB[depth + 1] = nodeB.getKids()[1];
          depth += 2;
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

    return false;
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

    if (model.tree) {
      model.tree = null;
    }
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
