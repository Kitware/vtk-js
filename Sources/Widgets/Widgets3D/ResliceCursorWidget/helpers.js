import vtkBoundingBox, {
  STATIC,
} from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const EPSILON = 10e-7;

/**
 * Fit the plane defined by origin, p1, p2 onto the bounds.
 * Plane is untouched if does not intersect bounds.
 * @param {Array} bounds
 * @param {Array} origin
 * @param {Array} p1
 * @param {Array} p2
 * @return {Boolean} false if no bounds have been found, else true
 */
export function boundPlane(bounds, origin, p1, p2) {
  const v1 = [];
  vtkMath.subtract(p1, origin, v1);
  vtkMath.normalize(v1);

  const v2 = [];
  vtkMath.subtract(p2, origin, v2);
  vtkMath.normalize(v2);

  const n = [0, 0, 1];
  vtkMath.cross(v1, v2, n);
  vtkMath.normalize(n);

  // Inflate bounds in order to avoid precision error when cutting cubesource
  const inflatedBounds = [...bounds];
  const eps = [...n];
  vtkMath.multiplyScalar(eps, EPSILON);
  vtkBoundingBox.addBounds(
    inflatedBounds,
    bounds[0] + eps[0],
    bounds[1] + eps[0],
    bounds[2] + eps[1],
    bounds[3] + eps[1],
    bounds[4] + eps[2],
    bounds[5] + eps[2]
  );
  vtkBoundingBox.addBounds(
    inflatedBounds,
    bounds[0] - eps[0],
    bounds[1] - eps[0],
    bounds[2] - eps[1],
    bounds[3] - eps[1],
    bounds[4] - eps[2],
    bounds[5] - eps[2]
  );

  const plane = vtkPlane.newInstance();
  plane.setOrigin(...origin);
  plane.setNormal(...n);

  const cubeSource = vtkCubeSource.newInstance();
  cubeSource.setBounds(inflatedBounds);

  const cutter = vtkCutter.newInstance();
  cutter.setCutFunction(plane);
  cutter.setInputConnection(cubeSource.getOutputPort());

  const cutBounds = cutter.getOutputData();
  if (cutBounds.getNumberOfPoints() === 0) {
    return false;
  }
  const localBounds = STATIC.computeLocalBounds(
    cutBounds.getPoints(),
    v1,
    v2,
    n
  );
  for (let i = 0; i < 3; i += 1) {
    origin[i] =
      localBounds[0] * v1[i] + localBounds[2] * v2[i] + localBounds[4] * n[i];
    p1[i] =
      localBounds[1] * v1[i] + localBounds[2] * v2[i] + localBounds[4] * n[i];
    p2[i] =
      localBounds[0] * v1[i] + localBounds[3] * v2[i] + localBounds[4] * n[i];
  }
  return true;
}
// Project point (inPoint) to the bounds of the image according to a plane
// defined by two vectors (v1, v2)
export function boundPoint(inPoint, v1, v2, bounds) {
  const absT1 = v1.map((val) => Math.abs(val));
  const absT2 = v2.map((val) => Math.abs(val));

  let o1 = 0.0;
  let o2 = 0.0;

  for (let i = 0; i < 3; i++) {
    let axisOffset = 0;

    const useT1 = absT1[i] > absT2[i];
    const t = useT1 ? v1 : v2;
    const absT = useT1 ? absT1 : absT2;

    if (inPoint[i] < bounds[i * 2]) {
      axisOffset = absT[i] > EPSILON ? (bounds[2 * i] - inPoint[i]) / t[i] : 0;
    } else if (inPoint[i] > bounds[2 * i + 1]) {
      axisOffset =
        absT[i] > EPSILON ? (bounds[2 * i + 1] - inPoint[i]) / t[i] : 0;
    }

    if (useT1) {
      if (Math.abs(axisOffset) > Math.abs(o1)) {
        o1 = axisOffset;
      }
    } else if (Math.abs(axisOffset) > Math.abs(o2)) {
      o2 = axisOffset;
    }
  }

  const outPoint = [inPoint[0], inPoint[1], inPoint[2]];

  if (o1 !== 0.0) {
    vtkMath.multiplyAccumulate(outPoint, v1, o1, outPoint);
  }
  if (o2 !== 0.0) {
    vtkMath.multiplyAccumulate(outPoint, v2, o2, outPoint);
  }

  return outPoint;
}

// Compute the intersection between p1 and p2 on bounds
export function boundPointOnPlane(p1, p2, bounds) {
  const dir12 = [0, 0, 0];
  vtkMath.subtract(p2, p1, dir12);

  const out = [0, 0, 0];
  const tolerance = [0, 0, 0];
  vtkBoundingBox.intersectBox(bounds, p1, dir12, out, tolerance);

  return out;
}

/**
 * Rotates a vector around another.
 * @param {vec3} vectorToBeRotated Vector to rate
 * @param {vec3} axis Axis to rotate around
 * @param {Number} angle Angle in radian
 * @returns The rotated vector
 */
export function rotateVector(vectorToBeRotated, axis, angle) {
  const rotatedVector = [...vectorToBeRotated];
  vtkMatrixBuilder.buildFromRadian().rotate(angle, axis).apply(rotatedVector);
  return rotatedVector;
}

