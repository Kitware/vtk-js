import BoundingBox from '..';

const bbox = BoundingBox.newInstance();

console.log('init', bbox.getBounds());
bbox.addPoint(0, 0, 0);
console.log('0, 0, 0', bbox.getBounds());
bbox.addPoint(1, 2, 3);
console.log('1, 2, 3', bbox.getBounds());
bbox.addPoint(-3, -2, -5);
console.log('-3, -2, -5', bbox.getBounds());
