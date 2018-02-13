import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
function convertItkToVtkImage(itkImage, options = {}) {
  // Make sure we can handle input pixel type
  // Refer to itk-js/src/PixelTypes.js for numerical values
  switch (itkImage.imageType.pixelType) {
    case 1: // Scalar
    case 2: // RGB
    case 3: // RGBA
      break;
    default:
      vtkErrorMacro(
        `Cannot handle ITK.js pixel type ${itkImage.imageType.pixelType}`
      );
      return null;
  }

  // create VTK image data
  const imageData = vtkImageData.newInstance({
    origin: itkImage.origin.slice(),
    spacing: itkImage.spacing.slice(),
  });
  const scalars = vtkDataArray.newInstance({
    name: options.scalarArrayName || 'Scalars',
    values: itkImage.data,
    numberOfComponents: itkImage.imageType.components,
  });

  imageData.setDirection(itkImage.direction.data);
  imageData.setDimensions(...itkImage.size);
  imageData.getPointData().setScalars(scalars);

  return imageData;
}

export default {
  convertItkToVtkImage,
};
