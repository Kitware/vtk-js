import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import vtkImageData from "../../../Common/DataModel/ImageData";
import vtkPolyData from "../../../Common/DataModel/PolyData";

export const LINE_ARRAY: number[];

export interface IImageDataOutlineFilterInitialValues {
}

type vtkImageDataOutlineFilterBase = vtkObject & vtkAlgorithm;

export interface vtkImageDataOutlineFilter extends vtkImageDataOutlineFilterBase {
    /**
     *
     * @param inData 
     * @param outData 
     */
    requestData(inData: vtkImageData, outData: vtkPolyData): void;

    /**
     * Flag that indicates whether the output will generate faces of the outline.
     * @returns {boolean}
     */
    getGenerateFaces(): boolean;

    /**
     * Flag that indicates whether the output will generate wireframe lines of the outline.
     * @returns {boolean}
     */
    getGenerateLines(): boolean;

    /**
     * Flag to indicate that the output should generate wireframe of the outline.
     * @param {boolean} generateLines
     */
    setGenerateLines(generateLines: boolean): boolean;

    /**
     * Flag to indicate that the output should generate triangulated faces of the outline.
     * @param {boolean} generateFaces
     */
    setGenerateFaces(generateFaces: boolean): boolean;

}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkImageDataOutlineFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageDataOutlineFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageDataOutlineFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkImageDataOutlineFilter
 * @param {IImageDataOutlineFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageDataOutlineFilterInitialValues): vtkImageDataOutlineFilter;


/**
 * vtkImageDataOutlineFilter - A filter that generates oriented outline for
 * vtkImageData.
 *
 * vtkImageDataOutlineFilter is a filter that generates a wireframe or
 * triangulated rectangular-cuboid as an outline of an input vtkImageData.
 * It takes into account the orientation / DirectionMatrix of the image, so the
 * output outline may not be axes aligned.
 * 
 */
export declare const vtkImageDataOutlineFilter: {
    newInstance: typeof newInstance;
    extend: typeof extend;
}
export default vtkImageDataOutlineFilter;
