import test from 'tape-catch';

import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

test('Test vtkAbstractMapper publicAPI', (t) => {
  const mapper = vtkMapper.newInstance();
  t.equal(mapper.getClippingPlanes().length, 0);

  const normals = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];

  const plane = vtkPlane.newInstance({ normal: normals[0] });
  mapper.addClippingPlane(plane);
  t.equal(mapper.getClippingPlanes().length, 1);
  mapper.removeClippingPlane(0);
  t.equal(mapper.getClippingPlanes().length, 0);
  mapper.setClippingPlanes(plane);
  t.equal(mapper.getClippingPlanes().length, 1);
  mapper.removeAllClippingPlanes();
  t.equal(mapper.getClippingPlanes().length, 0);
  mapper.removeClippingPlane(0);

  const plane2 = vtkPlane.newInstance({ normal: normals[1] });
  const plane3 = vtkPlane.newInstance({ normal: normals[2] });

  mapper.setClippingPlanes([plane, plane2, plane3]);
  t.equal(mapper.getClippingPlanes().length, 3);
  mapper.removeClippingPlane(0);
  t.equal(mapper.getClippingPlanes().length, 2);
  for (let i = 0; i < mapper.getClippingPlanes().length; i++) {
    const normal = mapper.getClippingPlanes()[i].getNormal();
    const refNormal = normals[i + 1];
    for (let j = 0; j < 3; j++) {
      t.equal(normal[j], refNormal[j]);
    }
  }
  t.end();
});
