import vtkPolyData from '../../../Common/DataModel/PolyData';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkWebGPUCellArrayMapper from '../CellArrayMapper';

export interface IWebGPUPolyDataMapperInitialValues extends IViewNodeInitialValues {
  primitives?: vtkWebGPUCellArrayMapper[];
}

export interface vtkWebGPUPolyDataMapper extends vtkViewNode {
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
   * of the polydata, plus the edge mappers when the actor's property has edge
   * visibility.
   * @param {vtkPolyData} poly
   */
  updateCellArrayMappers(poly: vtkPolyData): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUPolyDataMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUPolyDataMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUPolyDataMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUPolyDataMapper.
 * @param {IWebGPUPolyDataMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUPolyDataMapperInitialValues
): vtkWebGPUPolyDataMapper;

/**
 * The WebGPU view node of vtkMapper. It does not draw anything itself, it
 * delegates each cell array of the polydata to a vtkWebGPUCellArrayMapper.
 */
export declare const vtkWebGPUPolyDataMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUPolyDataMapper;
