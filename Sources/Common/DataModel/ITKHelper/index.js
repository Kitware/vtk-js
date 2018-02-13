import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
function convertItkToVtkImage(itkImage, options = {}) {
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
