declare namespace _default {
    export { canvasToImageData };
    export { imageToImageData };
}
export default _default;
/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 */
declare function canvasToImageData(canvas: any, boundingBox?: number[]): any;
/**
 * Converts an Image object to a vtkImageData.
 */
declare function imageToImageData(image: any, transform?: {
    flipX: boolean;
    flipY: boolean;
    rotate: number;
}): any;
