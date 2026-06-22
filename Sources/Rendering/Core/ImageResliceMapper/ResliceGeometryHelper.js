import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import { mat3, vec3 } from 'gl-matrix';

const tmpAxisAlignedN = [0, 0, 0];

export function isVectorAxisAligned(n) {
  vtkMath.normalize(n);
  for (let i = 0; i < 3; ++i) {
    vec3.zero(tmpAxisAlignedN);
    tmpAxisAlignedN[i] = 1.0;
    const dotP = vtkMath.dot(n, tmpAxisAlignedN);
    if (dotP < -0.999999 || dotP > 0.999999) {
      return [true, i];
    }
  }
  return [false, 2];
}

export function fillPackedNormals(values, normal, numberOfPoints) {
  for (let i = 0; i < numberOfPoints; ++i) {
    values[3 * i] = normal[0];
    values[3 * i + 1] = normal[1];
    values[3 * i + 2] = normal[2];
  }
}

export function computeResliceGeometryState(renderable, firstImageData) {
  let resGeomString = '';
  let orthoSlicing = true;
  let orthoAxis = 2;
  const imageBounds = firstImageData?.getBounds();
  const slicePD = renderable.getSlicePolyData();
  let slicePlane = renderable.getSlicePlane();

  if (slicePD) {
    resGeomString = `PolyData${slicePD.getMTime()}`;
  } else if (slicePlane) {
    resGeomString = `Plane${slicePlane.getMTime()}`;
    if (firstImageData) {
      resGeomString = `${resGeomString}Image${firstImageData.getMTime()}`;
      const w2io = mat3.create();
      mat3.set(w2io, ...firstImageData.getDirection());
      mat3.invert(w2io, w2io);
      const imageLocalNormal = [...slicePlane.getNormal()];
      vec3.transformMat3(imageLocalNormal, imageLocalNormal, w2io);
      [orthoSlicing, orthoAxis] = isVectorAxisAligned(imageLocalNormal);
    }
  } else {
    slicePlane = vtkPlane.newInstance();
    slicePlane.setNormal(0, 0, 1);
    let bds = [0, 1, 0, 1, 0, 1];
    if (firstImageData) {
      bds = imageBounds;
    }
    slicePlane.setOrigin(bds[0], bds[2], 0.5 * (bds[4] + bds[5]));
    renderable.setSlicePlane(slicePlane);
    resGeomString = `Plane${slicePlane.getMTime()}Image${
      firstImageData?.getMTime?.() ?? 0
    }`;
  }

  return {
    resGeomString,
    slicePD,
    slicePlane,
    orthoSlicing,
    orthoAxis,
  };
}

export function computeObliqueSliceGeometryData(
  firstImageData,
  slicePlane,
  outlineFilter,
  cutter,
  lineToSurfaceFilter
) {
  outlineFilter.setInputData(firstImageData);
  cutter.setInputConnection(outlineFilter.getOutputPort());
  cutter.setCutFunction(slicePlane);
  lineToSurfaceFilter.setInputConnection(cutter.getOutputPort());
  lineToSurfaceFilter.update();
  const planePD = lineToSurfaceFilter.getOutputData();
  const points = planePD.getPoints().getData();
  const polys = planePD.getPolys().getData();
  const normal = [...slicePlane.getNormal()];
  vtkMath.normalize(normal);
  const numberOfPoints = planePD.getPoints().getNumberOfPoints();
  const normalsData = new Float32Array(numberOfPoints * 3);
  fillPackedNormals(normalsData, normal, numberOfPoints);
  return { points, polys, normalsData };
}

export function computeOrthoSliceGeometryData(
  firstImageData,
  slicePlane,
  orthoAxis,
  transform
) {
  const points = new Float32Array(12);
  const indexSpacePlaneOrigin = firstImageData.worldToIndex(
    slicePlane.getOrigin(),
    [0, 0, 0]
  );
  const otherAxes = [(orthoAxis + 1) % 3, (orthoAxis + 2) % 3].sort();
  const ext = firstImageData.getSpatialExtent();
  let ptIdx = 0;
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < 2; ++j) {
      points[ptIdx + orthoAxis] = indexSpacePlaneOrigin[orthoAxis];
      points[ptIdx + otherAxes[0]] = ext[2 * otherAxes[0] + j];
      points[ptIdx + otherAxes[1]] = ext[2 * otherAxes[1] + i];
      ptIdx += 3;
    }
  }
  transform.setMatrix(firstImageData.getIndexToWorld());
  transform.transformPoints(points, points);

  const polys = new Uint16Array([3, 0, 1, 3, 3, 0, 3, 2]);
  const normal = [...slicePlane.getNormal()];
  vtkMath.normalize(normal);
  const normalsData = new Float32Array(12);
  fillPackedNormals(normalsData, normal, 4);
  return { points, polys, normalsData };
}
