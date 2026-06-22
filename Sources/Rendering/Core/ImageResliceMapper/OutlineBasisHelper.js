import { mat3, vec3 } from 'gl-matrix';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { EPSILON } from 'vtk.js/Sources/Common/Core/Math/Constants';

const tmpMat3 = new Float64Array(9);
const tmpTangent1 = [0, 0, 0];
const tmpTangent2 = [0, 0, 0];
const tmpVec3a = vec3.create();
const tmpVec3b = vec3.create();

export function computeSliceTangents(slicePlane, planeNormalOut = [0, 0, 1]) {
  planeNormalOut[0] = 0;
  planeNormalOut[1] = 0;
  planeNormalOut[2] = 1;
  if (slicePlane) {
    const n = slicePlane.getNormal();
    planeNormalOut[0] = n[0];
    planeNormalOut[1] = n[1];
    planeNormalOut[2] = n[2];
  }
  vtkMath.normalize(planeNormalOut);

  tmpTangent1[0] = 0;
  tmpTangent1[1] = 0;
  tmpTangent1[2] = 0;
  tmpTangent2[0] = 0;
  tmpTangent2[1] = 0;
  tmpTangent2[2] = 0;

  if (slicePlane) {
    vtkMath.perpendiculars(planeNormalOut, tmpTangent1, tmpTangent2, 0);
    if (
      vtkMath.norm(tmpTangent1) < EPSILON ||
      vtkMath.norm(tmpTangent2) < EPSILON
    ) {
      tmpTangent1[0] = 1;
      tmpTangent1[1] = 0;
      tmpTangent1[2] = 0;
      tmpTangent2[0] = 0;
      tmpTangent2[1] = 1;
      tmpTangent2[2] = 0;
    }
  } else {
    tmpTangent1[0] = 1;
    tmpTangent2[1] = 1;
  }

  return {
    planeNormal: planeNormalOut,
    tangent1: tmpTangent1,
    tangent2: tmpTangent2,
  };
}

export function computeInputOutlineBasis(
  imageData,
  tangent1,
  tangent2,
  texelSizeOut
) {
  mat3.set(tmpMat3, ...imageData.getDirection());
  mat3.invert(tmpMat3, tmpMat3);

  vec3.transformMat3(tmpVec3a, tangent1, tmpMat3);
  vec3.transformMat3(tmpVec3b, tangent2, tmpMat3);

  const dims = imageData.getDimensions();
  const spacing = imageData.getSpacing();
  const minSpacing = Math.min(
    Math.abs(spacing[0]),
    Math.abs(spacing[1]),
    Math.abs(spacing[2])
  );
  texelSizeOut[0] = minSpacing / (dims[0] * Math.abs(spacing[0]));
  texelSizeOut[1] = minSpacing / (dims[1] * Math.abs(spacing[1]));
  texelSizeOut[2] = minSpacing / (dims[2] * Math.abs(spacing[2]));

  return { tangent1: tmpVec3a, tangent2: tmpVec3b, texelSize: texelSizeOut };
}
