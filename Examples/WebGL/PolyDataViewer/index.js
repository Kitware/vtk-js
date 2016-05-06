import ConeSource from '../../../Sources/Filters/Sources/ConeSource';

// Create cone source instance
const coneSource = ConeSource.newInstance({ height: 2.0 });
const polydata = coneSource.getOutput();

console.log(polydata);
