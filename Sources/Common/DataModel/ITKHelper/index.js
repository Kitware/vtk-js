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

  const vtkImage = {
    origin: [0, 0, 0],
    spacing: [1, 1, 1],
  };

  const dimensions = [1, 1, 1];
  const direction = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  for (let idx = 0; idx < itkImage.imageType.dimension; ++idx) {
    vtkImage.origin[idx] = itkImage.origin[idx];
    vtkImage.spacing[idx] = itkImage.spacing[idx];
    dimensions[idx] = itkImage.size[idx];
    for (let col = 0; col < itkImage.imageType.dimension; ++col) {
      // ITK (and VTKMath) use a row-major index axis, but the direction
      // matrix on the vtkImageData is a webGL matrix, which uses a
      // column-major data layout. Transpose the direction matrix from
      // itkImage when instantiating that vtkImageData direction matrix.
      direction[col + idx * 3] =
        itkImage.direction.data[idx + col * itkImage.imageType.dimension];
    }
  }

  // Create VTK Image Data
  const imageData = vtkImageData.newInstance(vtkImage);

  // create VTK image data
  const scalars = vtkDataArray.newInstance({
    name: options.scalarArrayName || 'Scalars',
    values: itkImage.data,
    numberOfComponents: itkImage.imageType.components,
  });

  imageData.setDirection(direction);
  imageData.setDimensions(...dimensions);
  imageData.getPointData().setScalars(scalars);

  return imageData;
}

export default {
  convertItkToVtkImage,
};
