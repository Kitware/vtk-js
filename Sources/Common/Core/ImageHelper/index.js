import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 */
function canvasToImageData(canvas, boundingBox = [0, 0, 0, 0]) {
  const [top, left, width, height] = boundingBox;
  const ctxt = canvas.getContext('2d');
  const idata = ctxt.getImageData(top, left, width || canvas.width, height || canvas.height);

  const imageData = vtkImageData.newInstance({ type: 'vtkImageData' });
  imageData.setOrigin(0, 0, 0);
  imageData.setSpacing(1, 1, 1);
  imageData.setExtent(0, canvas.width - 1, 0, canvas.height - 1, 0, 0);

  const scalars = vtkDataArray.newInstance({ numberOfComponents: 4, values: idata.data });
  scalars.setName('scalars');
  imageData.getPointData().setScalars(scalars);

  return imageData;
}

/**
 * Converts an Image object to a vtkImageData.
 */
function imageToImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return canvasToImageData(canvas);
}

export default { canvasToImageData, imageToImageData };
