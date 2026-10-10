import vtkPolyData from '../../../Common/DataModel/PolyData';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkWebGPUCellArrayMapper from '../CellArrayMapper';

export interface IWebGPUPolyDataMapper2DInitialValues extends IViewNodeInitialValues {
  primitives?: vtkWebGPUCellArrayMapper[];
}

export interface vtkWebGPUPolyDataMapper2D extends vtkViewNode {
  /**
   * Create the cell array mapper drawing one primitive of the polydata.
   */
  createCellArrayMapper(): vtkWebGPUCellArrayMapper;

  /**
   * Update the renderable and rebuild the cell array mappers of its polydata.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Create, configure and adopt one cell array mapper per non empty cell array
   * of the polydata, up to the triangles, each drawing in 2D.
   * @param {vtkPolyData} poly
   */
  updateCellArrayMappers(poly: vtkPolyData): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUPolyDataMapper2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUPolyDataMapper2DInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUPolyDataMapper2DInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUPolyDataMapper2D.
 * @param {IWebGPUPolyDataMapper2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUPolyDataMapper2DInitialValues
): vtkWebGPUPolyDataMapper2D;

/**
 * The WebGPU view node of vtkMapper2D. It delegates each cell array of the
 * polydata to a vtkWebGPUCellArrayMapper drawing in 2D.
 */
export declare const vtkWebGPUPolyDataMapper2D: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUPolyDataMapper2D;
