/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 */
declare function canvasToImageData(canvas: any, boundingBox?: number[]): any;
export interface T100 {
  flipX: boolean;
  flipY: boolean;
  rotate: number;
}
/**
 * Converts an Image object to a vtkImageData.
 */
declare function imageToImageData(image: any, transform?: T100): any;
export interface T101 {
  canvasToImageData: typeof canvasToImageData;
  imageToImageData: typeof imageToImageData;
}
declare const T102: T101;
export default T102;
