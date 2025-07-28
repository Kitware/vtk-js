import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkFrustumSource methods
// ----------------------------------------------------------------------------

function vtkFrustumSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFrustumSource');

  function computePoint(planeIndices, pt) {
    // Get planes and their normals/origins
    const plane0 = model.planes.getPlane(planeIndices[0]);
    const n0 = plane0.getNormal();
    const p0 = plane0.getOrigin();

    const plane1 = model.planes.getPlane(planeIndices[1]);
    const n1 = plane1.getNormal();
    const p1 = plane1.getOrigin();

    const plane2 = model.planes.getPlane(planeIndices[2]);
    const n2 = plane2.getNormal();
    const p2 = plane2.getOrigin();

    // Dot products
    const d0 = vtkMath.dot(p0, n0);
    const d1 = vtkMath.dot(p1, n1);
    const d2 = vtkMath.dot(p2, n2);

    // Cross products
    const c12 = [0, 0, 0];
    vtkMath.cross(n1, n2, c12);
    const c20 = [0, 0, 0];
    vtkMath.cross(n2, n0, c20);
    const c01 = [0, 0, 0];
    vtkMath.cross(n0, n1, c01);

    // Determinant
    const d = vtkMath.determinant3x3([...n0, ...n1, ...n2]);

    // Intersection point
    for (let i = 0; i < 3; ++i) {
      pt[i] = (d0 * c12[i] + d1 * c20[i] + d2 * c01[i]) / d;
    }
  }

  publicAPI.requestData = (inData, outData) => {
    const output = outData[0] || vtkPolyData.newInstance();

    if (!model.planes || model.planes.getNumberOfPlanes() !== 6) {
      vtkErrorMacro('vtkFrustum requires 6 planes.');
      return;
    }

    let nbPts = 8;

    let leftRightNull = false;
    let bottomTopNull = false;
    let parallelFrustum = false;

    // angle between left and right planes
    const n0 = model.planes.getPlane(0).getNormal().slice();
    const n1 = model.planes.getPlane(1).getNormal().slice();
    const c = [0, 0, 0];

    vtkMath.normalize(n0);
    vtkMath.normalize(n1);
    vtkMath.dot(n0, n1);

    vtkMath.cross(n0, n1, c);
    vtkMath.norm(c);

    // angle between bottom and top planes
    n0.splice(0, 3, ...model.planes.getPlane(2).getNormal());
    n1.splice(0, 3, ...model.planes.getPlane(3).getNormal());

    vtkMath.normalize(n0);
    vtkMath.normalize(n1);
    vtkMath.dot(n0, n1);

    vtkMath.cross(n0, n1, c);
    vtkMath.norm(c);

    if (model.showLines) {
      const left = model.planes.getPlane(0).getNormal();
      const right = model.planes.getPlane(1).getNormal();
      const bottom = model.planes.getPlane(2).getNormal();
      const top = model.planes.getPlane(3).getNormal();

      const leftRight = [0, 0, 0];
      vtkMath.cross(left, right, leftRight);

      leftRightNull =
        leftRight[0] === 0.0 && leftRight[1] === 0.0 && leftRight[2] === 0.0;

      const bottomTop = [0, 0, 0];
      vtkMath.cross(bottom, top, bottomTop);
      bottomTopNull =
        bottomTop[0] === 0.0 && bottomTop[1] === 0.0 && bottomTop[2] === 0.0;
      parallelFrustum = leftRightNull && bottomTopNull;

      if (parallelFrustum) {
        // start at near points, just add the 4 extra far points.
        nbPts += 4;
      } else if (leftRightNull || bottomTopNull) {
        // two extra starting points, and 4 extra far points.
        nbPts += 6;
      } else {
        // there is an apex, and 4 extra far points
        nbPts += 5;
      }
    }

    let pointType = 0;
    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }
    const newPoints = vtkPoints.newInstance({ dataType: pointType });

    newPoints.setNumberOfPoints(nbPts);

    const pt = [0.0, 0.0, 0.0];
    const planes = [0, 0, 0];

    planes[0] = 0; // left
    planes[1] = 2; // bottom
    planes[2] = 5; // near
    computePoint(planes, pt);
    newPoints.setPoint(0, ...pt);

    planes[0] = 1;
    computePoint(planes, pt);
    newPoints.setPoint(1, ...pt);

    planes[1] = 3;
    computePoint(planes, pt);
    newPoints.setPoint(2, ...pt);

    planes[0] = 0;
    computePoint(planes, pt);
    newPoints.setPoint(3, ...pt);

    planes[1] = 2;
    planes[2] = 4; // far
    computePoint(planes, pt);
    newPoints.setPoint(4, ...pt);

    planes[0] = 1;
    computePoint(planes, pt);
    newPoints.setPoint(5, ...pt);

    planes[1] = 3;
    computePoint(planes, pt);
    newPoints.setPoint(6, ...pt);

    planes[0] = 0;
    computePoint(planes, pt);
    newPoints.setPoint(7, ...pt);

    const numPolys = 6;
    const newPolys = vtkCellArray.newInstance();
    newPolys.allocate(numPolys * 5);

    // left
    newPolys.insertNextCell([4, 0, 3, 7]);

    // right
    newPolys.insertNextCell([1, 5, 6, 2]);

    // bottom
    newPolys.insertNextCell([0, 4, 5, 1]);

    // top
    newPolys.insertNextCell([3, 2, 6, 7]);

    // near
    newPolys.insertNextCell([0, 1, 2, 3]);

    // far
    newPolys.insertNextCell([4, 7, 6, 5]);

    let newLines = null;
    if (model.showLines) {
      const numLines = 4;
      newLines = vtkCellArray.newInstance();
      newLines.allocate(numLines * 3);

      const pts = [12, 8]; // apex, or first of the two extra near points.

      // line from lower-left corner
      if (parallelFrustum) {
        pts[0] = 0;
      }
      newLines.insertNextCell(pts);

      // line from lower-right corner
      if (parallelFrustum) {
        pts[0]++;
      } else if (leftRightNull) {
        pts[0] = 13;
      }
      pts[1]++;
      newLines.insertNextCell(pts);

      // line from upper-right corner
      if (parallelFrustum) {
        pts[0]++;
      } else if (bottomTopNull) {
        pts[0] = 13;
      }
      pts[1]++;
      newLines.insertNextCell(pts);

      // line from upper-left corner
      if (parallelFrustum) {
        pts[0]++;
      } else if (leftRightNull) {
        pts[0] = 12;
      }
      pts[1]++;
      newLines.insertNextCell(pts);
      output.setLines(newLines);
    }

    output.setPoints(newPoints);
    output.setPolys(newPolys);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  planes: null,
  showLines: true,
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Also make it an algorithm with no input and one output
  macro.algo(publicAPI, model, 0, 1);
  macro.setGet(publicAPI, model, [
    'showLines',
    'outputPointsPrecision',
    'planes',
  ]);

  vtkFrustumSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFrustumSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
