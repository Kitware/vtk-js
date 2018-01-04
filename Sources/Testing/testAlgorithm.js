import test from 'tape-catch';
import macro from 'vtk.js/Sources/macro';

const model = {};
const publicAPI = {};
const numInputs = 2;
const numOutputs = 4;

const inLeft = new Float32Array(3);
const inRight = new Float32Array(3);
for (let i = 0; i < inLeft.length; i++) {
  inLeft[i] = i;
  inRight[i] = i + 3;
}

// const daLeft = vtkDataArray.newInstance({ name: 'left', values: inLeft });
// const daRight = vtkDataArray.newInstance({ name: 'left', values: inLeft });

publicAPI.requestData = (inData, outData) => {
  // implement requestData
  outData[0] = inData.reduce((inArray1, inArray2) =>
    inArray2.map((d, i) => d + inArray1[i])
  );
  outData[1] = inData.reduce((inArray1, inArray2) =>
    inArray2.map((d, i) => d - inArray1[i])
  );
  outData[2] = inData.reduce((inArray1, inArray2) =>
    inArray2.map((d, i) => d * inArray1[i])
  );
  outData[3] = inData.reduce((inArray1, inArray2) =>
    inArray2.map((d, i) => d / inArray1[i])
  );
};

test('Macro methods algo tests', (t) => {
  macro.algo(publicAPI, model, numInputs, numOutputs);

  // Override shouldUpdate to prevent the need of getMTime()
  publicAPI.shouldUpdate = () => true;

  t.ok(publicAPI.setInputData, 'populate publicAPI');

  publicAPI.setInputData(inLeft, 0);
  publicAPI.setInputData(inRight, 1);
  t.equal(publicAPI.getInputData(0), inLeft, 'return input data');

  publicAPI.update();
  let output = publicAPI.getOutputData(0);
  t.deepEqual(output, { 0: 3, 1: 5, 2: 7 }, 'Add two input arrays');

  output = publicAPI.getOutputData(1);
  t.deepEqual(output, { 0: 3, 1: 3, 2: 3 }, 'Subtract two input arrays');

  output = publicAPI.getOutputData(2);
  t.deepEqual(output, { 0: 0, 1: 4, 2: 10 }, 'Multiply two input arrays');

  const outputPort = publicAPI.getOutputPort(3);
  t.deepEqual(
    outputPort(),
    { 0: Infinity, 1: 4, 2: 2.5 },
    'Divide two input arrays, using outputPort'
  );

  t.end();
});
