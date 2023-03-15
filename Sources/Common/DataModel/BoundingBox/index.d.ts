import { mat4 } from 'gl-matrix';
import { Bounds, Vector2, Vector3 } from '../../../types';
import vtkPoints from '../../Core/Points';

/**
 * Tests whether two bounds equal.
 * @param {Bounds} a
 * @param {Bounds} b
 */
export function equals(a: Bounds, b: Bounds): boolean;

/**
 * Tests whether a given bounds is valid.
 * @param {Bounds} bounds
 */
export function isValid(bounds: Bounds): boolean;

/**
 * Sets a bounding box from another bounding box.
 * @param {Bounds} bounds
 * @param {Bounds} other
 */
export function setBounds(bounds: Bounds, other: Bounds): Bounds;

/**
 * Resets a bounds to infinity.
 * @param {Bounds} bounds
 */
export function reset(bounds: Bounds): Bounds;

/**
 * Adds points to a bounding box.
 * @param {Bounds} bounds
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function addPoint(
  bounds: Bounds,
  x: number,
  y: number,
  z: number
): Bounds;

/**
 * Adds points to a bounding box.
 * @param {Bounds} bounds
 * @param {number[]} points A flattened array of 3D coordinates.
 */
export function addPoints(bounds: Bounds, points: number[]): Bounds;

/**
 * Adds two bounding boxes together.
 * @param {Bounds} bounds
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} yMin
 * @param {number} yMax
 * @param {number} zMin
 * @param {number} zMax
 */
export function addBounds(
  bounds: Bounds,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  zMin: number,
  zMax: number
): Bounds;

/**
 * Sets the min point of a bounding box.
 * @param {Bounds} bounds
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function setMinPoint(
  bounds: Bounds,
  x: number,
  y: number,
  z: number
): boolean;

/**
 * Sets the max point of a bounding box.
 * @param {Bounds} bounds
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function setMaxPoint(
  bounds: Bounds,
  x: number,
  y: number,
  z: number
): boolean;

/**
 * Inflates a bounding box.
 * @param {Bounds} bounds
 * @param {number} delta
 */
export function inflate(bounds: Bounds, delta: number): Bounds;

/**
 * Scales a bounding box.
 * @param {Bounds} bounds
 * @param {number} sx
 * @param {number} sy
 * @param {number} sz
 */
export function scale(
  bounds: Bounds,
  sx: number,
  sy: number,
  sz: number
): boolean;

/**
 * Gets the center of a bounding box.
 * @param {Bounds} bounds
 */
export function getCenter(bounds: Bounds): Vector3;

/**
 * Scales a bounding box around its center.
 * @param {Bounds} bounds
 * @param {number} sx
 * @param {number} sy
 * @param {number} sz
 */
export function scaleAboutCenter(
  bounds: Bounds,
  sx: number,
  sy: number,
  sz: number
): boolean;

/**
 * Gets the bounding box side length.
 * @param {Bounds} bounds
 * @param {number} index
 */
export function getLength(bounds: Bounds, index: number): number;

/**
 * Gets the lengths of all sides.
 * @param {Bounds} bounds
 */
export function getLengths(bounds: Bounds): Vector3;

/**
 * Gets the x range of a bounding box.
 * @param {Bounds} bounds
 */
export function getXRange(bounds: Bounds): Vector2;

/**
 * Gets the y range of a bounding box.
 * @param {Bounds} bounds
 */
export function getYRange(bounds: Bounds): Vector2;

/**
 * Gets the z range of a bounding box.
 * @param {Bounds} bounds
 */
export function getZRange(bounds: Bounds): Vector2;

/**
 * Gets the maximum side length of the bounding box.
 * @param {Bounds} bounds
 */
export function getMaxLength(bounds: Bounds): number;

/**
 * Gets the diagonal of the bounding box.
 * @param {Bounds} bounds
 */
export function getDiagonalLength(bounds: Bounds): number;

/**
 * Gets the min point.
 * @param {Bounds} bounds
 */

export function getMinPoint(bounds: Bounds): Vector3;

/**
 * Gets the max point.
 * @param {Bounds} bounds
 */
export function getMaxPoint(bounds: Bounds): Vector3;

