import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

const { vtkErrorMacro } = macro;

function vtkImageAppend(publicAPI, model) {
  model.classHierarchy.push('vtkImageAppend');

  function computeLayout(inputs) {
    const axis = model.appendAxis;
    const shifts = new Array(inputs.length).fill(0);
    let outExt;

    if (model.preserveExtents) {
      const bbox = vtkBoundingBox.newInstance();
      inputs.forEach((input) => {
        bbox.addBounds(input.getExtent());
      });
      outExt = bbox.getBounds();
    } else {
      // Compute shifts if we are not preserving extents.
      const firstExt = inputs[0].getExtent();
      const min = firstExt[axis * 2];
      let tmp = min;

      inputs.forEach((input, idx) => {
        const ext = input.getExtent();
        shifts[idx] = tmp - ext[axis * 2];
        const size = ext[axis * 2 + 1] - ext[axis * 2] + 1;
        tmp += size;
      });

      // outExt starts as input 0's whole extent; only
      // the append axis is overwritten. The other two axes are NOT unioned
      // in this mode - all inputs are assumed to share them.
      outExt = firstExt.slice();
      outExt[axis * 2] = min;
      outExt[axis * 2 + 1] = tmp - 1;
    }

    return { outExt, shifts };
  }

  function allocateZeroArrays(imageData, numberOfElements) {
    const outArrays = [];
    for (let a = 0; a < imageData.getNumberOfArrays(); a++) {
      const inArray = imageData.getArrayByIndex(a);
      const nc = inArray.getNumberOfComponents();
      const ArrayType = inArray.getData().constructor;
      outArrays.push(
        vtkDataArray.newInstance({
          name: inArray.getName(),
          numberOfComponents: nc,
          values: new ArrayType(numberOfElements * nc),
        })
      );
    }
    return outArrays;
  }

  publicAPI.requestData = (inData, outData) => {
    const inputs = inData.filter(Boolean); // remove null/undefined inputs
    if (inputs.length === 0) {
      vtkErrorMacro('vtkImageAppend: no valid inputs');
      return;
    }

    if (inputs.length === 1) {
      const output = outData[0]?.initialize() || vtkImageData.newInstance();
      output.shallowCopy(inputs[0]);
      outData[0] = output;
      return;
    }

    // ---- RequestInformation ----
    const { outExt, shifts } = computeLayout(inputs);
    const axis = model.appendAxis;

    const outPtDims = [
      outExt[1] - outExt[0] + 1,
      outExt[3] - outExt[2] + 1,
      outExt[5] - outExt[4] + 1,
    ];
    const numberOfPoints = outPtDims[0] * outPtDims[1] * outPtDims[2];

    const output = outData[0]?.initialize() || vtkImageData.newInstance();
    output.setExtent(outExt);
    output.setSpacing(inputs[0].getSpacing());
    output.setOrigin(inputs[0].getOrigin());

    // ---- InitOutput ----
    const outPointArrays = allocateZeroArrays(
      inputs[0].getPointData(),
      numberOfPoints
    );
    outPointArrays.forEach((arr) => output.getPointData().addArray(arr));
    if (outPointArrays.length > 0) {
      output.getPointData().setActiveScalars(outPointArrays[0].getName());
    }

    // ---- ThreadedRequestData ----
    // Index-space copy of one point-data array, combining the "shift" and
    // "clip" stepswith the nested idxZ/idxY/idxX loop from vtkImageAppendFunctor.
    function copyOneArray(input, inExt, cOutExt, inArray, outArray) {
      const nc = inArray.getNumberOfComponents();
      const inValues = inArray.getData();
      const outValues = outArray.getData();

      const inWholeExt = input.getExtent();
      const inDims = input.getDimensions();

      const maxX = inExt[1] - inExt[0] + 1;
      const maxY = inExt[3] - inExt[2] + 1;
      const maxZ = inExt[5] - inExt[4] + 1;

      // Base offsets of the clipped region within the input's own array,
      // and within the output array.
      const inBaseX = inExt[0] - inWholeExt[0];
      const inBaseY = inExt[2] - inWholeExt[2];
      const inBaseZ = inExt[4] - inWholeExt[4];
      const outBaseX = cOutExt[0] - outExt[0];
      const outBaseY = cOutExt[2] - outExt[2];
      const outBaseZ = cOutExt[4] - outExt[4];

      for (let idxZ = 0; idxZ < maxZ; idxZ++) {
        for (let idxY = 0; idxY < maxY; idxY++) {
          for (let idxX = 0; idxX < maxX; idxX++) {
            const inIdx =
              inBaseX +
              idxX +
              inDims[0] * (inBaseY + idxY + inDims[1] * (inBaseZ + idxZ));
            const outIdx =
              outBaseX +
              idxX +
              outPtDims[0] *
                (outBaseY + idxY + outPtDims[1] * (outBaseZ + idxZ));
            for (let c = 0; c < nc; c++) {
              outValues[outIdx * nc + c] = inValues[inIdx * nc + c];
            }
          }
        }
      }
    }

    for (let idx1 = 0; idx1 < inputs.length; idx1++) {
      const input = inputs[idx1];

      // Clip this input's whole extent against the output
      const inExt = input.getExtent();

      // Where that clipped region lands in the output.
      const cOutExt = inExt.slice();
      cOutExt[axis * 2] = inExt[axis * 2] + shifts[idx1];
      cOutExt[axis * 2 + 1] = inExt[axis * 2 + 1] + shifts[idx1];

      // "Quick check to see if the input is used at all" - same guard as
      // the C++ ThreadedRequestData, expressed with vtkBoundingBox.isValid()
      // instead of the manual min<=max comparisons per axis.
      if (!vtkBoundingBox.isValid(inExt)) {
        continue; // eslint-disable-line no-continue
      }

      const inPD = input.getPointData();
      for (let ai = 0; ai < inPD.getNumberOfArrays(); ai++) {
        const inArray = inPD.getArrayByIndex(ai);
        const outArray = outPointArrays[ai];
        if (!inArray || !outArray) {
          continue;
        }
        if (
          inArray.getNumberOfComponents() !== outArray.getNumberOfComponents()
        ) {
          vtkErrorMacro(
            `vtkImageAppend: Execute: input ${idx1} number of components does not match output`
          );
          return;
        }
        if (inArray.getDataType() !== outArray.getDataType()) {
          vtkErrorMacro(
            `vtkImageAppend: Execute: input ${idx1} ScalarType (${inArray.getDataType()}), must match output ScalarType (${outArray.getDataType()})`
          );
          return;
        }
        copyOneArray(input, inExt, cOutExt, inArray, outArray);
      }
    }

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  appendAxis: 0,
  preserveExtents: false,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);
  macro.setGet(publicAPI, model, ['appendAxis', 'preserveExtents']);

  // Object specific methods
  vtkImageAppend(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageAppend');

export default { newInstance, extend };
