import { vec3, mat4, glMatrix } from 'gl-matrix';

const NoOp = (v) => v;

const IDENTITY = new Float64Array(16);
mat4.identity(IDENTITY);

const EPSILON = 1e-16;

class Transform {
  constructor(useDegree = false) {
    this.matrix = new Float64Array(16);
    mat4.identity(this.matrix);
    this.tmp = new Float64Array(3);
    this.angleConv = useDegree ? glMatrix.toRadian : NoOp;
  }

  rotateFromDirections(originDirection, targetDirection) {
    const src = new Float64Array(3);
    const dst = new Float64Array(3);
    const transf = new Float64Array(16);

    vec3.set(src, originDirection[0], originDirection[1], originDirection[2]);
    vec3.set(dst, targetDirection[0], targetDirection[1], targetDirection[2]);
    vec3.normalize(src, src);
    vec3.normalize(dst, dst);
    const cosAlpha = vec3.dot(src, dst);
    if (cosAlpha >= 1) {
      return this;
    }

    vec3.cross(this.tmp, src, dst);
    if (vec3.length(this.tmp, this.tmp) < EPSILON) {
      // cross product is 0, so pick arbitrary axis perpendicular
      // to originDirection.
      if (originDirection[0] === 0 && originDirection[1] === 0) {
        vec3.set(this.tmp, 0, 1, 0);
      } else {
        vec3.set(this.tmp, 0, -originDirection[2], -originDirection[1]);
      }
    }
    mat4.fromRotation(transf, Math.acos(cosAlpha), this.tmp);
    mat4.multiply(this.matrix, this.matrix, transf);

    return this;
  }

  rotate(angle, axis) {
    vec3.set(this.tmp, ...axis);
    vec3.normalize(this.tmp, this.tmp);
    mat4.rotate(this.matrix, this.matrix, this.angleConv(angle), this.tmp);
    return this;
  }

  rotateX(angle) {
    mat4.rotateX(this.matrix, this.matrix, this.angleConv(angle));
    return this;
  }

  rotateY(angle) {
    mat4.rotateY(this.matrix, this.matrix, this.angleConv(angle));
    return this;
  }

  rotateZ(angle) {
    mat4.rotateZ(this.matrix, this.matrix, this.angleConv(angle));
    return this;
  }

  translate(x, y, z) {
    vec3.set(this.tmp, x, y, z);
    mat4.translate(this.matrix, this.matrix, this.tmp);
    return this;
  }

  scale(sx, sy, sz) {
    vec3.set(this.tmp, sx, sy, sz);
    mat4.scale(this.matrix, this.matrix, this.tmp);
    return this;
  }

  apply(typedArray, offset = 0, nbIterations = -1) {
    if (
      IDENTITY[0] === this.matrix[0] &&
      IDENTITY[1] === this.matrix[1] &&
      IDENTITY[2] === this.matrix[2] &&
      IDENTITY[3] === this.matrix[3] &&
      IDENTITY[4] === this.matrix[4] &&
      IDENTITY[5] === this.matrix[5] &&
      IDENTITY[6] === this.matrix[6] &&
      IDENTITY[7] === this.matrix[7] &&
      IDENTITY[8] === this.matrix[8] &&
      IDENTITY[9] === this.matrix[9] &&
      IDENTITY[10] === this.matrix[10] &&
      IDENTITY[11] === this.matrix[11] &&
      IDENTITY[12] === this.matrix[12] &&
      IDENTITY[13] === this.matrix[13] &&
      IDENTITY[14] === this.matrix[14] &&
      IDENTITY[15] === this.matrix[15]
    ) {
      // Make sure we can chain apply...
      return this;
    }

    const size =
      nbIterations === -1 ? typedArray.length : offset + nbIterations * 3;
    for (let i = offset; i < size; i += 3) {
      vec3.set(this.tmp, typedArray[i], typedArray[i + 1], typedArray[i + 2]);
      vec3.transformMat4(this.tmp, this.tmp, this.matrix);
      typedArray[i] = this.tmp[0];
      typedArray[i + 1] = this.tmp[1];
      typedArray[i + 2] = this.tmp[2];
    }

    // Make sure we can chain apply...
    return this;
  }

  getMatrix() {
    return this.matrix;
  }

  getVTKMatrix() {
    mat4.transpose(this.matrix, this.matrix);
    return this.matrix;
  }

  setMatrix(mat4x4) {
    if (!!mat4x4 && mat4x4.length === 16) {
      this.matrix[0] = mat4x4[0];
      this.matrix[1] = mat4x4[1];
      this.matrix[2] = mat4x4[2];
      this.matrix[3] = mat4x4[3];
      this.matrix[4] = mat4x4[4];
      this.matrix[5] = mat4x4[5];
      this.matrix[6] = mat4x4[6];
      this.matrix[7] = mat4x4[7];
      this.matrix[8] = mat4x4[8];
      this.matrix[9] = mat4x4[9];
      this.matrix[10] = mat4x4[10];
      this.matrix[11] = mat4x4[11];
      this.matrix[12] = mat4x4[12];
      this.matrix[13] = mat4x4[13];
      this.matrix[14] = mat4x4[14];
      this.matrix[15] = mat4x4[15];
    }
    return this;
  }

  identity() {
    mat4.identity(this.matrix);
    return this;
  }
}

function buildFromDegree() {
  return new Transform(true);
}

function buildFromRadian() {
  return new Transform(false);
}

export default {
  buildFromDegree,
  buildFromRadian,
};
