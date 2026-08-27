import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 *
 */
export interface IZipMultiDataSetWriterInitialValues {
  compressionLevel?: number;
  blob?: Blob;
}

type vtkZipMultiDataSetWriterBase = vtkObject &
  Omit<vtkAlgorithm, 'getOutputData' | 'getOutputPort'>;

export interface vtkZipMultiDataSetWriter extends vtkZipMultiDataSetWriterBase {
  /**
   * Get the zip produced by the last call to `write()`.
   */
  getBlob(): Nullable<Blob>;

  /**
   *
   */
  getCompressionLevel(): number;

  /**
   *
   * @param {Number} compressionLevel
   */
  setCompressionLevel(compressionLevel: number): boolean;

  /**
   * Serialize every input dataset then zip the result into a Blob reachable
   * through `getBlob()`.
   */
  write(): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkZipMultiDataSetWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IZipMultiDataSetWriterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IZipMultiDataSetWriterInitialValues
): void;

/**
 * Method used to create a new instance of vtkZipMultiDataSetWriter
 * @param {IZipMultiDataSetWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IZipMultiDataSetWriterInitialValues
): vtkZipMultiDataSetWriter;

/**
 * vtkZipMultiDataSetWriter writes all of its inputs into a single zip archive
 * holding a `datasets.json` metadata file alongside one binary file per data
 * array. The archive is readable by vtkZipMultiDataSetReader.
 */
export declare const vtkZipMultiDataSetWriter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkZipMultiDataSetWriter;
