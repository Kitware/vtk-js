import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

/**
 * Computes UV coordinates for top/bottom faces
 * @param {Array} vertices - The vertices array
 * @param {Number} iA - First index
 * @param {Number} iB - Second index
 * @param {Number} iC - Third index
 * @returns {Array} Array of UV coordinates
 */
function computeFacesUV(vertices, iA, iB, iC) {
  const ax = vertices[iA * 3];
  const ay = vertices[iA * 3 + 1];
  const bx = vertices[iB * 3];
  const by = vertices[iB * 3 + 1];
  const cx = vertices[iC * 3];
  const cy = vertices[iC * 3 + 1];
  return [
    [ax, ay],
    [bx, by],
    [cx, cy],
  ];
}

/**
 * Computes UV coordinates for side walls
 * @param {Array} vertices - The vertices array
 * @param {Number} iA - First index
 * @param {Number} iB - Second index
 * @param {Number} iC - Third index
 * @param {Number} iD - Fourth index
 * @returns {Array} Array of UV coordinates
 */
function computeSidesUV(vertices, iA, iB, iC, iD) {
  const ax = vertices[iA * 3];
  const ay = vertices[iA * 3 + 1];
  const az = vertices[iA * 3 + 2];
  const bx = vertices[iB * 3];
  const by = vertices[iB * 3 + 1];
  const bz = vertices[iB * 3 + 2];
  const cx = vertices[iC * 3];
  const cy = vertices[iC * 3 + 1];
  const cz = vertices[iC * 3 + 2];
  const dx = vertices[iD * 3];
  const dy = vertices[iD * 3 + 1];
  const dz = vertices[iD * 3 + 2];

  // Determine the best UV mapping direction based on geometry
  if (Math.abs(ay - by) < Math.abs(ax - bx)) {
    return [
      [ax, 1 - az],
      [bx, 1 - bz],
      [cx, 1 - cz],
      [dx, 1 - dz],
    ];
  }
  return [
    [ay, 1 - az],
    [by, 1 - bz],
    [cy, 1 - cz],
    [dy, 1 - dz],
  ];
}

/**
 * Creates a shape path object with methods for path operations
 * @returns {Object} A shape path object with methods for manipulating paths
 */
