import { Extent } from '../../../types';
import { StructuredType } from './Constants';

/**
 * Return the data description (see StructuredType) of the given extent, i.e.
 * whether it describes an empty dataset, a single point, a line, a plane or a
 * volume.
 * @param {Extent} inExt
 */
export function getDataDescriptionFromExtent(inExt: Extent): StructuredType;

/**
 * vtkStructuredData provides helpers to describe structured datasets from
 * their extent.
 */
declare const vtkStructuredData: {
  getDataDescriptionFromExtent: typeof getDataDescriptionFromExtent;
  StructuredType: typeof StructuredType;
};
export default vtkStructuredData;
