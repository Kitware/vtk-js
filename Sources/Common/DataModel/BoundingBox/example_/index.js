import vtBoundingBox from '..';

const bbox = [...vtkBoundingBox.INIT_BOUNDS];

console.log('init', bbox);
vtkBoundingBox.addPoint(bbox, 0, 0, 0);
console.log('0, 0, 0', bbox);
vtkBoundingBox.addPoint(bbox, 1, 2, 3);
console.log('1, 2, 3', bbox);
vtkBoundingBox.addPoint(bbox, -3, -2, -5);
console.log('-3, -2, -5', bbox);