/**
 * Gets the corners of a bounding box.
 * @param {Bounds} bounds
 * @param {Vector3[]} corners
 */
export function getCorners(bounds: Bounds, corners: Vector3[]): Vector3[];

/**
 * Computes the two corner poitns with min and max coords.
 * @param {Bounds} bounds
 * @param {Vector3} point1
 * @param {Vector3} point2
 */
export function computeCornerPoints(
  bounds: Bounds,
  point1: Vector3,
  point2: Vector3
): Vector3;

/**
 * Transforms a bounding box.
 * @param {Bounds} bounds
 * @param {mat4} transform
 * @param {Bounds} out
 */
export function transformBounds(
  bounds: Bounds,
  transform: mat4,
  out: Bounds
): ReturnType<typeof addPoints>;

export function computeScale3(bounds: Bounds, scale3: Vector3): Vector3;

/**
 * Compute local bounds.
 * Not as fast as vtkPoints.getBounds() if u, v, w form a natural basis.
 * @param {vtkPoints} points
 * @param {array} u first vector
 * @param {array} v second vector
 * @param {array} w third vector
 */

export function computeLocalBounds(
  points: vtkPoints,
  u: Vector3,
  v: Vector3,
  w: Vector3
): Bounds;

/**
 * The method returns a non-zero value if the bounding box is hit.
 * Origin[3] starts the ray, dir[3] is the vector components of the ray in the x-y-z
 * directions, coord[3] is the location of hit, and t is the parametric
 * coordinate along line. (Notes: the intersection ray dir[3] is NOT
 * normalized.  Valid intersections will only occur between 0<=t<=1.)
 * @param {Bounds} bounds
 * @param {Vector3} origin
 * @param {Vector3} dir
 * @param {Vector3} coord
 * @param {number} tolerance
 */
export function intersectBox(
  bounds: Bounds,
  origin: Vector3,
  dir: Vector3,
  coord: Vector3,
  tolerance: number
): boolean;

/**
 * Plane intersection with box
 * The plane is infinite in extent and defined by an origin and normal.The function indicates
 * whether the plane intersects, not the particulars of intersection points and such
 * The function returns non-zero if the plane and box intersect; zero otherwise.
 * @param {Bounds} bounds
 * @param {Vector3} origin
 * @param {Vector3} normal
 */
export function intersectPlane(
  bounds: Bounds,
  origin: Vector3,
  normal: Vector3
): boolean;

/**
 * Do two bounding boxes intersect.
 * @param {Bounds} bounds
 * @param bBounds
 */
export function intersect(bounds: Bounds, bBounds: Bounds): boolean;

/**
 * Do two bounding boxes intersect.
 * @param {Bounds} bounds
 * @param {Bounds} bBounds
 */
export function intersects(bounds: Bounds, bBounds: Bounds): boolean;

/**
 * Does the bbox contain a given point.
 * @param {Bounds} bounds
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function containsPoint(
  bounds: Bounds,
  x: number,
  y: number,
  z: number
): boolean;

/**
 * Is a bbox contained in another bbox.
 * @param {Bounds} bounds
 * @param {Bounds} other
 */
export function contains(bounds: Bounds, other: Bounds): boolean;

/**
 * Does a plane intersect a boox.
 * @param {Bounds} bounds
 * @param {Vector3} origin
 * @param {Vector3} normal
 */
export function cutWithPlane(
  bounds: Bounds,
  origin: Vector3,
  normal: Vector3
): boolean;

declare class BoundingBox {
  getBounds(): Bounds;
  /**
   * Tests whether two bounds equal.
   * @param {Bounds} a
   * @param {Bounds} b
   */
  equals(a: Bounds, b: Bounds): boolean;

  /**
   * Tests whether a given bounds is valid.
   * @param {Bounds} bounds
   */
  isValid(bounds: Bounds): boolean;

  /**
   * Sets a bounding box from another bounding box.
   * @param {Bounds} bounds
   * @param {Bounds} other
   */
  setBounds(bounds: Bounds, other: Bounds): Bounds;

  /**
   * Resets a bounds to infinity.
   * @param {Bounds} bounds
   */
  reset(bounds: Bounds): Bounds;

