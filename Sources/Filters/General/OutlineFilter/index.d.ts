import { vtkAlgorithm, vtkObject } from "../../../interfaces";

export const BOUNDS_MAP: number[];

export const LINE_ARRAY: number[];

/*
 * 
 */
export interface IOutlineFilterInitialValues {
}

type vtkOutlineFilterBase = vtkObject & vtkAlgorithm;

export interface vtkOutlineFilter extends vtkOutlineFilterBase {

    /**
     *
     * @param inData 
     * @param outData 
     */
    requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOutlineFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOutlineFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IOutlineFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkOutlineFilter
 * @param {IOutlineFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IOutlineFilterInitialValues): vtkOutlineFilter;


/**
 * vtkOutlineFilter - A filter that generates triangles for larger cells
 *
 * vtkOutlineFilter is a filter that converts cells wih more than 3 points into
 * triangles.
 */
export declare const vtkOutlineFilter: {
    newInstance: typeof newInstance;
    extend: typeof extend;
}
export default vtkOutlineFilter;
