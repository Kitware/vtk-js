import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkDataSetAttributes from '../../../Common/DataModel/DataSetAttributes';
import { FormatTypes } from './Constants';

/**
 *
 */
export interface IXMLWriterInitialValues {
  /**
   * Size, in bytes, of the blocks the binary payload is split into before being
   * compressed.
   * @default 1024
   */
  blockSize?: number;

  /**
   * How the data arrays are encoded in the produced XML.
   * @default FormatTypes.BINARY
   */
  format?: FormatTypes;
}

type vtkXMLWriterBase = vtkObject &
  Omit<vtkAlgorithm, 'getOutputData' | 'getOutputPort'>;

export interface vtkXMLWriter extends vtkXMLWriterBase {
  /**
   * Get the block size used when compressing binary payloads.
   * @default 1024
   */
  getBlockSize(): number;

  /**
   * Set the block size used when compressing binary payloads.
   */
  setBlockSize(blockSize: number): boolean;

  /**
   * Get the encoding used for the data arrays.
   */
  getFormat(): FormatTypes;

  /**
   * Set the encoding used for the data arrays.
   */
  setFormat(format: FormatTypes): boolean;

  /**
   * Get the string produced by the last `requestData` call. Undefined before
   * the first one, since `file` has no default.
   */
  getFile(): string | undefined;

  /**
   * Build the XML document for the given data object and return its root
   * element.
   *
   * @param dataObject The data object to serialize
   */
  create(dataObject: any): any;

  /**
   * Serialize the given data object to an XML string.
   *
   * @param object The data object to serialize
   */
  write(object: any): string;

  /**
   * Append the arrays of a `vtkDataSetAttributes` under the given element.
   *
   * @param parentEle The parent XML element
   * @param dataSetAttributesName Either `'PointData'` or `'CellData'`
   * @param {vtkDataSetAttributes} dataSetAttributes The attributes to append
   * @returns The created XML element
   */
  processDataSetAttributes(
    parentEle: any,
    dataSetAttributesName: string,
    dataSetAttributes: vtkDataSetAttributes
  ): any;

  /**
   * Append a single data array under the given element.
   *
   * @param parentEle The parent XML element
   * @param {vtkDataArray} scalars The array to append
   */
  processDataArray(parentEle: any, scalars: vtkDataArray): any;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkXMLWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLWriterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IXMLWriterInitialValues
): void;

/**
 * vtkXMLWriter is the base class of the VTK XML writers. It is not meant to be
 * instantiated directly: use vtkXMLImageDataWriter or vtkXMLPolyDataWriter.
 */
declare const vtkXMLWriter: {
  extend: typeof extend;
  /**
   * Deflate a block of bytes with zlib.
   */
  compressBlock(uncompressed: Uint8Array): Uint8Array;
  /**
   * Encode a data array's values per the given format.
   */
  processDataArray(
    dataArray: vtkDataArray,
    format: FormatTypes,
    blockSize: number,
    compressor?: string
  ): string;
  FormatTypes: typeof FormatTypes;
};
export default vtkXMLWriter;