function createShapePath() {
  const curves = [];
  const currentPoint = [0, 0];
  const holes = [];

  return {
    curves,
    currentPoint,
    holes,
    moveTo(x, y) {
      currentPoint[0] = x;
      currentPoint[1] = y;
    },
    lineTo(x, y) {
      const start = [...currentPoint];
      const end = [x, y];
      curves.push({
        curveType: 'LineCurve',
        start,
        end,
        getPointAt(t) {
          return [
            start[0] + t * (end[0] - start[0]),
            start[1] + t * (end[1] - start[1]),
          ];
        },
        getPoints(resolution) {
          const points = [];
          for (let i = 0; i <= resolution; i++) {
            points.push(this.getPointAt(i / resolution));
          }
          return points;
        },
      });
      currentPoint[0] = x;
      currentPoint[1] = y;
    },
    quadraticCurveTo(cpX, cpY, x, y) {
      const start = [...currentPoint];
      const end = [x, y];
      const cp = [cpX, cpY];
      curves.push({
        curveType: 'QuadraticBezierCurve',
        cp,
        start,
        end,
        getPointAt(t) {
          const oneMinusT = 1 - t;
          return [
            oneMinusT * oneMinusT * start[0] +
              2 * oneMinusT * t * cp[0] +
              t * t * end[0],
            oneMinusT * oneMinusT * start[1] +
              2 * oneMinusT * t * cp[1] +
              t * t * end[1],
          ];
        },
        getPoints(resolution) {
          const points = [];
          for (let i = 0; i <= resolution; i++) {
            points.push(this.getPointAt(i / resolution));
          }
          return points;
        },
      });
      currentPoint[0] = x;
      currentPoint[1] = y;
    },
    bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y) {
      const start = [...currentPoint];
      const end = [x, y];
      const cp1 = [cp1X, cp1Y];
      const cp2 = [cp2X, cp2Y];
      curves.push({
        curveType: 'BezierCurve',
        cp1,
        cp2,
        start,
        end,
        getPointAt(t) {
          const oneMinusT = 1 - t;
          return [
            oneMinusT * oneMinusT * oneMinusT * start[0] +
              3 * oneMinusT * oneMinusT * t * cp1[0] +
              3 * oneMinusT * t * t * cp2[0] +
              t * t * t * end[0],
            oneMinusT * oneMinusT * oneMinusT * start[1] +
              3 * oneMinusT * oneMinusT * t * cp1[1] +
              3 * oneMinusT * t * t * cp2[1] +
              t * t * t * end[1],
          ];
        },
        getPoints(resolution) {
          const points = [];
          for (let i = 0; i <= resolution; i++) {
            points.push(this.getPointAt(i / resolution));
          }
          return points;
        },
      });
      currentPoint[0] = x;
      currentPoint[1] = y;
    },
    /**
     * Get points from the shape
     * @param {*} divisions
     * @returns
     */
    getPoints(divisions) {
      let last;
      const points = [];

      for (let i = 0; i < curves.length; i++) {
        const curve = curves[i];
        let resolution = divisions;

        if (curve.curveType === 'EllipseCurve') {
          resolution = divisions * 2;
        } else if (curve.curveType === 'LineCurve') {
          resolution = 1;
        }

        const pts = curve.getPoints(resolution);

        for (let j = 0; j < pts.length; j++) {
          const point = pts[j];
          // eslint-disable-next-line no-continue
          if (last && vtkMath.areEquals(last, point)) continue;
          points.push(point);
          last = point;
        }
      }

      return points;
    },

    /**
     * Extract points from the shape
     * @param {*} divisions
     * @returns
     */
    extractPoints(divisions) {
      const points = this.getPoints(divisions);
      const holesPoints = this.holes.map((hole) => hole.getPoints(divisions));
      return { shape: points, holes: holesPoints };
    },
    /**
     * Defines if a given point is inside the polygon defines by the path
     * @param {*} point
     * @param {*} polygon
     * @returns {boolean}
     */
    isPointInside(point, polygon) {
      const x = point[0];
      const y = point[1];
      let isInside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) isInside = !isInside;
      }

      return isInside;
    },
    isIntersect(path) {
      const pathA = this.getPoints(1, curves, false);
      const pathB = path.getPoints(1);
      return this.isPointInside(pathB[0], pathA);
    },
  };
}

/**
 * Calculates the bounding box size for a set of shapes
 * @param {Array} shapes - Array of shape objects
 * @param {Number} depth - Depth of the 3D text
 * @param {Number} curveSegments - Number of segments for curved paths
 * @returns {Object} Object with min and max point coordinates
 */
function getBoundingSize(shapes, depth, curveSegments) {
  const minPoint = [Infinity, Infinity, depth > 0 ? 0 : depth];
  const maxPoint = [-Infinity, -Infinity, depth < 0 ? 0 : depth];

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const shapePoints = shape.extractPoints(curveSegments);

    for (let j = 0; j < shapePoints.shape.length; j++) {
      const p = shapePoints.shape[j];
      if (p[0] < minPoint[0]) minPoint[0] = p[0];
      if (p[1] < minPoint[1]) minPoint[1] = p[1];
      if (p[0] > maxPoint[0]) maxPoint[0] = p[0];
      if (p[1] > maxPoint[1]) maxPoint[1] = p[1];
    }
  }

  return { min: minPoint, max: maxPoint };
}

/**
 * Removes duplicate end points in a points array
 * @param {Array} points - Array of points
 */
function removeDupEndPoints(points) {
  const l = points.length;
  const isEqual = vtkMath.areEquals(points[l - 1], points[0]);
  if (l > 2 && isEqual) {
    points.pop();
  }
}

