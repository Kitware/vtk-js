import vtkDataArray from './Common/Core/DataArray';
import macro from './macro';
import { VtkSubscription } from './macro';
// import { VtkRange } from './Common/Core/DataArray';

const a = vtkDataArray.newInstance();
const b = a.onModified(() => {});
b.macro.formatBytesToProperUnit(100, 2, 1024);
const r: VtkRange = a.getRange();
console.log(r);
