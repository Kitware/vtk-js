import { vtkObject } from "../../../interfaces";

/**
 * Compute and return a hash than can be used for caching resources
 *
 * @param transferFunction The transfer function, it can be any vtkObject, but is usually a vtkTransferFunction
 * @param useIndependentComponents A boolean taken from the image or volume property, using getIndependentComponents()
 * @param numberOfComponents Taken from the data array, using getNumberOfComponents()
 */
export function getTransferFunctionHash(transferFunction: vtkObject | undefined, useIndependentComponents: boolean, numberOfComponents: number): string;

declare const defaultExport: {
  getTransferFunctionHash: typeof getTransferFunctionHash;
};

export default defaultExport;
