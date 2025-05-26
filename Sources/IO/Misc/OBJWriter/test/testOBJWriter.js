import test from 'tape';
import vtkPLYReader from 'vtk.js/Sources/IO/Geometry/PLYReader';
import vtkOBJWriter from 'vtk.js/Sources/IO/Misc/OBJWriter';

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

const expectedMtlContent = `newmtl mat_01
map_Kd texture.png`;

const expectedObjContent = `# VTK.js generated OBJ File
mtllib material.mtl
usemtl mat_01
v 2 0 -2
v 2 0 0
v 0 0 0
v 0 0 -2
v 2 2 -2
v 0 2 -2
v 0 2 0
v 2 2 0
vn 0.5773500204086304 -0.5773500204086304 -0.5773500204086304
vn 0.5773500204086304 -0.5773500204086304 0.5773500204086304
vn -0.5773500204086304 -0.5773500204086304 0.5773500204086304
vn -0.5773500204086304 -0.5773500204086304 -0.5773500204086304
vn 0.5773500204086304 0.5773500204086304 -0.5773500204086304
vn -0.5773500204086304 0 -0.5773500204086304
vn 0 0 0.5773500204086304
vn 0 0 0.5773500204086304
vt 1 0
vt 1 0
vt 0 0
vt 0 0
vt 1 1
vt 0 1
vt 0 1
vt 1 1
f 1/1//1 2/2//2 3/3//3 4/4//4
f 5/5//5 6/6//6 7/7//7 8/8//8
f 1/1//1 5/5//5 8/8//8 2/2//2
f 2/2//2 8/8//8 7/7//7 3/3//3
f 3/3//3 7/7//7 6/6//6 4/4//4
f 5/5//5 1/1//1 4/4//4 6/6//6
`;

test('OBJWriter: Check conversion from PLY to OBJ', (t) => {
  const reader = vtkPLYReader.newInstance();
  reader.parseAsText(plyFile);
  const output = reader.getOutputData();
  const writer = vtkOBJWriter.newInstance();
  writer.setInputData(output);

  const objContent = writer.getOutputData();

  t.equal(
    objContent,
    expectedObjContent,
    'OBJ content should match expected output'
  );

  t.equal(
    writer.getMtl(),
    expectedMtlContent,
    'MTL content should match expected texture declaration'
  );

  t.end();
});
