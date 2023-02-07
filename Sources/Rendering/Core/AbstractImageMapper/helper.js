import { vec3 } from 'gl-matrix';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

/**
 * Perform plane-line intersection, where the line is defined by two points (p1, p2),
 * and the plane is defined by the imageData and slice number.
 *
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {vtkImageMapper|vtkImageArrayMapper} mapper
 */
function doPicking(p1, p2, mapper) {
  const imageData = mapper.getCurrentImage();
  const extent = imageData.getExtent();

  // Slice origin
  const ijk = [extent[0], extent[2], extent[4]];
  const { ijkMode } = mapper.getClosestIJKAxis();
  let nSlice = mapper.isA('vtkImageArrayMapper')
    ? mapper.getSubSlice()
    : mapper.getSlice();
  if (ijkMode !== mapper.getSlicingMode()) {
    // If not IJK slicing, get the IJK slice from the XYZ position/slice
    nSlice = mapper.getSliceAtPosition(nSlice);
  }
  ijk[ijkMode] += nSlice;
  const worldOrigin = [0, 0, 0];
  imageData.indexToWorld(ijk, worldOrigin);

  // Normal computation
  ijk[ijkMode] += 1;
  const worldNormal = [0, 0, 0];
  imageData.indexToWorld(ijk, worldNormal);
  worldNormal[0] -= worldOrigin[0];
  worldNormal[1] -= worldOrigin[1];
  worldNormal[2] -= worldOrigin[2];
  vec3.normalize(worldNormal, worldNormal);

  const intersect = vtkPlane.intersectWithLine(
    p1,
    p2,
    worldOrigin,
    worldNormal
  );
  if (intersect.intersection) {
    const point = intersect.x;
    const absoluteIJK = [0, 0, 0];
    imageData.worldToIndex(point, absoluteIJK);
    // `t` is the parametric position along the line
    // defined in Plane.intersectWithLine
    return {
      t: intersect.t,
      absoluteIJK,
    };
  }
  return null;
}

/**
 * Implement point picking for image plane.
 * The plane is defined by the imageData and current slice number,
 * set in the input mapper.
 *
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {vtkImageMapper|vtkImageArrayMapper} mapper
 */
export function intersectWithLineForPointPicking(p1, p2, mapper) {
  const pickingData = doPicking(p1, p2, mapper);
  if (pickingData) {
    const imageData = mapper.getCurrentImage();
    const extent = imageData.getExtent();

    // Get closer integer ijk
    // NB: point picking means closest slice, means rounding
    const ijk = [
      Math.round(pickingData.absoluteIJK[0]),
      Math.round(pickingData.absoluteIJK[1]),
      Math.round(pickingData.absoluteIJK[2]),
    ];

    // Are we outside our actual extent
    if (
      ijk[0] < extent[0] ||
      ijk[0] > extent[1] ||
      ijk[1] < extent[2] ||
      ijk[1] > extent[3] ||
      ijk[2] < extent[4] ||
      ijk[2] > extent[5]
    ) {
      return null;
    }

    return {
      t: pickingData.t,
      ijk,
    };
  }
  return null;
}

/**
 * Implement cell picking for image plane.
 * The plane is defined by the imageData and current slice number,
 * set in the input mapper.
 *
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {vtkImageMapper|vtkImageArrayMapper} mapper
 */
export function intersectWithLineForCellPicking(p1, p2, mapper) {
  const pickingData = doPicking(p1, p2, mapper);
  if (pickingData) {
    const imageData = mapper.getCurrentImage();
    const extent = imageData.getExtent();
    const absIJK = pickingData.absoluteIJK;

    // Get closer integer ijk
    // NB: cell picking means closest voxel, means flooring
    const ijk = [
      Math.floor(absIJK[0]),
      Math.floor(absIJK[1]),
      Math.floor(absIJK[2]),
    ];

    // Are we outside our actual extent
    if (
      ijk[0] < extent[0] ||
      ijk[0] > extent[1] - 1 ||
      ijk[1] < extent[2] ||
      ijk[1] > extent[3] - 1 ||
      ijk[2] < extent[4] ||
      // handle single-slice images
      ijk[2] > (extent[5] ? extent[5] - 1 : extent[5])
    ) {
      return null;
    }

    // Parametric coordinates within cell
    const pCoords = [
      absIJK[0] - ijk[0],
      absIJK[1] - ijk[1],
      absIJK[2] - ijk[2],
    ];

    return {
      t: pickingData.t,
      ijk,
      pCoords,
    };
  }
  return null;
}
