import vtkImageData from "../../../Common/DataModel/ImageData";

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
 * @param {Number[]} [boundingBox] A bounding box of type [top, left, width, height]
 */
export function canvasToImageData(canvas : HTMLCanvasElement, boundingBox?: number[]): vtkImageData;

/**
 * Converts an Image object to a vtkImageData.
 * @param {HTMLImageElement} image The HTML image to convert.
 * @param {ITransform} [transform] default={flipX: false, flipY: false, rotate: 0}
 */
export function imageToImageData(image : HTMLImageElement, transform?: ITransform): vtkImageData;
