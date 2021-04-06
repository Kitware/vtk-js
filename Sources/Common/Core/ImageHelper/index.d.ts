/**
 *
 */
interface ITransform {

	/**
	 *
	 */
	flipX : boolean;

	/**
	 *
	 */
	flipY : boolean;

	/**
	 *
	 */
	rotate : number;
}

/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 * @param canvas
 * @param boundingBox
 */
export function canvasToImageData(canvas : any, boundingBox : number[]): void;

/**
 * Converts an Image object to a vtkImageData.
 * @param image
 * @param transform
 */
export function imageToImageData(image : any, transform : ITransform): void;