  /**
   * Adds points to a bounding box.
   * @param {Bounds} bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addPoint(bounds: Bounds, x: number, y: number, z: number): Bounds;

  /**
   * Adds points to a bounding box.
   * @param {Bounds} bounds
   * @param {number[]} points A flattened array of 3D coordinates.
   */
  addPoints(bounds: Bounds, points: number[]): Bounds;

  /**
   * Adds two bounding boxes together.
   * @param {Bounds} bounds
   * @param {number} xMin
   * @param {number} xMax
   * @param {number} yMin
   * @param {number} yMax
   * @param {number} zMin
   * @param {number} zMax
   */
  addBounds(
    bounds: Bounds,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number
  ): Bounds;

  /**
   * Sets the min point of a bounding box.
   * @param {Bounds} bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setMinPoint(bounds: Bounds, x: number, y: number, z: number): boolean;

  /**
   * Sets the max point of a bounding box.
   * @param {Bounds} bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setMaxPoint(bounds: Bounds, x: number, y: number, z: number): boolean;

  /**
   * Inflates a bounding box.
   * @param {Bounds} bounds
   * @param {number} delta
   */
  inflate(bounds: Bounds, delta: number): Bounds;

  /**
   * Scales a bounding box.
   * @param {Bounds} bounds
   * @param {number} sx
   * @param {number} sy
   * @param {number} sz
   */
  scale(bounds: Bounds, sx: number, sy: number, sz: number): boolean;

  /**
   * Gets the center of a bounding box.
   * @param {Bounds} bounds
   */
  getCenter(bounds: Bounds): Vector3;

  /**
   * Scales a bounding box around its center.
   * @param {Bounds} bounds
   * @param {number} sx
   * @param {number} sy
   * @param {number} sz
   */
  scaleAboutCenter(bounds: Bounds, sx: number, sy: number, sz: number): boolean;

  /**
   * Gets the bounding box side length.
   * @param {Bounds} bounds
   * @param {number} index
   */
  getLength(bounds: Bounds, index: number): number;

  /**
   * Gets the lengths of all sides.
   * @param {Bounds} bounds
   */
  getLengths(bounds: Bounds): Vector3;

  /**
   * Gets the x range of a bounding box.
   * @param {Bounds} bounds
   */
  getXRange(bounds: Bounds): Vector2;

  /**
   * Gets the y range of a bounding box.
   * @param {Bounds} bounds
   */
  getYRange(bounds: Bounds): Vector2;

  /**
   * Gets the z range of a bounding box.
   * @param {Bounds} bounds
   */
  getZRange(bounds: Bounds): Vector2;

  /**
   * Gets the maximum side length of the bounding box.
   * @param {Bounds} bounds
   */
  getMaxLength(bounds: Bounds): number;

  /**
   * Gets the diagonal of the bounding box.
   * @param {Bounds} bounds
   */
  getDiagonalLength(bounds: Bounds): number;

  /**
   * Gets the min point.
   * @param {Bounds} bounds
   */

  getMinPoint(bounds: Bounds): Vector3;

  /**
   * Gets the max point.
   * @param {Bounds} bounds
   */
  getMaxPoint(bounds: Bounds): Vector3;

  /**
   * Gets the corners of a bounding box.
   * @param {Bounds} bounds
   * @param {Vector3[]} corners
   */
  getCorners(bounds: Bounds, corners: Vector3[]): Vector3[];

  /**
   * Computes the two corner poitns with min and max coords.
   * @param {Bounds} bounds
   * @param {Vector3} point1
   * @param {Vector3} point2
   */
  computeCornerPoints(
    bounds: Bounds,
    point1: Vector3,
    point2: Vector3
  ): Vector3;

  /**
   * Transforms a bounding box.
   * @param {Bounds} bounds
   * @param {mat4} transform
   * @param {Bounds} out
   */
  transformBounds(
    bounds: Bounds,
    transform: mat4,
    out: Bounds
  ): ReturnType<typeof addPoints>;

  computeScale3(bounds: Bounds, scale3: Vector3): Vector3;