// Update the extremities and the rotation point coordinate of the line
function updateLine(lineState, center, axis, lineLength) {
  const p1 = [
    center[0] - lineLength * axis[0],
    center[1] - lineLength * axis[1],
    center[2] - lineLength * axis[2],
  ];
  const p2 = [
    center[0] + lineLength * axis[0],
    center[1] + lineLength * axis[1],
    center[2] + lineLength * axis[2],
  ];
  // FIXME: p1 and p2 should be placed on the boundaries of the volume.
  lineState.setPoint1(p1);
  lineState.setPoint2(p2);
}

// Update the reslice cursor state according to the three planes normals and the origin
export function updateState(widgetState) {
  // Compute line axis
  const xNormal = widgetState.getPlanes()[ViewTypes.YZ_PLANE].normal;
  const yNormal = widgetState.getPlanes()[ViewTypes.XZ_PLANE].normal;
  const zNormal = widgetState.getPlanes()[ViewTypes.XY_PLANE].normal;

  const yzIntersectionLineAxis = vtkMath.cross(yNormal, zNormal, []);
  const xzIntersectionLineAxis = vtkMath.cross(zNormal, xNormal, []);
  const xyIntersectionLineAxis = vtkMath.cross(xNormal, yNormal, []);

  const bounds = widgetState.getImage().getBounds();
  const center = widgetState.getCenter();

  // Length of the principal diagonal.
  const pdLength = 0.5 * vtkBoundingBox.getDiagonalLength(bounds);

  updateLine(
    widgetState.getAxisXinY(),
    center,
    xyIntersectionLineAxis,
    pdLength
  );
  updateLine(
    widgetState.getAxisYinX(),
    center,
    xyIntersectionLineAxis,
    pdLength
  );

  updateLine(
    widgetState.getAxisYinZ(),
    center,
    yzIntersectionLineAxis,
    pdLength
  );
  updateLine(
    widgetState.getAxisZinY(),
    center,
    yzIntersectionLineAxis,
    pdLength
  );

  updateLine(
    widgetState.getAxisXinZ(),
    center,
    xzIntersectionLineAxis,
    pdLength
  );
  updateLine(
    widgetState.getAxisZinX(),
    center,
    xzIntersectionLineAxis,
    pdLength
  );
}

/**
 * First rotate planeToTransform to match targetPlane normal.
 * Then rotate around targetNormal to enforce targetViewUp "up" vector (i.e. Origin->p2 ).
 * There is an infinite number of options to rotate a plane normal to another. Here we attempt to
 * preserve Origin, P1 and P2 when rotating around targetPlane.
 * @param {vtkPlaneSource} planeToTransform
 * @param {vec3} targetOrigin Center of the plane
 * @param {vec3} targetNormal Normal to state to the plane
 * @param {vec3} viewType Vector that enforces view up
 */
export function transformPlane(
  planeToTransform,
  targetCenter,
  targetNormal,
  targetViewUp
) {
  planeToTransform.setNormal(targetNormal);
  const viewUp = vtkMath.subtract(
    planeToTransform.getPoint2(),
    planeToTransform.getOrigin(),
    []
  );
  const angle = vtkMath.signedAngleBetweenVectors(
    viewUp,
    targetViewUp,
    targetNormal
  );
  planeToTransform.rotate(angle, targetNormal);
  planeToTransform.setCenter(targetCenter);
}

// Get name of the line in the same plane as the input
export function getAssociatedLinesName(lineName) {
  switch (lineName) {
    case 'AxisXinY':
      return 'AxisZinY';
    case 'AxisXinZ':
      return 'AxisYinZ';
    case 'AxisYinX':
      return 'AxisZinX';
    case 'AxisYinZ':
      return 'AxisXinZ';
    case 'AxisZinX':
      return 'AxisYinX';
    case 'AxisZinY':
      return 'AxisXinY';
    default:
      return '';
  }
}

/**
 * Get the line name, constructs from the plane name and where the plane is displayed
 * Example: planeName='X' rotatedPlaneName='Y', then the return values will be 'AxisXinY'
 * @param {String} planeName Value between 'X', 'Y' and 'Z'
 * @param {String} rotatedPlaneName Value between 'X', 'Y' and 'Z'
 * @returns {String}
 */
export function getLineNameFromPlaneAndRotatedPlaneName(
  planeName,
  rotatedPlaneName
) {
  return `Axis${planeName}in${rotatedPlaneName}`;
}

/**
 * Extract the plane name from the line name
 * Example: 'AxisXinY' will return 'X'
 * @param {String} lineName Should be following this template : 'Axis_in_' with _ a character
 * @returns {String} Value between 'X', 'Y' and 'Z' or null if an error occured
 */
export function getPlaneNameFromLineName(lineName) {
  const match = lineName.match('([XYZ])in[XYZ]');
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Get the orthogonal plane name of 'planeName' in a specific 'rotatedPlaneName'
 * Example: planeName='X' on rotatedPlaneName='Z', then the associated plane name
 * of 'X' plane is 'Y'
 * @param {String} planeName
 * @param {String} rotatedPlaneName
 */
export function getAssociatedPlaneName(planeName, rotatedPlaneName) {
  const lineName = getLineNameFromPlaneAndRotatedPlaneName(
    planeName,
    rotatedPlaneName
  );
  const associatedLine = getAssociatedLinesName(lineName);
  return getPlaneNameFromLineName(associatedLine);
}
