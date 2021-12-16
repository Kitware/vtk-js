import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageCropFilter methods
// ----------------------------------------------------------------------------

function vtkImageCropFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCropFilter');

  // --------------------------------------------------------------------------

  publicAPI.reset = () => {
    const data = publicAPI.getInputData();
    if (data) {
      publicAPI.setCroppingPlanes(...data.getExtent());
    }
  };

  // --------------------------------------------------------------------------

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

    const extent = input.getExtent();
    const cropped =
      model.croppingPlanes && model.croppingPlanes.length === 6
        ? extent.map((e, i) => {
            if (i % 2 === 0) {
              // min plane
              return Math.max(e, Math.round(model.croppingPlanes[i]));
            }
            // max plane
            return Math.min(e, Math.round(model.croppingPlanes[i]));
          })
        : extent.slice();

    if (
      cropped[0] === extent[0] &&
      cropped[1] === extent[1] &&
      cropped[2] === extent[2] &&
      cropped[3] === extent[3] &&
      cropped[4] === extent[4] &&
      cropped[5] === extent[5]
    ) {
      const sameAsInput = vtkImageData.newInstance();
      sameAsInput.shallowCopy(input); // Force new mtime
      outData[0] = sameAsInput;
      return;
    }

    // reorder if needed
    for (let i = 0; i < 3; ++i) {
      if (cropped[i * 2] > cropped[i * 2 + 1]) {
        [cropped[i * 2], cropped[i * 2 + 1]] = [
          cropped[i * 2 + 1],
          cropped[i * 2],
        ];
      }
    }

    // restrict crop bounds based on extent bounds
    for (let i = 0; i < 6; i += 2) {
      // min case
      cropped[i] = Math.max(cropped[i], extent[i]);
      // max case
      cropped[i + 1] = Math.min(cropped[i + 1], extent[i + 1]);
    }

    const numberOfComponents = scalars.getNumberOfComponents();
    const componentSize =
      (cropped[1] - cropped[0] + 1) *
      (cropped[3] - cropped[2] + 1) *
      (cropped[5] - cropped[4] + 1) *
      numberOfComponents;
    const scalarsData = scalars.getData();

    const dims = input.getDimensions();
    const jStride = numberOfComponents * dims[0];
    const kStride = numberOfComponents * dims[0] * dims[1];
    const beginOffset = (cropped[0] - extent[0]) * numberOfComponents;
    const stripSize = (cropped[1] - cropped[0] + 1) * numberOfComponents; // +1 because subarray end is exclusive

    // crop image
    const croppedArray = new scalarsData.constructor(componentSize);
    let index = 0;
    for (let k = cropped[4]; k <= cropped[5]; ++k) {
      for (let j = cropped[2]; j <= cropped[3]; ++j) {
        const begin =
          beginOffset + (j - extent[2]) * jStride + (k - extent[4]) * kStride;
        const end = begin + stripSize;
        const slice = scalarsData.subarray(begin, end);
        croppedArray.set(slice, index);
        index += slice.length;
      }
    }
    const outImage = vtkImageData.newInstance({
      extent: cropped,
      origin: input.getOrigin(),
      direction: input.getDirection(),
      spacing: input.getSpacing(),
    });

    const croppedScalars = vtkDataArray.newInstance({
      name: scalars.getName(),
      numberOfComponents,
      values: croppedArray,
    });

    outImage.getPointData().setScalars(croppedScalars);

    outData[0] = outImage;
  };

  publicAPI.isResetAvailable = () => {
    if (model.croppingPlanes == null || model.croppingPlanes.length === 0) {
      return false;
    }
    const data = publicAPI.getInputData();
    if (data) {
      const originalExtent = data.getExtent();
      const findDifference = originalExtent.find(
        (v, i) => Math.abs(model.croppingPlanes[i] - v) > Number.EPSILON
      );
      return findDifference !== undefined;
    }
    return false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // croppingPlanes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // no orientation support yet
  macro.setGetArray(publicAPI, model, ['croppingPlanes'], 6);

  // Object specific methods
  vtkImageCropFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCropFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
