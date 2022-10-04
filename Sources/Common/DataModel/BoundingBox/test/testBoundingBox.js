import test from 'tape-catch';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

test('Test vtkBoundingBox inflate', (t) => {
  const bounds = [0, 10, 10, 20, -10, 10];
  const inflated = [-0.5, 10.5, 9.5, 20.5, -10.5, 10.5];

  const bbox = vtkBoundingBox.newInstance();
  bbox.setBounds(bounds);
  let inflatedBounds = bbox.inflate(0.5);
  t.ok(vtkMath.areEquals(inflatedBounds, inflated));
  t.ok(vtkMath.areEquals(bbox.getBounds(), inflated));

  inflatedBounds = vtkBoundingBox.inflate(bounds, 0.5);
  t.ok(vtkMath.areEquals(inflatedBounds, inflated));
  t.ok(vtkMath.areEquals(bounds, inflated));

  t.end();
});

test('Test vtkBoundingBox intersectBox', (t) => {
  const bounds = [-50, 50, -50, 50, -50, 50];
  const orig = [100, 0, 0];
  const dir = [-100, 0, 0];
  let coord = [];
  const tol = [];

  // Orig outside and intersect with dir
  const hit = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit, 1);
  t.equal(coord[0], 50);
  t.equal(coord[1], 0);
  t.equal(coord[2], 0);
  t.equal(tol[0], 0.5);

  // Orig outside and doesn't intersect with dir
  dir[0] = 100;
  coord = [];
  const hit2 = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit2, 0);

  // Orig inside bounds
  orig[0] = 0.0;
  orig[1] = 0.0;
  orig[2] = 0.0;
  coord = [];
  const hit3 = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit3, 1);
  t.equal(coord[0], orig[0]);
  t.equal(coord[1], orig[1]);
  t.equal(coord[2], orig[2]);
  t.equal(tol[0], 0);

  t.end();
});

test('Test vtkBoundingBox intersectPlane', (t) => {
  const bounds = [-1, 1, -1, 1, -1, 1];
  const origin = [];
  const normal = [];

  // Origin inside
  origin[0] = 0;
  origin[1] = 0;
  origin[2] = 0;

  normal[0] = 1;
  normal[1] = 1;
  normal[2] = 1;

  const res1 = vtkBoundingBox.intersectPlane(bounds, origin, normal);
  t.equal(res1, 1);

  // origin outside,parallel with nearest plane
  origin[0] = -2;
  origin[1] = 0;
  origin[2] = 0;

  normal[0] = -1;
  normal[1] = 0;
  normal[2] = 0;

  const res2 = vtkBoundingBox.intersectPlane(bounds, origin, normal);
  t.equal(res2, 0);

  // origin outside, not parallel with nearest plane
  origin[0] = -2;
  origin[1] = 0;
  origin[2] = 0;

  normal[0] = 0;
  normal[1] = 1;
  normal[2] = 0;

  const res3 = vtkBoundingBox.intersectPlane(bounds, origin, normal);
  t.equal(res3, 1);

  t.end();
});
