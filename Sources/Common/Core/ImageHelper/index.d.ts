import vtkImageData from '../../../Common/DataModel/ImageData';

interface ITransform {
  flipX: boolean;
  flipY: boolean;
  rotate: number;
}

/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param {HTMLCanvasElement} canvas The HTML canvas to convert.
 * @param {Number[]} [boundingBox] A bounding box array.
 */
declare function canvasToImageData(
  canvas: HTMLCanvasElement,
  boundingBox?: number[]
): vtkImageData;

/**
 * Converts an Image object to a vtkImageData.
 * @param {HTMLImageElement} image The HTML image to convert.
 * @param {ITransform} [transform] The transform object to apply to the image.
 */
declare function imageToImageData(
  image: HTMLImageElement,
  transform?: ITransform
): vtkImageData;

declare const _default: {
  canvasToImageData: typeof canvasToImageData;
  imageToImageData: typeof imageToImageData;
};
export default _default;
