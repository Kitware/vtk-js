import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 * 
 */
export interface IImageOutlineFilterInitialValues {
    slicingMode?: number;
    background?: number;
}

type vtkImageOutlineFilterBase = vtkObject & vtkAlgorithm;

export interface vtkImageOutlineFilter extends vtkImageOutlineFilterBase {

    /**
     * 
     * @default 0
     */
    getBackground(): number;

    /**
     * 
     * @default 2
     */
    getSlicingMode(): number;

    /**
     *
     * @param inData 
     * @param outData 
     */
    requestData(inData: any, outData: any): void;

     /**
      * 
      * @param background 
      */
    setBackground(background: number): boolean; 

    /**
     * 
     * @param slicingMode 
     */
    setSlicingMode(slicingMode: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageOutlineFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageOutlineFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageOutlineFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkImageOutlineFilter
 * @param {IImageOutlineFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageOutlineFilterInitialValues): vtkImageOutlineFilter;


/**
 * vtkImageOutlineFilter - generates outline of labelmap from an vtkImageData
 * input in a given direction (slicing mode).   
 *
 * vtkImageOutlineFilter creates a region (labelmap) outline based on input data
 * given . The output is a vtkImageData object containing only boundary voxels.
 */
export declare const vtkImageOutlineFilter: {
    newInstance: typeof newInstance;
    extend: typeof extend;
}
export default vtkImageOutlineFilter;
