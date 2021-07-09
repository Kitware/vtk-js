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
  const idata = ctxt.getImageData(
    top,
    left,
    width || canvas.width,
    height || canvas.height
  );

  const imageData = vtkImageData.newInstance({ type: 'vtkImageData' });
  imageData.setOrigin(0, 0, 0);
  imageData.setSpacing(1, 1, 1);
  imageData.setExtent(
    0,
    (width || canvas.width) - 1,
    0,
    (height || canvas.height) - 1,
    0,
    0
  );

  const scalars = vtkDataArray.newInstance({
    numberOfComponents: 4,
    values: new Uint8Array(idata.data.buffer),
  });
  scalars.setName('scalars');
  imageData.getPointData().setScalars(scalars);

  return imageData;
}

/**
 * Converts an Image object to a vtkImageData.
 */
function imageToImageData(
  image,
  transform = { flipX: false, flipY: false, rotate: 0 }
) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext('2d');

  const { flipX, flipY, rotate } = transform;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return canvasToImageData(canvas);
}

export default { canvasToImageData, imageToImageData };
