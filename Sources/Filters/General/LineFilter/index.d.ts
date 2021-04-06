import { VtkAlgorithm, VtkObject } from "vtk.js/Sources/macro";

/**
 * 
 */
interface ILineFilterInitialValues {
}

type vtkLineFilterBase = VtkObject & VtkAlgorithm;

export interface vtkLineFilter extends vtkLineFilterBase {

    /**
     *
     * @param inData 
     * @param outData 
     */
    requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLineFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkLineFilter
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineFilterInitialValues): vtkLineFilter;


/**
 * vtkLineFilter - filters lines in polydata
 * 
 * vtkLineFilter is a filter that only let's through lines of a vtkPolydata.
 */
export declare const vtkLineFilter: {
    newInstance: typeof newInstance;
    extend: typeof extend;
}
export default vtkLineFilter;
