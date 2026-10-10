import { IXMLWriterInitialValues, vtkXMLWriter } from '../XMLWriter';

/**
 *
 */
export interface IXMLPolyDataWriterInitialValues extends IXMLWriterInitialValues {}

export interface vtkXMLPolyDataWriter extends vtkXMLWriter {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkXMLPolyDataWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLPolyDataWriterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IXMLPolyDataWriterInitialValues
): void;

/**
 * Method used to create a new instance of vtkXMLPolyDataWriter
 * @param {IXMLPolyDataWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IXMLPolyDataWriterInitialValues
): vtkXMLPolyDataWriter;

/**
 * vtkXMLPolyDataWriter writes a vtkPolyData out as a VTK XML `.vtp` document.
 */
declare const vtkXMLPolyDataWriter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkXMLPolyDataWriter;
