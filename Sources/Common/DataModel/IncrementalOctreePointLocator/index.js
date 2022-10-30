import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkIncrementalOctreeNode from 'vtk.js/Sources/Common/DataModel/IncrementalOctreeNode';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;

function vtkIncrementalOctreePointLocator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkIncrementalOctreePointLocator');

  function getLeafContainer(node, pnt) {
    return node.isLeaf()
      ? node
      : getLeafContainer(node.getChild(node.getChildIndex(pnt)), pnt);
  }

  //------------------------------------------------------------------------------
  publicAPI.freeSearchStructure = () => {
    model.octreeRootNode = null;
    model.numberOfNodes = 0;
    model.locatorPoints = null;
  };

  //------------------------------------------------------------------------------
  publicAPI.findClosestPointInLeafNode = (leafNode, point) => {
    // NOTE: dist2 MUST be initiated with a very huge value below, but instead of
    // model.octreeMaxDimSize * model.octreeMaxDimSize * 4.0, because the point
    // under check may be outside the octree and hence the squared distance can
    // be greater than the latter or other similar octree-based specific values.
    let dist2 = Number.MAX_VALUE;

    if (leafNode.getPointIdSet() == null) {
      return [-1, dist2];
    }

    let numPts = 0;
    let tmpDst = 0.0;
    const tmpPnt = [];
    let tmpIdx = -1;
    let pntIdx = -1;
    let idList = leafNode.getPointIdSet();
    numPts = idList.length;

    for (let i = 0; i < numPts; i++) {
      tmpIdx = idList[i];
      model.locatorPoints.getPoint(tmpIdx, tmpPnt);
      tmpDst = vtkMath.distance2BetweenPoints(tmpPnt, point);
      if (tmpDst < dist2) {
        dist2 = tmpDst;
        pntIdx = tmpIdx;
      }

      if (dist2 === 0.0) {
        break;
      }
    }

    idList = null;

    return [pntIdx, dist2];
  };

  publicAPI.findClosestPointInSphere = (point, radius2, maskNode, refDist2) => {
    let pointIndx = -1;
    let minDist2 = Number.MAX_VALUE;

    const nodesBase = [];
    nodesBase.push(model.octreeRootNode);

    let checkNode;
    let childNode;
    let distToData;
    let tempDist2;
    let tempPntId;

    while (!nodesBase.length === 0 && minDist2 > 0.0) {
      checkNode = nodesBase.top();
      nodesBase.pop();

      if (!checkNode.isLeaf()) {
        for (let i = 0; i < 8; i++) {
          childNode = checkNode.getChild(i);

          // use ( radius2 + radius2 ) to skip empty nodes
          distToData = childNode.getNumberOfPoints()
            ? childNode.getDistance2ToBoundary(point, model.octreeRootNode, 1)
            : radius2 + radius2;

          // If a child node is not the mask node AND its distance, specifically
          // the data bounding box (determined by the points inside or under) to
          // the point, is less than the threshold radius (one exception is the
          // point's container nodes), it is pushed to the stack as a suspect.
          if (
            childNode !== maskNode &&
            (distToData <= refDist2 || childNode.containsPoint(point) === 1)
          ) {
            nodesBase.push(childNode);
          }

          childNode = null;
        }
      } else {
        // now that the node under check is a leaf, let's find the closest
        // point therein and the minimum distance

        [tempPntId, tempDist2] = publicAPI.findClosestPointInLeafNode(
          checkNode,
          point
        );

        if (tempDist2 < minDist2) {
          minDist2 = tempDist2;
          pointIndx = tempPntId;
        }
      }

      checkNode = null;
    }

    return [minDist2 <= radius2 ? pointIndx : -1, minDist2];
  };

  //------------------------------------------------------------------------------
  publicAPI.initPointInsertion = (points, bounds, estNumPts = 0) => {
    let i = 0;
    let bbIndex = 0;

    if (points == null) {
      vtkErrorMacro('a valid vtkPoints object required for point insertion');
      return false;
    }

    // destroy the existing octree, if any
    publicAPI.freeSearchStructure();
    model.locatorPoints = points;

    // obtain the threshold squared distance
    model.insertTolerance2 = model.tolerance * model.tolerance;

    // Fix bounds
    // (1) push out a little bit if the original volume is too flat --- a slab
    // (2) pull back the x, y, and z's lower bounds a little bit such that
    //     points are clearly "inside" the spatial region.  Point p is taken as
    //     "inside" range r = [r1, r2] if and only if r1 < p <= r2.
    model.octreeMaxDimSize = 0.0;
    const tmpBbox = [...bounds];
    const dimDiff = vtkBoundingBox.getLengths(bounds);
    model.octreeMaxDimSize = Math.max(...dimDiff);

    if (model.buildCubicOctree) {
      // make the bounding box a cube and hence descendant octants cubes too
      for (i = 0; i < 3; i++) {
        if (dimDiff[i] !== model.octreeMaxDimSize) {
          const delta = model.octreeMaxDimSize - dimDiff[i];
          tmpBbox[2 * i] -= 0.5 * delta;
          tmpBbox[2 * i + 1] += 0.5 * delta;
          dimDiff[i] = model.octreeMaxDimSize;
        }
      }
    }

    model.fudgeFactor = model.octreeMaxDimSize * 10e-6;
    const minSideSize = model.octreeMaxDimSize * 10e-2;

    for (i = 0; i < 3; i++) {
      if (dimDiff[i] < minSideSize) {
        // case (1) above
        bbIndex = 2 * i;
        const tempVal = tmpBbox[bbIndex];
        tmpBbox[bbIndex] = tmpBbox[bbIndex + 1] - minSideSize;
        tmpBbox[bbIndex + 1] = tempVal + minSideSize;
      } else {
        // case (2) above
        tmpBbox[2 * i] -= model.fudgeFactor;
      }
    }

    // init the octree with an empty leaf node
    model.octreeRootNode = vtkIncrementalOctreeNode.newInstance();
    ++model.numberOfNodes;

    // this call internally inits the middle (center) and data range, too
    model.octreeRootNode.setBounds(...tmpBbox);

    return true;
  };

  publicAPI.findClosestPointInSphereWithTolerance = (
    point,
    radius2,
    maskNode
  ) =>
    publicAPI.findClosestPointInSphere(
      point,
      radius2,
      maskNode,
      model.octreeMaxDimSize * model.octreeMaxDimSize * 4.0,
      radius2
    );

  //------------------------------------------------------------------------------
  publicAPI.findDuplicateFloatTypePointInVisitedLeafNode = (
    leafNode,
    point
  ) => {
    let tmpPnt;
    let tmpIdx = -1;
    let pntIdx = -1;

    // float thePnt[3]; // TODO
    // thePnt[0] = static_cast<float>(point[0]);
    // thePnt[1] = static_cast<float>(point[1]);
    // thePnt[2] = static_cast<float>(point[2]);

    const idList = leafNode.getPointIdSet();
    // float* pFloat = (static_cast<vtkFloatArray*>(model.locatorPoints.getData())).getPointer(0);
    const values = model.locatorPoints.getData();

    for (let i = 0; i < idList.length; i++) {
      tmpIdx = idList[i];
      // eslint-disable-next-line no-bitwise
      tmpPnt = (tmpIdx << 1) + tmpIdx;

      if (
        point[0] === values[tmpPnt] &&
        point[1] === values[tmpPnt + 1] &&
        point[2] === values[tmpPnt + 2]
      ) {
        pntIdx = tmpIdx;
        break;
      }
    }

    return pntIdx;
  };

  //------------------------------------------------------------------------------
  publicAPI.findDuplicateDoubleTypePointInVisitedLeafNode = (
    leafNode,
    point
  ) => {
    let tmpPnt;
    let tmpIdx = -1;
    let pntIdx = -1;
    const idList = leafNode.getPointIdSet();

    const values = model.locatorPoints.getData();

    for (let i = 0; i < idList.length; i++) {
      tmpIdx = idList[i];
      // eslint-disable-next-line no-bitwise
      tmpPnt = (tmpIdx << 1) + tmpIdx;

      if (
        point[0] === values[tmpPnt] &&
        point[1] === values[tmpPnt + 1] &&
        point[2] === values[tmpPnt + 2]
      ) {
        pntIdx = tmpIdx;
        break;
      }
    }

    return pntIdx;
  };

  //------------------------------------------------------------------------------
  publicAPI.findDuplicatePointInLeafNode = (leafNode, point) => {
    if (leafNode.getPointIdSet() == null) {
      return -1;
    }

    return model.locatorPoints.getDataType() === VtkDataTypes.FLOAT
      ? publicAPI.findDuplicateFloatTypePointInVisitedLeafNode(leafNode, point)
      : publicAPI.findDuplicateDoubleTypePointInVisitedLeafNode(
          leafNode,
          point
        );
  };

  //------------------------------------------------------------------------------
  publicAPI.insertPoint = (ptId, x) => {
    const leafcontainer = getLeafContainer(model.octreeRootNode, x);
    ({ numberOfNodes: model.numberOfNodes } = leafcontainer.insertPoint(
      model.locatorPoints,
      x,
      model.maxPointsPerLeaf,
      ptId,
      1,
      model.numberOfNodes
    ));
  };

  //------------------------------------------------------------------------------
  publicAPI.insertUniquePoint = (point) => {
    // TODO: We have a mix of let and const here.
    // eslint-disable-next-line prefer-const
    let { pointIdx, leafContainer } = publicAPI.isInsertedPoint(point);
    if (pointIdx > -1) {
      return { success: false, idx: pointIdx };
    }
    // TODO: pointIdx
    let numberOfNodes;
    // eslint-disable-next-line prefer-const
    ({ numberOfNodes, pointIdx } = leafContainer.insertPoint(
      model.locatorPoints,
      point,
      model.maxPointsPerLeaf,
      pointIdx,
      2,
      model.numberOfNodes
    ));
    model.numberOfNodes = numberOfNodes;
    return { success: true, idx: pointIdx };
  };

  //------------------------------------------------------------------------------
  publicAPI.insertNextPoint = (x) => {
    const leafContainer = getLeafContainer(model.octreeRootNode, x);
    const { numberOfNodes, pointIdx } = leafContainer.insertPoint(
      model.locatorPoints,
      x,
      model.maxPointsPerLeaf,
      -1,
      2,
      model.numberOfNodes
    );
    model.numberOfNodes = numberOfNodes;
    return pointIdx;
  };

  //------------------------------------------------------------------------------
  publicAPI.isInsertedPointForZeroTolerance = (x) => {
    // the target leaf node always exists there since the root node of the
    // octree has been initialized to cover all possible points to be inserted
    // and therefore we do not need to check it here
    const leafContainer = getLeafContainer(model.octreeRootNode, x);
    const pointIdx = publicAPI.findDuplicatePointInLeafNode(leafContainer, x);
    return { pointIdx, leafContainer };
  };

  //------------------------------------------------------------------------------
  publicAPI.isInsertedPointForNonZeroTolerance = (x) => {
    // minDist2 // min distance to ALL existing points
    // elseDst2 // min distance to other nodes (inner boundaries)
    let dist2Ext; // min distance to an EXTended set of nodes
    let pntIdExt;

    // the target leaf node always exists there since the root node of the
    // octree has been initialized to cover all possible points to be inserted
    // and therefore we do not need to check it here
    const leafContainer = getLeafContainer(model.octreeRootNode, x);
    let [pointIdx, minDist2] = publicAPI.findClosestPointInLeafNode(
      leafContainer,
      x
    );

    if (minDist2 === 0.0) {
      return { pointIdx, leafContainer };
    }

    // As no any 'duplicate' point exists in this leaf node, we need to expand
    // the search scope to capture possible closer points in other nodes.
    const elseDst2 = leafContainer.getDistance2ToInnerBoundary(
      x,
      model.octreeRootNode
    );

    if (elseDst2 < model.insertTolerance2) {
      // one or multiple closer points might exist in the neighboring nodes
      // TODO: dist2Ext
      pntIdExt = publicAPI.findClosestPointInSphereWithTolerance(
        x,
        model.insertTolerance2,
        leafContainer,
        dist2Ext
      );

      if (dist2Ext < minDist2) {
        minDist2 = dist2Ext;
        pointIdx = pntIdExt;
      }
    }
    pointIdx = minDist2 <= model.insertTolerance2 ? pointIdx : -1;
    return { pointIdx, leafContainer };
  };

  //------------------------------------------------------------------------------
  publicAPI.isInsertedPoint = (x, leafContainer) =>
    model.insertTolerance2 === 0.0
      ? publicAPI.isInsertedPointForZeroTolerance(x, leafContainer)
      : publicAPI.isInsertedPointForNonZeroTolerance(x, leafContainer);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    fudgeFactor: 0,
    octreeMaxDimSize: 0,
    buildCubicOctree: false,
    maxPointsPerLeaf: 128,
    insertTolerance2: 0.000001,
    locatorPoints: null,
    octreeRootNode: null,
    numberOfNodes: 0,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractPointLocator.extend(
    publicAPI,
    model,
    defaultValues(initialValues)
  );

  // Make this a VTK object
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'fudgeFactor',
    'octreeMaxDimSize',
    'buildCubicOctree',
    'maxPointsPerLeaf',
    'insertTolerance2',
    'locatorPoints',
    'octreeRootNode',
    'numberOfNodes',
  ]);

  // Object specific methods
  vtkIncrementalOctreePointLocator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkIncrementalOctreePointLocator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
