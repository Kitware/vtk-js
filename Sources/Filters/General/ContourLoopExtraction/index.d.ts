import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkPolyData from '../../../Common/DataModel/PolyData';
/**
 * Initial configuration values for vtkContourLoopExtraction instances.
 */
export interface IContourLoopExtractionInitialValues {}

type vtkContourLoopExtractionBase = vtkObject & vtkAlgorithm;

export interface vtkContourLoopExtraction extends vtkContourLoopExtractionBase {
  /**
   * Runs the contour extraction algorithm with the given input and output data.
   * @param inData - The input data for the contour extraction.
   * @param outData - The output data where the extracted contours will be stored.
   */
  requestData(inData: vtkPolyData[], outData: vtkPolyData[]): void;

  /**
   * Extracts contour loops from the given polydata input and populates the given output.
   * @param input - The input polydata
   * @param output - The output polydata
   */
  extractContours(input: vtkPolyData, output: vtkPolyData): void;

  /**
   * Traverses a loop starting from a given line and point, in a specified direction.
   * @param pd - The polydata which to traverse.
   * @param dir - The direction of traversal.
   * @param startLineId - The ID of the starting line.
   * @param startPtId - The ID of the starting point.
   * @param loopPoints - The array to store the traversed points of the loop.
   * @returns The last point ID after traversal.
   */
  traverseLoop(
    pd: vtkPolyData,
    dir: number,
    startLineId: number,
    startPtId: number,
    loopPoints: Array<{ t: number; ptId: number }>
  ): number;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkContourLoopExtraction characteristics.
 *
 * @param publicAPI - Object on which methods will be bound (public).
 * @param model - Object on which data structure will be bound (protected).
 * @param initialValues - (Optional) Initial values to assign to the model.
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IContourLoopExtractionInitialValues
): void;

/**
 * Method used to create a new instance of vtkContourLoopExtraction.
 *
 * @param initialValues - (Optional) Initial values for the instance.
 */
export function newInstance(
  initialValues?: IContourLoopExtractionInitialValues
): vtkContourLoopExtraction;

// ----------------------------------------------------------------------------

/**
 * vtkContourLoopExtraction specific static methods.
 */
export declare const vtkContourLoopExtraction: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkContourLoopExtraction;