/**
 * Checks if the points are in a clockwise order
 * @param {Array} points - Array of points [x, y]
 * @returns {Boolean} True if points are in clockwise order
 */
function isClockWise(points) {
  let sum = 0.0;
  const n = points.length;
  for (let p = n - 1, q = 0; q < n; p = q++) {
    sum += points[p][0] * points[q][1] - points[q][0] * points[p][1];
  }
  // Positive signed area means counter-clockwise, so return true if area is negative
  return sum * 0.5 < 0;
}

/**
 * Computes the bevel vector for a point in a shape.
 * @param {Array} pt - Current point [x, y]
 * @param {Array} prev - Previous point [x, y]
 * @param {Array} next - Next point [x, y]
 * @returns {Array} Normalized bevel vector [x, y]
 */
function computeBevelVector(pt, prev, next) {
  const vPrevX = pt[0] - prev[0];
  const vPrevY = pt[1] - prev[1];
  const vNextX = next[0] - pt[0];
  const vNextY = next[1] - pt[1];

  // Check collinearity
  const cross = vPrevX * vNextY - vPrevY * vNextX;
  let tx;
  let ty;
  let shrinkBy;

  if (Math.abs(cross) > Number.EPSILON) {
    // non‐collinear
    const lenPrev = Math.hypot(vPrevX, vPrevY);
    const lenNext = Math.hypot(vNextX, vNextY);

    // shift prev and next perpendicular to themselves
    const prevShiftX = prev[0] - vPrevY / lenPrev;
    const prevShiftY = prev[1] + vPrevX / lenPrev;
    const nextShiftX = next[0] - vNextY / lenNext;
    const nextShiftY = next[1] + vNextX / lenNext;

    // intersection factor
    const sf =
      ((nextShiftX - prevShiftX) * vNextY -
        (nextShiftY - prevShiftY) * vNextX) /
      (vPrevX * vNextY - vPrevY * vNextX);

    tx = prevShiftX + vPrevX * sf - pt[0];
    ty = prevShiftY + vPrevY * sf - pt[1];

    const lensq = tx * tx + ty * ty;
    if (lensq <= 2) {
      return [tx, ty];
    }
    shrinkBy = Math.sqrt(lensq / 2);
  } else {
    // collinear or opposing
    const sameDir =
      (vPrevX > 0 && vNextX > 0) ||
      (vPrevX < 0 && vNextX < 0) ||
      Math.sign(vPrevY) === Math.sign(vNextY);

    if (sameDir) {
      // perpendicular to prev
      tx = -vPrevY;
      ty = vPrevX;
      shrinkBy = Math.hypot(vPrevX, vPrevY);
    } else {
      // just offset along prev
      tx = vPrevX;
      ty = vPrevY;
      shrinkBy = Math.sqrt((vPrevX * vPrevX + vPrevY * vPrevY) / 2);
    }
  }

  return [tx / shrinkBy, ty / shrinkBy];
}

/**
 * Triangulates a shape with holes
 * @param {Array} contour - Array of contour points
 * @param {Array} holes - Array of hole paths
 * @returns {Array} Array of triangle faces as arrays of indices
 */
function triangulateShape(earcut, contour, holes) {
  const faces = [];
  const vertices = [];
  const holeIndices = [];

  removeDupEndPoints(contour);

  for (let i = 0; i < contour.length; i++) {
    vertices.push(contour[i][0], contour[i][1]);
  }

  let holeIndex = contour.length;
  holes.forEach(removeDupEndPoints);

  for (let i = 0; i < holes.length; i++) {
    holeIndices.push(holeIndex);

    const hole = holes[i];
    holeIndex += hole.length;

    for (let j = 0; j < hole.length; j++) {
      vertices.push(hole[j][0], hole[j][1]);
    }
  }

  const triangles = earcut(vertices, holeIndices);
  for (let i = 0; i < triangles.length; i += 3) {
    faces.push(triangles.slice(i, i + 3));
  }

  return faces;
}

