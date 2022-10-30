import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkErrorMacro } = macro;

const OCTREENODE_INSERTPOINT = [
  (points, pointIdx, coords) => pointIdx,
  (points, pointIdx, coords) => {
    points.setTuple(pointIdx, coords);
    return pointIdx;
  },
  (points, pointIdx, coords) => points.insertNextTuple(coords),
];

// Given the index (0 ~ 7) of a child node, the spatial bounding axis (0 ~ 2
// for x, y, and z), and the value (0 ~ 1 for min and max) to access, this LUT
// allows for rapid assignment of its spatial bounding box --- MinBounds[3]
// and MaxBounds[3], with each specific value or entry of this LUT pointing to
// MinBounds[3] for 0, center point for 1, or MaxBounds[3] for 2.
const OCTREE_CHILD_BOUNDS_LUT = [
  [
    [0, 1],
    [0, 1],
    [0, 1],
  ],
  [
    [1, 2],
    [0, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 2],
    [0, 1],
  ],
  [
    [1, 2],
    [1, 2],
    [0, 1],
  ],

  [
    [0, 1],
    [0, 1],
    [1, 2],
  ],
  [
    [1, 2],
    [0, 1],
    [1, 2],
  ],
  [
    [0, 1],
    [1, 2],
    [1, 2],
  ],
  [
    [1, 2],
    [1, 2],
    [1, 2],
  ],
];

function vtkIncrementalOctreeNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkIncrementalOctreeNode');

  //------------------------------------------------------------------------------
  publicAPI.createPointIdSet = (initSize, growSize) => {
    if (model.pointIdSet == null) {
      model.pointIdSet = [];
      // TODO: use initSize and growSize.
      // model.pointIdSet.allocate(initSize, growSize);
    }
  };

  //------------------------------------------------------------------------------
  publicAPI.setBounds = (x1, x2, y1, y2, z1, z2) => {
    if (model.minBounds == null) model.minBounds = [];
    if (model.maxBounds == null) model.maxBounds = [];
    if (model.minDataBounds == null) model.minDataBounds = [];
    if (model.maxDataBounds == null) model.maxDataBounds = [];

    model.minBounds[0] = x1;
    model.maxBounds[0] = x2;
    model.minBounds[1] = y1;
    model.maxBounds[1] = y2;
    model.minBounds[2] = z1;
    model.maxBounds[2] = z2;

    model.minDataBounds[0] = x2;
    model.maxDataBounds[0] = x1;
    model.minDataBounds[1] = y2;
    model.maxDataBounds[1] = y1;
    model.minDataBounds[2] = z2;
    model.maxDataBounds[2] = z1;
  };

  //------------------------------------------------------------------------------
  publicAPI.getBounds = (bounds) => {
    bounds[0] = model.minBounds[0];
    bounds[1] = model.maxBounds[0];
    bounds[2] = model.minBounds[1];
    bounds[3] = model.maxBounds[1];
    bounds[4] = model.minBounds[2];
    bounds[5] = model.maxBounds[2];
  };

  publicAPI.getChildIndex = (point) =>
    Number(point[0] > model.children[0].getMaxBoundsByReference()[0]) +
    // eslint-disable-next-line no-bitwise
    (Number(point[1] > model.children[0].getMaxBoundsByReference()[1]) << 1) +
    // eslint-disable-next-line no-bitwise
    (Number(point[2] > model.children[0].getMaxBoundsByReference()[2]) << 2);

  publicAPI.containsPoint = (pnt) =>
    model.minBounds[0] < pnt[0] &&
    pnt[0] <= model.maxBounds[0] &&
    model.minBounds[1] < pnt[1] &&
    pnt[1] <= model.maxBounds[1] &&
    model.minBounds[2] < pnt[2] &&
    pnt[2] <= model.maxBounds[2]
      ? 1
      : 0;

  publicAPI.containsPointByData = (pnt) =>
    model.minDataBounds[0] <= pnt[0] &&
    pnt[0] <= model.maxDataBounds[0] &&
    model.minDataBounds[1] <= pnt[1] &&
    pnt[1] <= model.maxDataBounds[1] &&
    model.minDataBounds[2] <= pnt[2] &&
    pnt[2] <= model.maxDataBounds[2]
      ? 1
      : 0;

  //------------------------------------------------------------------------------
  publicAPI.updateCounterAndDataBounds = (point, nHits, updateData) => {
    model.numberOfPoints += nHits;

    if (!updateData) return false;

    let updated = false;

    if (point[0] < model.minDataBounds[0]) {
      updated = true;
      model.minDataBounds[0] = point[0];
    }
    if (point[0] > model.maxDataBounds[0]) {
      updated = true;
      model.maxDataBounds[0] = point[0];
    }

    if (point[1] < model.minDataBounds[1]) {
      updated = true;
      model.minDataBounds[1] = point[1];
    }
    if (point[1] > model.maxDataBounds[1]) {
      updated = true;
      model.maxDataBounds[1] = point[1];
    }

    if (point[2] < model.minDataBounds[2]) {
      updated = true;
      model.minDataBounds[2] = point[2];
    }
    if (point[2] > model.maxDataBounds[2]) {
      updated = true;
      model.maxDataBounds[2] = point[2];
    }

    return updated;
  };

  //------------------------------------------------------------------------------
  publicAPI.updateCounterAndDataBoundsRecursively = (
    point,
    nHits,
    updateData,
    endNode
  ) => {
    const updated = publicAPI.updateCounterAndDataBounds(
      point,
      nHits,
      updateData
    );

    return model.parent === endNode
      ? updated
      : model.parent.updateCounterAndDataBoundsRecursively(
          point,
          nHits,
          updated,
          endNode
        );
  };

  //------------------------------------------------------------------------------
  publicAPI.containsDuplicatePointsOnly = (point) =>
    model.minDataBounds[0] === point[0] &&
    point[0] === model.maxDataBounds[0] &&
    model.minDataBounds[1] === point[1] &&
    point[1] === model.maxDataBounds[1] &&
    model.minDataBounds[2] === point[2] &&
    point[2] === model.maxDataBounds[2];

  //------------------------------------------------------------------------------
  publicAPI.isLeaf = () => model.children == null;

  //------------------------------------------------------------------------------
  publicAPI.getChild = (i) => model.children[i];

  //------------------------------------------------------------------------------
  /* eslint-disable no-use-before-define */
  publicAPI.separateExactlyDuplicatePointsFromNewInsertion = (
    points,
    pntIds,
    newPnt,
    pntIdx,
    maxPts,
    ptMode
  ) => {
    // the number of points already maintained in this leaf node
    // >= maxPts AND all of them are exactly duplicate with one another
    //           BUT the new point is not a duplicate of them any more
    let pointIdx = pntIdx;
    let i;
    const dupPnt = [0.0, 0.0, 0.0];
    const octMin = [0.0, 0.0, 0.0];
    const octMid = [0.0, 0.0, 0.0];
    const octMax = [0.0, 0.0, 0.0];
    const boxPtr = [null, null, null];
    let ocNode = null;
    let duplic = publicAPI;
    let single = publicAPI;

    // the coordinate of the duplicate points: note pntIds == model.pointIdSet
    points.getPoint(pntIds[0], dupPnt);

    while (duplic === single) {
      // as long as separation has not been achieved
      // update the current (in recursion) node and access the bounding box info
      ocNode = duplic;
      octMid[0] = (ocNode.minBounds[0] + ocNode.maxBounds[0]) * 0.5;
      octMid[1] = (ocNode.minBounds[1] + ocNode.maxBounds[1]) * 0.5;
      octMid[2] = (ocNode.minBounds[2] + ocNode.maxBounds[2]) * 0.5;
      boxPtr[0] = ocNode.minBounds;
      boxPtr[1] = octMid;
      boxPtr[2] = ocNode.maxBounds;

      // create eight child nodes
      // FIXME: May be too slow to use vtk newInstance()
      ocNode.children = [
        newInstance(),
        newInstance(),
        newInstance(),
        newInstance(),
        newInstance(),
        newInstance(),
        newInstance(),
        newInstance(),
      ];
      for (i = 0; i < 8; i++) {
        // x-bound: axis 0
        octMin[0] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][0][0]][0];
        octMax[0] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][0][1]][0];

        // y-bound: axis 1
        octMin[1] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][1][0]][1];
        octMax[1] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][1][1]][1];

        // z-bound: axis 2
        octMin[2] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][2][0]][2];
        octMax[2] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][2][1]][2];

        ocNode.children[i] = newInstance();
        ocNode.children[i].setParent(ocNode);
        ocNode.children[i].setBounds(
          octMin[0],
          octMax[0],
          octMin[1],
          octMax[1],
          octMin[2],
          octMax[2]
        );
      }

      // determine the leaf node of the duplicate points & that of the new point
      duplic = ocNode.children[ocNode.getChildIndex(dupPnt)];
      single = ocNode.children[ocNode.getChildIndex(newPnt)];
    }
    // Now the duplicate points have been separated from the new point //

    // create a vtkIdList object for the new point
    // update the counter and the data bounding box until the root node
    // (including the root node)
    pointIdx = OCTREENODE_INSERTPOINT[ptMode](points, pointIdx, newPnt);
    // eslint-disable-next-line no-bitwise
    single.createPointIdSet(maxPts >> 2, maxPts >> 1);
    single.getPointIdSet().push(pointIdx);
    single.updateCounterAndDataBoundsRecursively(newPnt, 1, 1, null);

    // We just need to reference pntIds while un-registering it from 'this'.
    // This avoids deep-copying point ids from pntIds to duplic's PointIdSet.
    // update the counter and the data bounding box, but until 'this' node
    // (excluding 'this' node)
    duplic.setPointIdSet(pntIds);
    duplic.updateCounterAndDataBoundsRecursively(
      dupPnt,
      pntIds.length,
      1,
      publicAPI
    );
    return pointIdx;
  };
  /* eslint-enable no-use-before-define */

  //------------------------------------------------------------------------------
  publicAPI.createChildNodes = (
    points,
    pntIds,
    newPnt,
    pntIdx,
    maxPts,
    ptMode,
    numberOfNodes
  ) => {
    // There are two scenarios for which this function is invoked.
    //
    // (1) the number of points already maintained in this leaf node
    //     == maxPts AND not all of them are exactly duplicate
    //               AND the new point is not a duplicate of them all
    // (2) the number of points already maintained in this leaf node
    //     >= maxPts AND all of them are exactly duplicate with one another
    //               BUT the new point is not a duplicate of them any more

    // address case (2) first if necessary
    let nbNodes = numberOfNodes;
    let pointIdx = pntIdx;
    const sample = [];
    points.getPoint(pntIds[0], sample);
    if (publicAPI.containsDuplicatePointsOnly(sample)) {
      pointIdx = publicAPI.separateExactlyDuplicatePointsFromNewInsertion(
        points,
        pntIds,
        newPnt,
        pointIdx,
        maxPts,
        ptMode
      );
      return { success: false, nbNodes, pointIdx };
    }

    // then address case (1) below
    let i;
    let target;
    let dvidId = -1; // index of the sub-dividing octant, if any
    let fullId = -1; // index of the full octant, if any
    const numIds = [0, 0, 0, 0, 0, 0, 0, 0];
    const octMin = [];
    const octMax = [];
    const tempPt = [];
    let tempId;

    const octMid = [
      (model.minBounds[0] + model.maxBounds[0]) * 0.5,
      (model.minBounds[1] + model.maxBounds[1]) * 0.5,
      (model.minBounds[2] + model.maxBounds[2]) * 0.5,
    ];
    const boxPtr = [model.minBounds, octMid, model.maxBounds];

    // create eight child nodes
    model.children = [];
    for (i = 0; i < 8; i++) {
      // x-bound: axis 0
      octMin[0] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][0][0]][0];
      octMax[0] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][0][1]][0];

      // y-bound: axis 1
      octMin[1] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][1][0]][1];
      octMax[1] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][1][1]][1];

      // z-bound: axis 2
      octMin[2] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][2][0]][2];
      octMax[2] = boxPtr[OCTREE_CHILD_BOUNDS_LUT[i][2][1]][2];

      // This call internally sets the cener and default data bounding box, too.
      // eslint-disable-next-line no-use-before-define
      model.children[i] = newInstance();
      // model.children[i].iD = nbNodes++;
      model.children[i].setParent(publicAPI);
      model.children[i].setBounds(
        octMin[0],
        octMax[0],
        octMin[1],
        octMax[1],
        octMin[2],
        octMax[2]
      );

      // allocate a list of point-indices (size = 2^n) for index registration
      // eslint-disable-next-line no-bitwise
      model.children[i].createPointIdSet(maxPts >> 2, maxPts >> 1);
    }
    boxPtr[0] = null;
    boxPtr[1] = null;
    boxPtr[2] = null;

    // distribute the available point-indices to the eight child nodes
    for (i = 0; i < maxPts; i++) {
      tempId = pntIds[i];
      points.getPoint(tempId, tempPt);
      target = publicAPI.getChildIndex(tempPt);
      model.children[target].getPointIdSet().push(tempId);
      model.children[target].updateCounterAndDataBounds(tempPt);
      numIds[target]++;
    }

    // locate the full child, just if any
    for (i = 0; i < 8; i++) {
      if (numIds[i] === maxPts) {
        fullId = i;
        break;
      }
    }

    target = publicAPI.getChildIndex(newPnt);
    if (fullId === target) {
      // The fact is that we are going to insert the new point to an already
      // full octant (child node). Thus we need to further divide this child
      // to avoid the overflow problem.
      ({ numberOfNodes: nbNodes, pointIdx } = model.children[
        target
      ].createChildNodes(
        points,
        pntIds,
        newPnt,
        pointIdx,
        maxPts,
        ptMode,
        nbNodes
      ));
      dvidId = fullId;
    } else {
      // the initial division is a success
      pointIdx = OCTREENODE_INSERTPOINT[ptMode](points, pointIdx, newPnt);
      model.children[target].getPointIdSet().push(pointIdx);
      model.children[target].updateCounterAndDataBoundsRecursively(
        newPnt,
        1,
        1,
        null
      );

      // NOTE: The counter below might reach the threshold, though we delay the
      // sub-division of this child node until the next point insertion occurs.
      numIds[target]++;
    }

    // Now it is time to reclaim those un-used vtkIdList objects, of which each
    // either is empty or still needs to be deleted due to further division of
    // the child node. This post-deallocation of the un-used vtkIdList objects
    // (of some child nodes) is based on the assumption that retrieving the
    // 'maxPts' points from vtkPoints and the associated 'maxPts' point-indices
    // from vtkIdList is more expensive than reclaiming at most 8 vtkIdList
    // objects at hand.
    for (i = 0; i < 8; i++) {
      if (numIds[i] === 0 || i === dvidId) {
        model.children[i].getPointIdSet().length = 0;
      }
    }

    // notify vtkIncrementalOctreeNode::InsertPoint() to destroy pntIds
    return { success: true, numberOfNodes: nbNodes, pointIdx };
  };

  //------------------------------------------------------------------------------
  publicAPI.insertPoint = (
    points,
    newPnt,
    maxPts,
    pntId,
    ptMode,
    numberOfNodes
  ) => {
    let nbNodes = 0;
    let pointIdx = pntId;

    if (model.pointIdSet) {
      // there has been at least one point index
      if (
        model.pointIdSet.length < maxPts ||
        publicAPI.containsDuplicatePointsOnly(newPnt)
      ) {
        // this leaf node is not full or
        // this leaf node is full, but of all exactly duplicate points
        // and the point under check is another duplicate of these points
        pointIdx = OCTREENODE_INSERTPOINT[ptMode](points, pointIdx, newPnt);
        model.pointIdSet.push(pointIdx);
        publicAPI.updateCounterAndDataBoundsRecursively(newPnt, 1, 1, null);
      } else {
        // overflow: divide this node and delete the list of point-indices.
        // Note that the number of exactly duplicate points might be greater
        // than or equal to maxPts.
        ({ numberOfNodes: nbNodes, pointIdx } = publicAPI.createChildNodes(
          points,
          model.pointIdSet,
          newPnt,
          pointIdx,
          maxPts,
          ptMode,
          numberOfNodes
        ));
        model.pointIdSet = null;
      }
    } else {
      // There has been no any point index registered in this leaf node
      pointIdx = OCTREENODE_INSERTPOINT[ptMode](points, pointIdx, newPnt);
      model.pointIdSet = [];
      model.pointIdSet.push(pointIdx);
      publicAPI.updateCounterAndDataBoundsRecursively(newPnt, 1, 1, null);
    }

    return { numberOfNodes: numberOfNodes + nbNodes, pointIdx };
  };

  //------------------------------------------------------------------------------
  publicAPI.getDistance2ToBoundary = (
    point,
    closest,
    innerOnly,
    rootNode,
    checkData
  ) => {
    // It is mandatory that GetMinDataBounds() and GetMaxDataBounds() be used.
    // Direct access to MinDataBounds and MaxDataBounds might incur problems.
    let thisMin = null;
    let thisMax = null;
    let rootMin = null;
    let rootMax = null;
    // TODO: Check
    // let minDist = VTK_DOUBLE_MAX;
    let minDist = Number.MAX_VALUE; // minimum distance to the boundaries
    if (checkData) {
      thisMin = publicAPI.getMinDataBounds();
      thisMax = publicAPI.getMaxDataBounds();
      rootMin = rootNode.getMinDataBounds();
      rootMax = rootNode.getMaxDataBounds();
    } else {
      thisMin = model.minBounds;
      thisMax = model.maxBounds;
      rootMin = rootNode.getMinBounds();
      rootMax = rootNode.getMaxBounds();
    }

    let minFace = 0; // index of the face with min distance to the point
    const beXless = Number(point[0] < thisMin[0]);
    const beXmore = Number(point[0] > thisMax[0]);
    const beYless = Number(point[1] < thisMin[1]);
    const beYmore = Number(point[1] > thisMax[1]);
    const beZless = Number(point[2] < thisMin[2]);
    const beZmore = Number(point[2] > thisMax[2]);
    const withinX = Number(!beXless && !beXmore);
    const withinY = Number(!beYless && !beYmore);
    const withinZ = Number(!beZless && !beZmore);
    // eslint-disable-next-line no-bitwise
    const xyzFlag = (withinZ << 2) + (withinY << 1) + withinX;

    switch (xyzFlag) {
      case 0: {
        // withinZ = 0; withinY = 0;  withinX = 0
        // closest to a corner

        closest[0] = beXless ? thisMin[0] : thisMax[0];
        closest[1] = beYless ? thisMin[1] : thisMax[1];
        closest[2] = beZless ? thisMin[2] : thisMax[2];
        minDist = vtkMath.distance2BetweenPoints(point, closest);
        break;
      }

      case 1: {
        // withinZ = 0; withinY = 0; withinX = 1
        // closest to an x-aligned edge

        closest[0] = point[0];
        closest[1] = beYless ? thisMin[1] : thisMax[1];
        closest[2] = beZless ? thisMin[2] : thisMax[2];
        minDist = vtkMath.distance2BetweenPoints(point, closest);
        break;
      }

      case 2: {
        // withinZ = 0; withinY = 1; withinX = 0
        // closest to a y-aligned edge

        closest[0] = beXless ? thisMin[0] : thisMax[0];
        closest[1] = point[1];
        closest[2] = beZless ? thisMin[2] : thisMax[2];
        minDist = vtkMath.distance2BetweenPoints(point, closest);
        break;
      }

      case 3: {
        // withinZ = 0; withinY = 1; withinX = 1
        // closest to a z-face

        if (beZless) {
          minDist = thisMin[2] - point[2];
          closest[2] = thisMin[2];
        } else {
          minDist = point[2] - thisMax[2];
          closest[2] = thisMax[2];
        }

        minDist *= minDist;
        closest[0] = point[0];
        closest[1] = point[1];
        break;
      }

      case 4: {
        // withinZ = 1; withinY = 0; withinX = 0
        // cloest to a z-aligned edge

        closest[0] = beXless ? thisMin[0] : thisMax[0];
        closest[1] = beYless ? thisMin[1] : thisMax[1];
        closest[2] = point[2];
        minDist = vtkMath.distance2BetweenPoints(point, closest);
        break;
      }

      case 5: {
        // withinZ = 1; withinY = 0; withinX = 1
        // closest to a y-face

        if (beYless) {
          minDist = thisMin[1] - point[1];
          closest[1] = thisMin[1];
        } else {
          minDist = point[1] - thisMax[1];
          closest[1] = thisMax[1];
        }

        minDist *= minDist;
        closest[0] = point[0];
        closest[2] = point[2];
        break;
      }

      case 6: {
        // withinZ = 1; withinY = 1; withinX = 0
        // closest to an x-face

        if (beXless) {
          minDist = thisMin[0] - point[0];
          closest[0] = thisMin[0];
        } else {
          minDist = point[0] - thisMax[0];
          closest[0] = thisMax[0];
        }

        minDist *= minDist;
        closest[1] = point[1];
        closest[2] = point[2];
        break;
      }

      case 7: {
        // withinZ = 1; withinY = 1;  withinZ = 1
        // point is inside the box

        if (innerOnly) {
          // check only inner boundaries
          let faceDst;

          faceDst = point[0] - thisMin[0]; // x-min face
          if (thisMin[0] !== rootMin[0] && faceDst < minDist) {
            minFace = 0;
            minDist = faceDst;
          }

          faceDst = thisMax[0] - point[0]; // x-max face
          if (thisMax[0] !== rootMax[0] && faceDst < minDist) {
            minFace = 1;
            minDist = faceDst;
          }

          faceDst = point[1] - thisMin[1]; // y-min face
          if (thisMin[1] !== rootMin[1] && faceDst < minDist) {
            minFace = 2;
            minDist = faceDst;
          }

          faceDst = thisMax[1] - point[1]; // y-max face
          if (thisMax[1] !== rootMax[1] && faceDst < minDist) {
            minFace = 3;
            minDist = faceDst;
          }

          faceDst = point[2] - thisMin[2]; // z-min face
          if (thisMin[2] !== rootMin[2] && faceDst < minDist) {
            minFace = 4;
            minDist = faceDst;
          }

          faceDst = thisMax[2] - point[2]; // z-max face
          if (thisMax[2] !== rootMax[2] && faceDst < minDist) {
            minFace = 5;
            minDist = faceDst;
          }
        } else {
          // check all boundaries
          const tmpDist = [
            point[0] - thisMin[0],
            thisMax[0] - point[0],
            point[1] - thisMin[1],
            thisMax[1] - point[1],
            point[2] - thisMin[2],
            thisMax[2] - point[2],
          ];

          for (let i = 0; i < 6; i++) {
            if (tmpDist[i] < minDist) {
              minFace = i;
              minDist = tmpDist[i];
            }
          }
        }

        // no square operation if no any inner boundary
        if (minDist !== Number.MAX_VALUE) {
          minDist *= minDist;
        }

        closest[0] = point[0];
        closest[1] = point[1];
        closest[2] = point[2];

        // minFace: the quad with the min distance to the point
        // 0: x-min face  ===>  xyzIndx = 0:  x  and  minFace & 1 = 0:  thisMin
        // 1: x-max face  ===>  xyzIndx = 0:  x  and  minFace & 1 = 1:  thisMax
        // 2: y-min face  ===>  xyzIndx = 1:  y  and  minFace & 1 = 0:  thisMin
        // 3: y-max face  ===>  xyzIndx = 1:  y  and  minFace & 1 = 1:  thisMax
        // 4: z-min face  ===>  xyzIndx = 2:  z  and  minFace & 1 = 0:  thisMin
        // 5: z-max face  ===>  xyzIndx = 2:  z  and  minFace & 1 = 1:  thisMax
        const pMinMax = [thisMin, thisMax];
        // eslint-disable-next-line no-bitwise
        const xyzIndx = minFace >> 1;
        // eslint-disable-next-line no-bitwise
        closest[xyzIndx] = pMinMax[minFace & 1][xyzIndx];

        break;
      }
      default:
        vtkErrorMacro('unexpected case in getDistance2ToBoundary');
    }

    return minDist;
  };

  //------------------------------------------------------------------------------
  publicAPI.getDistance2ToInnerBoundary = (point, rootNode) => {
    const dummy = [];
    return publicAPI.getDistance2ToBoundary(point, dummy, 0, rootNode, 0);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pointIdSet: null,
  minBounds: null,
  maxBounds: null,
  minDataBounds: null,
  maxDataBounds: null,
  parent: null,
  children: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  macro.setGetArray(
    publicAPI,
    model,
    ['minBounds', 'maxBounds', 'minDataBounds', 'maxDataBounds'],
    6
  );

  macro.get(publicAPI, model, ['pointIdSet', 'numberOfPoints']);

  // TODO: No get?
  macro.set(publicAPI, model, ['parent']);

  // Object specific methods
  vtkIncrementalOctreeNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkIncrementalOctreeNode'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
