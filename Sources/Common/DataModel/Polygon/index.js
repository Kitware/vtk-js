import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPriorityQueue from 'vtk.js/Sources/Common/Core/PriorityQueue';
import { IntersectionState } from 'vtk.js/Sources/Common/DataModel/Line/Constants';

// ----------------------------------------------------------------------------
// vtkPolygon methods
// ----------------------------------------------------------------------------

const EPSILON = 1e-6;

function vtkPolygon(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkPolygon');

  function computeNormal() {
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    model.normal = [0, 0, 0];
    const anchor = [...model.firstPoint.point];

    let point = model.firstPoint;
    for (let i = 0; i < model.pointCount; i++) {
      vtkMath.subtract(point.point, anchor, v1);
      vtkMath.subtract(point.next.point, anchor, v2);

      const n = [0, 0, 0];
      vtkMath.cross(v1, v2, n);
      vtkMath.add(model.normal, n, model.normal);

      point = point.next;
    }

    return vtkMath.normalize(model.normal);
  }

  function computeMeasure(point) {
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    const v3 = [0, 0, 0];
    const v4 = [0, 0, 0];

    vtkMath.subtract(point.point, point.previous.point, v1);
    vtkMath.subtract(point.next.point, point.point, v2);
    vtkMath.subtract(point.previous.point, point.next.point, v3);
    vtkMath.cross(v1, v2, v4);

    const area = vtkMath.dot(v4, model.normal);

    if (area <= 0) {
      return -1;
    }

    const perimeter = vtkMath.norm(v1) + vtkMath.norm(v2) + vtkMath.norm(v3);

    return (perimeter * perimeter) / area;
  }

  function canRemoveVertex(point) {
    if (model.pointCount <= 3) {
      return true;
    }

    const previous = point.previous;
    const next = point.next;

    const v = [0, 0, 0];
    vtkMath.subtract(next.point, previous.point, v);

    const sN = [0, 0, 0];
    vtkMath.cross(v, model.normal, sN);
    vtkMath.normalize(sN);
    if (vtkMath.norm(sN) === 0) {
      return false;
    }

    let val = vtkPlane.evaluate(sN, previous.point, next.next.point);
    // eslint-disable-next-line no-nested-ternary
    let currentSign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;
    let oneNegative = currentSign < 0 ? 1 : 0;

    for (
      let vertex = next.next.next;
      vertex.id !== previous.id;
      vertex = vertex.next
    ) {
      const previousVertex = vertex.previous;
      val = vtkPlane.evaluate(sN, previous.point, vertex.point);
      // eslint-disable-next-line no-nested-ternary
      const sign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;

      if (sign !== currentSign) {
        if (!oneNegative) {
          oneNegative = sign <= 0 ? 1 : 0;
        }

        if (
          vtkLine.intersection(
            previous.point,
            next.point,
            vertex.point,
            previousVertex.point,
            [0],
            [0]
          ) === IntersectionState.YES_INTERSECTION
        ) {
          return false;
        }
        currentSign = sign;
      }
    }

    return oneNegative === 1;
  }

  function removePoint(point, queue) {
    model.pointCount -= 1;

    const previous = point.previous;
    const next = point.next;

    model.tris = model.tris.concat(point.point);
    model.tris = model.tris.concat(next.point);
    model.tris = model.tris.concat(previous.point);

    previous.next = next;
    next.previous = previous;

    queue.deleteById(previous.id);
    queue.deleteById(next.id);

    const previousMeasure = computeMeasure(previous);
    if (previousMeasure > 0) {
      queue.push(previousMeasure, previous);
    }

    const nextMeasure = computeMeasure(next);
    if (nextMeasure > 0) {
      queue.push(nextMeasure, next);
    }

    if (point.id === model.firstPoint.id) {
      model.firstPoint = next;
    }
  }

  function earCutTriangulation() {
    computeNormal();

    const vertexQueue = vtkPriorityQueue.newInstance();
    let point = model.firstPoint;
    for (let i = 0; i < model.pointCount; i++) {
      const measure = computeMeasure(point);
      if (measure > 0) {
        vertexQueue.push(measure, point);
      }

      point = point.next;
    }

    while (model.pointCount > 2 && vertexQueue.length() > 0) {
      if (model.pointCount === vertexQueue.length()) {
        // convex
        const pointToRemove = vertexQueue.pop();
        removePoint(pointToRemove, vertexQueue);
      } else {
        // concave
        const pointToRemove = vertexQueue.pop();
        if (canRemoveVertex(pointToRemove)) {
          removePoint(pointToRemove, vertexQueue);
        }
      }
    }

    return model.pointCount <= 2;
  }

  publicAPI.triangulate = () => {
    if (!model.firstPoint) {
      return null;
    }

    return earCutTriangulation();
  };

  publicAPI.setPoints = (points) => {
    model.pointCount = points.length;

    model.firstPoint = {
      id: 0,
      point: points[0],
      next: null,
      previous: null,
    };

    let currentPoint = model.firstPoint;
    for (let i = 1; i < model.pointCount; i++) {
      currentPoint.next = {
        id: i,
        point: points[i],
        next: null,
        previous: currentPoint,
      };
      currentPoint = currentPoint.next;
    }

    model.firstPoint.previous = currentPoint;
    currentPoint.next = model.firstPoint;
  };

  publicAPI.getPointArray = () => model.tris;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  firstPoint: null,
  pointCount: 0,
  tris: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkPolygon(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolygon');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