/**
 * Scales a point along a vector
 * @param {Array} pt - Point to scale [x, y]
 * @param {Array} vec - Direction vector [x, y]
 * @param {Number} size - Scale amount
 * @returns {Array} Scaled point [x, y]
 */
function scalePoint(pt, vec, size) {
  const rt = [pt[0], pt[1]];
  rt[0] += vec[0] * size;
  rt[1] += vec[1] * size;
  return rt;
}

/**
 * Creates triangle faces with specified indices
 * @param {Array} layers - The layers array with vertex positions
 * @param {Number} a - First index
 * @param {Number} b - Second index
 * @param {Number} c - Third index
 * @param {Array} verticesArray - The output vertices array
 * @param {Array} uvArray - The output UV array
 * @param {Array} colorArray - The output color array
 * @param {Array} color - The color [r, g, b]
 * @param {Boolean} perFaceUV - Flag for per-face UV mapping
 * @param {Number} faceIndex - Index of the face for UV mapping
 */
function addTriangle(
  layers,
  a,
  b,
  c,
  verticesArray,
  uvArray,
  colorArray,
  color
) {
  const tri = [a, c, b];
  tri.forEach((i) => {
    verticesArray.push(layers[i * 3], layers[i * 3 + 1], layers[i * 3 + 2]);
  });

  const nextIndex = verticesArray.length / 3;
  const uvs = computeFacesUV(
    verticesArray,
    nextIndex - 3,
    nextIndex - 2,
    nextIndex - 1
  );

  // Add each UV coordinate pair to the array
  uvs.forEach((uv) => {
    uvArray.push(uv[0], uv[1]);
  });
  if (colorArray && color) {
    for (let i = 0; i < 3; ++i)
      colorArray.push(color[0] * 255, color[1] * 255, color[2] * 255);
  }
}

/**
 * Creates quad faces with specified indices
 * @param {Array} layers - The layers array with vertex positions
 * @param {Number} a - First index
 * @param {Number} b - Second index
 * @param {Number} c - Third index
 * @param {Number} d - Fourth index
 * @param {Array} verticesArray - The output vertices array
 * @param {Array} uvArray - The output UV array
 * @param {Array} colorArray - The output color array
 * @param {Array} color - The color [r, g, b]
 */
function addQuad(
  layers,
  a,
  b,
  c,
  d,
  verticesArray,
  uvArray,
  colorArray,
  color
) {
  const quad = [a, d, b, b, d, c];
  quad.forEach((i) =>
    verticesArray.push(layers[i * 3], layers[i * 3 + 1], layers[i * 3 + 2])
  );

  const nextIndex = verticesArray.length / 3;
  const uvs = computeSidesUV(
    verticesArray,
    nextIndex - 6,
    nextIndex - 3,
    nextIndex - 2,
    nextIndex - 1
  );

  // UV coordinates for both triangles of the quad
  // First triangle
  uvArray.push(uvs[0][0], uvs[0][1]);
  uvArray.push(uvs[1][0], uvs[1][1]);
  uvArray.push(uvs[3][0], uvs[3][1]);

  // Second triangle
  uvArray.push(uvs[1][0], uvs[1][1]);
  uvArray.push(uvs[2][0], uvs[2][1]);
  uvArray.push(uvs[3][0], uvs[3][1]);

  if (colorArray && color) {
    for (let i = 0; i < 6; ++i)
      colorArray.push(color[0] * 255, color[1] * 255, color[2] * 255);
  }
}

/**
 * Creates the faces for the top and bottom of the 3D text
 * @param {Array} layers - The layers array with vertex positions
 * @param {Array} faces - The triangulated faces
 * @param {Number} vlen - The number of vertices
 * @param {Number} steps - The number of steps
 * @param {Boolean} bevelEnabled - Whether bevel is enabled
 * @param {Number} bevelSegments - Number of bevel segments
 * @param {Array} verticesArray - The output vertices array
 * @param {Array} uvArray - The output UV array
 */
