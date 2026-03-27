import { it, expect } from 'vitest';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

it('Test vtkBoundingBox inflate', () => {
  const bounds = [0, 10, 10, 20, -10, 10];
  const inflated = [-0.5, 10.5, 9.5, 20.5, -10.5, 10.5];

  const bbox = vtkBoundingBox.newInstance();
  bbox.setBounds(bounds);
  let inflatedBounds = bbox.inflate(0.5);
  expect(vtkMath.areEquals(inflatedBounds, inflated)).toBeTruthy();
  expect(vtkMath.areEquals(bbox.getBounds(), inflated)).toBeTruthy();

  inflatedBounds = vtkBoundingBox.inflate(bounds, 0.5);
  expect(vtkMath.areEquals(inflatedBounds, inflated)).toBeTruthy();
  expect(vtkMath.areEquals(bounds, inflated)).toBeTruthy();
});

it('Test vtkBoundingBox intersectBox', () => {
  const bounds = [-50, 50, -50, 50, -50, 50];
  const orig = [100, 0, 0];
  const dir = [-100, 0, 0];
  let coord = [];
  const tol = [];

  // Orig outside and intersect with dir
  const hit = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  expect(hit).toBe(1);
  expect(coord[0]).toBe(50);
  expect(coord[1]).toBe(0);
  expect(coord[2]).toBe(0);
  expect(tol[0]).toBe(0.5);

  // Orig outside and doesn't intersect with dir
  dir[0] = 100;
  coord = [];
  const hit2 = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  expect(hit2).toBe(0);

  // Orig inside bounds
  orig[0] = 0.0;
  orig[1] = 0.0;
  orig[2] = 0.0;
  coord = [];
  const hit3 = vtkBoundingBox.intersectBox(bounds, orig, dir, coord, tol);
  expect(hit3).toBe(1);
  expect(coord[0]).toBe(orig[0]);
  expect(coord[1]).toBe(orig[1]);
  expect(coord[2]).toBe(orig[2]);
  expect(tol[0]).toBe(0);
});

it('Test vtkBoundingBox intersectPlane', () => {
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
  expect(res1).toBe(1);

  // origin outside,parallel with nearest plane
  origin[0] = -2;
  origin[1] = 0;
  origin[2] = 0;

  normal[0] = -1;
  normal[1] = 0;
  normal[2] = 0;

  const res2 = vtkBoundingBox.intersectPlane(bounds, origin, normal);
  expect(res2).toBe(0);

  // origin outside, not parallel with nearest plane
  origin[0] = -2;
  origin[1] = 0;
  origin[2] = 0;

  normal[0] = 0;
  normal[1] = 1;
  normal[2] = 0;

  const res3 = vtkBoundingBox.intersectPlane(bounds, origin, normal);
  expect(res3).toBe(1);
});
