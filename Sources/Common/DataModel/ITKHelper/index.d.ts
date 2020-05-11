declare namespace _default {
    export { convertItkToVtkImage };
    export { convertVtkToItkImage };
}
export default _default;
/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
declare function convertItkToVtkImage(itkImage: any, options?: {}): any;
/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
declare function convertVtkToItkImage(vtkImage: any, copyData?: boolean): {
    imageType: {
        dimension: number;
        pixelType: number;
        componentType: string;
        components: number;
    };
    name: string;
    origin: any;
    spacing: any;
    direction: {
        data: number[];
    };
    size: any;
};