function buildLidFaces(
  layers,
  faces,
  vlen,
  steps,
  bevelEnabled,
  bevelSegments,
  verticesArray,
  uvArray,
  colorArray,
  color
) {
  if (bevelEnabled) {
    let layer = 0;
    let offset = vlen * layer; // Bottom faces
    faces.forEach(([a, b, c]) => {
      addTriangle(
        layers,
        c + offset,
        b + offset,
        a + offset,
        verticesArray,
        uvArray,
        colorArray,
        color
      );
    });

    layer = steps + bevelSegments * 2;
    offset = vlen * layer;

    // Top faces
    faces.forEach(([a, b, c]) => {
      addTriangle(
        layers,
        a + offset,
        b + offset,
        c + offset,
        verticesArray,
        uvArray,
        colorArray,
        color
      );
    });
  } else {
    // Bottom faces
    faces.forEach(([a, b, c]) => {
      addTriangle(layers, c, b, a, verticesArray, uvArray, colorArray, color);
    });

    // Top faces
    const offset = vlen * steps;
    faces.forEach(([a, b, c]) => {
      addTriangle(
        layers,
        a + offset,
        b + offset,
        c + offset,
        verticesArray,
        uvArray,
        colorArray,
        color
      );
    });
  }
}

/**
 * Creates side walls for contour or hole
 * @param {Array} layers - The layers array
 * @param {Array} contour - The contour points
 * @param {Number} layerOffset - Offset for the layer
 * @param {Number} vlen - The number of vertices
 * @param {Number} steps - The number of steps
 * @param {Number} bevelSegments - The number of bevel segments
 * @param {Array} verticesArray - The output vertices array
 * @param {Array} uvArray - The output UV array
 */
function buildWalls(
  layers,
  contour,
  layerOffset,
  vlen,
  steps,
  bevelSegments,
  verticesArray,
  uvArray,
  colorArray,
  color
) {
  const totalLayers = steps + bevelSegments * 2;
  for (let i = 0; i < contour.length; i++) {
    const j = i;
    const k = i === 0 ? contour.length - 1 : i - 1;

    for (let s = 0; s < totalLayers; s++) {
      const slen1 = vlen * s;
      const slen2 = vlen * (s + 1);

      const a = layerOffset + j + slen1;
      const b = layerOffset + k + slen1;
      const c = layerOffset + k + slen2;
      const d = layerOffset + j + slen2;

      addQuad(layers, a, b, c, d, verticesArray, uvArray, colorArray, color);
    }
  }
}

/**
 * Builds the side faces of the 3D text
 * @param {Array} layers - The layers array
 * @param {Array} contour - The contour points
 * @param {Array} holes - The holes
 * @param {Number} vlen - The number of vertices
 * @param {Number} steps - The number of steps
 * @param {Number} bevelSegments - The number of bevel segments
 * @param {Array} verticesArray - The output vertices array
 * @param {Array} uvArray - The output UV array
 */
function buildSideFaces(
  layers,
  contour,
  holes,
  vlen,
  steps,
  bevelSegments,
  verticesArray,
  uvArray,
  colorArray,
  color
) {
  let layerOffset = 0;
  // Create contour walls
  buildWalls(
    layers,
    contour,
    layerOffset,
    vlen,
    steps,
    bevelSegments,
    verticesArray,
    uvArray,
    colorArray,
    color
  );
  layerOffset += contour.length;

  // Create hole walls
  for (let i = 0; i < holes.length; i++) {
    const ahole = holes[i];
    buildWalls(
      layers,
      ahole,
      layerOffset,
      vlen,
      steps,
      bevelSegments,
      verticesArray,
      uvArray,
      colorArray,
      color
    );
    layerOffset += ahole.length;
  }
}

export {
  addTriangle,
  addQuad,
  buildLidFaces,
  buildWalls,
  buildSideFaces,
  computeBevelVector,
  computeFacesUV,
  computeSidesUV,
  createShapePath,
  getBoundingSize,
  isClockWise,
  scalePoint,
  triangulateShape,
};
