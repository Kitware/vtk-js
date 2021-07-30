import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageSliceFilter methods
// ----------------------------------------------------------------------------

function vtkImageSliceFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageSliceFilter');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    const scalars = input.getPointData().getScalars();

    if (!scalars) {
      vtkErrorMacro('No scalars from input');
      return;
    }

    const datasetDefinition = input.get('extent', 'spacing', 'origin');
    datasetDefinition.extent[4] = model.sliceIndex;
    datasetDefinition.extent[5] = datasetDefinition.extent[4];

    const numberOfComponents = scalars.getNumberOfComponents();
    const sliceSize =
      (datasetDefinition.extent[1] - datasetDefinition.extent[0] + 1) *
      (datasetDefinition.extent[3] - datasetDefinition.extent[2] + 1) *
      numberOfComponents;
    const offset = sliceSize * model.sliceIndex;
    const sliceRawArray = scalars.getData().slice(offset, offset + sliceSize);
    const sliceArray = vtkDataArray.newInstance({
      name: scalars.getName(),
      numberOfComponents,
      values: sliceRawArray,
    });

    const output = vtkImageData.newInstance(datasetDefinition);
    output.getPointData().setScalars(sliceArray);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  sliceIndex: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['sliceIndex', 'orientation']);

  // Object specific methods
  vtkImageSliceFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageSliceFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
