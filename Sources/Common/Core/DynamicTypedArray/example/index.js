import { DynamicTypedArray } from '..';

 /*
  * Test 1
  */

const bArray = new DynamicTypedArray({ chunkSize: 5 });

console.log(bArray);

for (let i = 0; i < 27; ++i) {
  bArray.push(i);
}

console.log('Full array:');
console.log(bArray.getFrozenArray());

 /*
  * Test 2
  */

const bArray1 = new DynamicTypedArray({ chunkSize: 10 });

console.log(bArray1);

for (let i = 0; i < 30; ++i) {
  bArray1.push(i);
}

console.log('Full array:');
console.log(bArray1.getFrozenArray());
