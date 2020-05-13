import { VtkImageData } from '../../DataModel/ImageData';
/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 */
declare function canvasToImageData(canvas: canvas, boundingBox?: Array<number>): VtkImageData;

/**
 * Converts an Image object to a vtkImageData.
 *
 * @param image image object to convert into vtkImageData
 * @param transform (default: { flipX: false, flipY: false, rotate: 0 })
 */
declare function imageToImageData(image: image, transform?: object): VtkImageData;

export default { canvasToImageData, imageToImageData };
