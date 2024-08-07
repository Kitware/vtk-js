import vtkImageData from '../../../Common/DataModel/ImageData';
import vtkDataArray from '../../../Common/Core/DataArray';
import { vtkObject } from '../../../interfaces';

/**
 * Compute and return a hash than can be used for caching resources
 *
 * @param transferFunction The transfer function, it can be any vtkObject, but is usually a vtkTransferFunction
 * @param useIndependentComponents A boolean taken from the image or volume property, using getIndependentComponents()
 * @param numberOfComponents Taken from the data array, using getNumberOfComponents()
 */
export function getTransferFunctionHash(
  transferFunction: vtkObject | undefined,
  useIndependentComponents: boolean,
  numberOfComponents: number
): string;

/**
 * Compute and return a hash than can be used for caching resources
 *
 * @param image The image data that contains the scalars
 * @param scalars The scalars used for rendering
 */
export function getImageDataHash(
  image: vtkImageData,
  scalars: vtkDataArray
): string;

declare const defaultExport: {
  getTransferFunctionHash: typeof getTransferFunctionHash;
  getImageDataHash: typeof getImageDataHash;
};

export default defaultExport;
