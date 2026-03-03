import { it, expect } from 'vitest';
import vtkPLYReader from 'vtk.js/Sources/IO/Geometry/PLYReader';

const plyFile = `ply
format ascii 1.0
comment Created by vtk.js with normals and UVs
element vertex 8
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
property float nx
property float ny
property float nz
property float u
property float v
element face 6
property list uchar uint vertex_indices
end_header
2.000000 0.000000 -2.000000 255 255   0  0.577350 -0.577350 -0.577350  1.0 0.0
2.000000 0.000000  0.000000 255   0   0  0.577350 -0.577350  0.577350  1.0 0.0
0.000000 0.000000  0.000000   0   0   0 -0.577350 -0.577350  0.577350  0.0 0.0
0.000000 0.000000 -2.000000   0 255   0 -0.577350 -0.577350 -0.577350  0.0 0.0
2.000000 2.000000 -2.000000 255 255 255  0.577350  0.577350 -0.577350  1.0 1.0
0.000000 2.000000 -2.000000   0 255 255 -0.577350  0.577350 -0.577350  0.0 1.0
0.000000 2.000000  0.000000   0   0 255 -0.577350  0.577350  0.577350  0.0 1.0
2.000000 2.000000  0.000000 255   0 255  0.577350  0.577350  0.577350  1.0 1.0
4 0 1 2 3
4 4 5 6 7
4 0 4 7 1
4 1 7 6 2
4 2 6 5 3
4 4 0 3 5`;

const pointCloudPLY = `ply
format ascii 1.0
element vertex 4
property float x
property float y
property float z
end_header
0 0 0
1 1 1
2 2 2
3 3 3`;

it('PLYReader: Parse ASCII PLY file', () => {
  const plyReader = vtkPLYReader.newInstance({
    duplicatePointsForFaceTexture: false,
  });
  plyReader.parseAsText(plyFile);
  const output = plyReader.getOutputData();
  expect(output.getNumberOfPoints()).toBe(8);
  expect(output.getPoints().getData()).toEqual(
    new Float32Array([
      2, 0, -2, 2, 0, 0, 0, 0, 0, 0, 0, -2, 2, 2, -2, 0, 2, -2, 0, 2, 0, 2, 2,
      0,
    ])
  );
  expect(output.getPolys().getData()).toEqual(
    new Uint32Array([
      4, 0, 1, 2, 3, 4, 4, 5, 6, 7, 4, 0, 4, 7, 1, 4, 1, 7, 6, 2, 4, 2, 6, 5, 3,
      4, 4, 0, 3, 5,
    ])
  );
});

it('PLYReader: Parse Point Cloud PLY file', () => {
  const plyReader = vtkPLYReader.newInstance({
    duplicatePointsForFaceTexture: false,
  });
  plyReader.parseAsText(pointCloudPLY);
  const output = plyReader.getOutputData();
  expect(output.getNumberOfPoints()).toBe(4);
  expect(output.getPoints().getData()).toEqual(
    new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3])
  );
});

it('PLYReader: Parse PLY with color', () => {
  const plyReader = vtkPLYReader.newInstance({
    duplicatePointsForFaceTexture: false,
  });
  plyReader.parseAsText(plyFile);
  const output = plyReader.getOutputData();
  expect(output.getPointData().getScalars().getData()).toEqual(
    new Uint8Array([
      255, 255, 0, 255, 0, 0, 0, 0, 0, 0, 255, 0, 255, 255, 255, 0, 255, 255, 0,
      0, 255, 255, 0, 255,
    ])
  );
});

it('PLYReader: Parse PLY with normals', () => {
  const plyReader = vtkPLYReader.newInstance({
    duplicatePointsForFaceTexture: false,
  });
  plyReader.parseAsText(plyFile);
  const output = plyReader.getOutputData();
  expect(output.getPointData().getNormals().getData()).toEqual(
    new Float32Array([
      0.5773500204086304, -0.5773500204086304, -0.5773500204086304,
      0.5773500204086304, -0.5773500204086304, 0.5773500204086304,
      -0.5773500204086304, -0.5773500204086304, 0.5773500204086304,
      -0.5773500204086304, -0.5773500204086304, -0.5773500204086304,
      0.5773500204086304, 0.5773500204086304, -0.5773500204086304,
      -0.5773500204086304, 0.0, -0.5773500204086304, 0.0, 0.0,
      0.5773500204086304, 0.0, 0.0, 0.5773500204086304,
    ])
  );
});

it('PLYReader: Parse PLY with texture coordinates', () => {
  const plyReader = vtkPLYReader.newInstance();
  plyReader.parse(plyFile);
  const output = plyReader.getOutputData();
  expect(output.getPointData().getTCoords().getData()).toEqual(
    new Float32Array([1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1])
  );
});
