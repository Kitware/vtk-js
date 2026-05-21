import { it, expect } from 'vitest';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';

it('Test vtkBox instance', () => {
  expect(vtkBox, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkBox.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkBox bounds', () => {
  const box = vtkBox.newInstance();

  // Test setting of bounds
  const bounds = [-50, 50, -50, 50, -50, 50];
  box.setBounds(bounds);
  const newBounds = box.getBounds();
  for (let i = 0; i < bounds.length; i++) {
    expect(newBounds[i]).toBe(bounds[i]);
  }
});

it('Test vtkBox evaluateFunction', () => {
  const bounds = [-50, 50, -50, 50, -50, 50];
  const box = vtkBox.newInstance();
  box.setBounds(bounds);

  let point = [0.0, 0.0, 0.0];
  let res = box.evaluateFunction(point);
  expect(res).toBe(-50);

  point = [100.0, 0.0, 0.0];
  res = box.evaluateFunction(point);
  expect(res).toBe(50);

  point = [50.0, 0.0, 0.0];
  res = box.evaluateFunction(point);
  expect(res).toBe(0);

  res = box.evaluateFunction(...point);
  expect(res).toBe(0);
});
