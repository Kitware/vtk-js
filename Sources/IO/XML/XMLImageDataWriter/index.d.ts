import { IXMLWriterInitialValues, vtkXMLWriter } from '../XMLWriter';

/**
 *
 */
export interface IXMLImageDataWriterInitialValues extends IXMLWriterInitialValues {}

export interface vtkXMLImageDataWriter extends vtkXMLWriter {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkXMLImageDataWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLImageDataWriterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IXMLImageDataWriterInitialValues
): void;

/**
 * Method used to create a new instance of vtkXMLImageDataWriter
 * @param {IXMLImageDataWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IXMLImageDataWriterInitialValues
): vtkXMLImageDataWriter;

/**
 * vtkXMLImageDataWriter writes a vtkImageData out as a VTK XML `.vti` document.
 */
declare const vtkXMLImageDataWriter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkXMLImageDataWriter;
