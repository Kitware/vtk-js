import vtkBoundingBox, {
  STATIC,
} from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

/**
 * Fit the plane defined by origin, p1, p2 onto the bounds.
 * Plane is untouched if does not intersect bounds.
 * @param {Array} bounds
 * @param {Array} origin
 * @param {Array} p1
 * @param {Array} p2
 */
export function boundPlane(bounds, origin, p1, p2) {
  const v1 = [];
  vtkMath.subtract(p1, origin, v1);

  const v2 = [];
  vtkMath.subtract(p2, origin, v2);

  const n = [0, 0, 1];
  vtkMath.cross(v1, v2, n);
  const plane = vtkPlane.newInstance();
  plane.setOrigin(origin);
  plane.setNormal(n);
  vtkMath.normalize(v1);
  vtkMath.normalize(v2);
  vtkMath.normalize(n);

  const cubeSource = vtkCubeSource.newInstance();
  cubeSource.setBounds(bounds);

  const cutter = vtkCutter.newInstance();
  cutter.setCutFunction(plane);
  cutter.setInputConnection(cubeSource.getOutputPort());

  const cutBounds = cutter.getOutputData();
  if (cutBounds.getNumberOfPoints() === 0) {
    return;
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
}
// Project point (inPoint) to the bounds of the image according to a plane
// defined by two vectors (v1, v2)
export function boundPoint(inPoint, v1, v2, bounds) {
  const absT1 = v1.map((val) => Math.abs(val));
  const absT2 = v2.map((val) => Math.abs(val));
  const epsilon = 0.00001;

  let o1 = 0.0;
  let o2 = 0.0;

  for (let i = 0; i < 3; i++) {
    let axisOffset = 0;

    const useT1 = absT1[i] > absT2[i];
    const t = useT1 ? v1 : v2;
    const absT = useT1 ? absT1 : absT2;

    if (inPoint[i] < bounds[i * 2]) {
      axisOffset = absT[i] > epsilon ? (bounds[2 * i] - inPoint[i]) / t[i] : 0;
    } else if (inPoint[i] > bounds[2 * i + 1]) {
      axisOffset =
        absT[i] > epsilon ? (bounds[2 * i + 1] - inPoint[i]) / t[i] : 0;
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
  vtkBox.intersectBox(bounds, p1, dir12, out, tolerance);

  return out;
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

export function getViewPlaneNameFromViewType(viewType) {
  switch (viewType) {
    case ViewTypes.SAGITTAL:
      return 'X';
    case ViewTypes.CORONAL:
      return 'Y';
    case ViewTypes.AXIAL:
      return 'Z';
    default:
      return '';
  }
}

// Update the extremities and the rotation point coordinate of the line
function updateLine(lineState, center, axis, lineLength, rotationLength) {
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
  const rotationP1 = [
    center[0] - rotationLength * axis[0],
    center[1] - rotationLength * axis[1],
    center[2] - rotationLength * axis[2],
  ];
  const rotationP2 = [
    center[0] + rotationLength * axis[0],
    center[1] + rotationLength * axis[1],
    center[2] + rotationLength * axis[2],
  ];

  lineState.setPoint1(p1);
  lineState.setPoint2(p2);
  lineState.setRotationPoint1(rotationP1);
  lineState.setRotationPoint2(rotationP2);
}

// Update the reslice cursor state according to the three planes normals and the origin
export function updateState(widgetState) {
  // Compute axis
  const xNormal = widgetState.getXPlaneNormal();
  const yNormal = widgetState.getYPlaneNormal();
  const zNormal = widgetState.getZPlaneNormal();
  const newXAxis = [];
  const newYAxis = [];
  const newZAxis = [];
  vtkMath.cross(xNormal, yNormal, newZAxis);
  vtkMath.cross(yNormal, zNormal, newXAxis);
  vtkMath.cross(zNormal, xNormal, newYAxis);

  const bounds = widgetState.getImage().getBounds();
  const center = widgetState.getCenter();
  // Factor used to define where the rotation point will be displayed
  // according to the plane size where there will be visible
  const factor = 0.5 * 0.85;
  const xRotationLength = (bounds[1] - bounds[0]) * factor;
  const yRotationLength = (bounds[3] - bounds[2]) * factor;
  const zRotationLength = (bounds[5] - bounds[4]) * factor;

  // Length of the principal diagonal.
  const pdLength = 20 * 0.5 * vtkBoundingBox.getDiagonalLength(bounds);

  updateLine(
    widgetState.getAxisXinY(),
    center,
    newZAxis,
    pdLength,
    zRotationLength
  );
  updateLine(
    widgetState.getAxisYinX(),
    center,
    newZAxis,
    pdLength,
    zRotationLength
  );

  updateLine(
    widgetState.getAxisYinZ(),
    center,
    newXAxis,
    pdLength,
    xRotationLength
  );
  updateLine(
    widgetState.getAxisZinY(),
    center,
    newXAxis,
    pdLength,
    xRotationLength
  );

  updateLine(
    widgetState.getAxisXinZ(),
    center,
    newYAxis,
    pdLength,
    yRotationLength
  );
  updateLine(
    widgetState.getAxisZinX(),
    center,
    newYAxis,
    pdLength,
    yRotationLength
  );
}