  /**
   * Compute local bounds.
   * Not as fast as vtkPoints.getBounds() if u, v, w form a natural basis.
   * @param {vtkPoints} points
   * @param {array} u first vector
   * @param {array} v second vector
   * @param {array} w third vector
   */

  computeLocalBounds(
    points: vtkPoints,
    u: Vector3,
    v: Vector3,
    w: Vector3
  ): Bounds;

  /**
   * The method returns a non-zero value if the bounding box is hit.
   * Origin[3] starts the ray, dir[3] is the vector components of the ray in the x-y-z
   * directions, coord[3] is the location of hit, and t is the parametric
   * coordinate along line. (Notes: the intersection ray dir[3] is NOT
   * normalized.  Valid intersections will only occur between 0<=t<=1.)
   * @param {Bounds} bounds
   * @param {Vector3} origin
   * @param {Vector3} dir
   * @param {Vector3} coord
   * @param {number} tolerance
   */
  intersectBox(
    bounds: Bounds,
    origin: Vector3,
    dir: Vector3,
    coord: Vector3,
    tolerance: number
  ): boolean;

  /**
   * Plane intersection with box
   * The plane is infinite in extent and defined by an origin and normal.The function indicates
   * whether the plane intersects, not the particulars of intersection points and such
   * The function returns non-zero if the plane and box intersect; zero otherwise.
   * @param {Bounds} bounds
   * @param {Vector3} origin
   * @param {Vector3} normal
   */
  intersectPlane(bounds: Bounds, origin: Vector3, normal: Vector3): boolean;

  /**
   * Do two bounding boxes intersect.
   * @param {Bounds} bounds
   * @param bBounds
   */
  intersect(bounds: Bounds, bBounds: Bounds): boolean;

  /**
   * Do two bounding boxes intersect.
   * @param {Bounds} bounds
   * @param {Bounds} bBounds
   */
  intersects(bounds: Bounds, bBounds: Bounds): boolean;

  /**
   * Does the bbox contain a given point.
   * @param {Bounds} bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  containsPoint(bounds: Bounds, x: number, y: number, z: number): boolean;

  /**
   * Is a bbox contained in another bbox.
   * @param {Bounds} bounds
   * @param {Bounds} other
   */
  contains(bounds: Bounds, other: Bounds): boolean;

  /**
   * Does a plane intersect a boox.
   * @param {Bounds} bounds
   * @param {Vector3} origin
   * @param {Vector3} normal
   */
  cutWithPlane(bounds: Bounds, origin: Vector3, normal: Vector3): boolean;
}

export interface IBoundingBoxInitialValues {
  bounds?: Bounds;
}

declare const vtkBoundingBox: {
  newInstance: (initialValues: IBoundingBoxInitialValues) => BoundingBox;
  equals: typeof equals;
  isValid: typeof isValid;
  setBounds: typeof setBounds;
  reset: typeof reset;
  addPoint: typeof addPoint;
  addPoints: typeof addPoints;
  addBounds: typeof addBounds;
  setMinPoint: typeof setMinPoint;
  setMaxPoint: typeof setMaxPoint;
  inflate: typeof inflate;
  scale: typeof scale;
  scaleAboutCenter: typeof scaleAboutCenter;
  getCenter: typeof getCenter;
  getLength: typeof getLength;
  getLengths: typeof getLengths;
  getMaxLength: typeof getMaxLength;
  getDiagonalLength: typeof getDiagonalLength;
  getMinPoint: typeof getMinPoint;
  getMaxPoint: typeof getMaxPoint;
  getXRange: typeof getXRange;
  getYRange: typeof getYRange;
  getZRange: typeof getZRange;
  getCorners: typeof getCorners;
  computeCornerPoints: typeof computeCornerPoints;
  computeLocalBounds: typeof computeLocalBounds;
  transformBounds: typeof transformBounds;
  computeScale3: typeof computeScale3;
  cutWithPlane: typeof cutWithPlane;
  intersectBox: typeof intersectBox;
  intersectPlane: typeof intersectPlane;
  intersect: typeof intersect;
  intersects: typeof intersects;
  containsPoint: typeof containsPoint;
  contains: typeof contains;
  INIT_BOUNDS: Bounds;
};

export default vtkBoundingBox;
