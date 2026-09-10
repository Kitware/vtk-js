import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

const { vtkErrorMacro } = macro;

function vtkImageAppendComponents(publicAPI, model) {
  model.classHierarchy.push('vtkImageAppendComponents');

  publicAPI.requestData = (inData, outData) => {
    const inputs = inData.filter(Boolean); // remove null/undefined inputs
    if (inputs.length === 0) {
      vtkErrorMacro('vtkImageAppendComponents: no valid inputs');
      return;
    }

    if (inputs.length === 1) {
      const output = outData[0]?.initialize() || vtkImageData.newInstance();
      output.shallowCopy(inputs[0]);
      outData[0] = output;
      return;
    }

    const output = outData[0]?.initialize() || vtkImageData.newInstance();
    output.setDimensions(inputs[0].getDimensions());
    output.setSpacing(inputs[0].getSpacing());
    output.setOrigin(inputs[0].getOrigin());

    const numberOfVoxels =
      inputs[0].getDimensions()[0] *
      inputs[0].getDimensions()[1] *
      inputs[0].getDimensions()[2];
    const numberOfComponents = inputs.reduce(
      (acc, input) =>
        acc + input.getPointData().getScalars().getNumberOfComponents(),
      0
    );

    const ArrayType = inputs[0]
      .getPointData()
      .getScalars()
      .getData().constructor;
    const outValues = new ArrayType(numberOfVoxels * numberOfComponents);
    const outArray = vtkDataArray.newInstance({
      name: 'Scalars',
      numberOfComponents,
      values: outValues,
    });
    output.getPointData().setScalars(outArray);

    let outComponent = 0;
    inputs
      .map((input) => input.getPointData().getScalars())
      .forEach((inputScalars) => {
        const inputNumberOfComponents = inputScalars.getNumberOfComponents();
        const inputValues = inputScalars.getData();
        for (let i = 0; i < numberOfVoxels; i++) {
          for (let c = 0; c < inputNumberOfComponents; c++) {
            outValues[i * numberOfComponents + outComponent + c] =
              inputValues[i * inputNumberOfComponents + c];
          }
        }
        outComponent += inputNumberOfComponents;
      });

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkImageAppendComponents(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageAppendComponents'
);

export default { newInstance, extend };
