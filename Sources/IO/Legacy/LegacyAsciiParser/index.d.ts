import vtkPolyData from '../../../Common/DataModel/PolyData';

/**
 * Mutable state threaded through the line parsers. `parseLegacyASCII` fills it
 * in and returns it; `dataset` holds the parsed geometry.
 */
export interface ILegacyAsciiDataModel {
  dataset?: vtkPolyData;

  /**
   * Line consumer installed by the section currently being parsed. Returns
   * false once the section is complete.
   */
  arrayHandler?: (line: string) => boolean;

  activeFieldLocation?: 'POINT_DATA' | 'CELL_DATA';

  /**
   * Number of points declared by the POINT_DATA section.
   */
  POINT_DATA?: number;

  /**
   * Number of cells declared by the CELL_DATA section.
   */
  CELL_DATA?: number;
}

/**
 * Parse the content of a legacy VTK ASCII file. Only the POLYDATA dataset type
 * is supported.
 *
 * @param {String} content The file content.
 * @param {ILegacyAsciiDataModel} [dataModel] Object to fill in (default {}).
 */
declare function parseLegacyASCII(
  content: string,
  dataModel?: ILegacyAsciiDataModel
): ILegacyAsciiDataModel;

/**
 * vtkLegacyAsciiParser turns the text of a legacy VTK file into a vtkPolyData.
 */
declare const vtkLegacyAsciiParser: {
  parseLegacyASCII: typeof parseLegacyASCII;
};
export default vtkLegacyAsciiParser;
