import { it, expect } from 'vitest';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

it('Test vtkAbstractMapper publicAPI', () => {
  const mapper = vtkMapper.newInstance();
  expect(mapper.getClippingPlanes().length).toBe(0);

  const normals = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
  ];

  const plane = vtkPlane.newInstance({ normal: normals[0] });
  mapper.addClippingPlane(plane);
  expect(mapper.getClippingPlanes().length).toBe(1);
  mapper.removeClippingPlane(plane);
  expect(mapper.getClippingPlanes().length).toBe(0);
  mapper.setClippingPlanes(plane);
  expect(mapper.getClippingPlanes().length).toBe(1);
  mapper.removeAllClippingPlanes();
  expect(mapper.getClippingPlanes().length).toBe(0);
  mapper.removeClippingPlane(plane);

  const plane2 = vtkPlane.newInstance({ normal: normals[1] });
  const plane3 = vtkPlane.newInstance({ normal: normals[2] });

  mapper.setClippingPlanes([plane, plane2, plane3]);
  expect(mapper.getClippingPlanes().length).toBe(3);
  mapper.removeClippingPlane(plane);
  expect(mapper.getClippingPlanes().length).toBe(2);
  for (let i = 0; i < mapper.getClippingPlanes().length; i++) {
    const normal = mapper.getClippingPlanes()[i].getNormal();
    const refNormal = normals[i + 1];
    for (let j = 0; j < 3; j++) {
      expect(normal[j]).toBe(refNormal[j]);
    }
  }
});
