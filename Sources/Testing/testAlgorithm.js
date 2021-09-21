import test from 'tape-catch';
import macro from 'vtk.js/Sources/macros';

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
  t.deepEqual(output, new Float32Array([3, 5, 7]), 'Add two input arrays');

  output = publicAPI.getOutputData(1);
  t.deepEqual(output, new Float32Array([3, 3, 3]), 'Subtract two input arrays');

  output = publicAPI.getOutputData(2);
  t.deepEqual(
    output,
    new Float32Array([0, 4, 10]),
    'Multiply two input arrays'
  );

  const outputPort = publicAPI.getOutputPort(3);
  t.deepEqual(
    outputPort(),
    new Float32Array([Infinity, 4, 2.5]),
    'Divide two input arrays, using outputPort'
  );

  t.end();
});

test('Macro shouldUpdate returns true if output is deleted', (t) => {
  const algo = {
    publicAPI: {},
    model: {},
  };
  const input1 = {
    publicAPI: {},
    model: {},
  };

  const input2 = {
    publicAPI: {},
    model: {},
  };

  macro.obj(algo.publicAPI, algo.model);
  macro.algo(algo.publicAPI, algo.model, 1, 1);

  macro.obj(input1.publicAPI, input1.model);
  macro.obj(input2.publicAPI, input2.model);

  // trivial producer
  algo.publicAPI.requestData = (inData, outData) => {
    outData[0] = inData[0];
  };

  algo.publicAPI.setInputData(input1.publicAPI, 0);
  t.equal(
    input1.publicAPI,
    algo.publicAPI.getOutputData(),
    'Trivial producer outputs first input data'
  );

  // delete output data
  algo.publicAPI.getOutputData().delete();

  // set new data
  algo.publicAPI.setInputData(input2.publicAPI, 0);
  t.equal(
    input2.publicAPI,
    algo.publicAPI.getOutputData(),
    'Trivial producer outputs second input data'
  );

  t.end();
});
