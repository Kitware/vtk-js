import vtkDataSetAttributes from '../DataSetAttributes';
import { vtkObject } from '../../../interfaces';
import { Bounds, Vector3 } from '../../../types';
import { FieldAssociations, FieldDataTypes } from './Constants';

/**
 *
 */
export interface IDataSetInitialValues {}

export interface vtkDataSet extends vtkObject {
  /**
   * Initialize the field, cell and point data.
   * @see vtkDataSetAttributes::initialize()
   * @see vtkFieldData::initialize()
   */
  initialize(): vtkDataSet;

  /**
   * Compute the (X, Y, Z) bounds of the data.
   */
  computeBounds(): void;

  /**
   * Returns the squared length of the diagonal of the bounding box.
   */
  getLength2(): number;

  /**
   * Returns the length of the diagonal of the bounding box.
   */
  getLength(): number;

  /**
   * Returns the center of the bounding box as [x, y, z].
   */
  getCenter(): Vector3;

  /**
   * Get the bounding box of a cell with the given cellId.
   * @param {Number} cellId - The id of the cell
   */
  getCellBounds(cellId: number): Bounds;

  /**
   * Get the bounds for this dataset as [xmin, xmax, ymin, ymax, zmin, zmax].
   * @return {Bounds} The bounds for the dataset.
   */
  getBounds(): Bounds;

  /**
   * Get the bounds for this dataset by reference.
   */
  getBoundsByReference(): Bounds;

  /**
   * Get dataset's cell data
   */
  getCellData(): vtkDataSetAttributes;

  /**
   * Get dataset's field data
   */
  getFieldData(): vtkDataSetAttributes;

  /**
   * Get dataset's point data.
   */
  getPointData(): vtkDataSetAttributes;

  /**
   * Set dataset's cell data
   * @param {vtkDataSetAttributes} cellData
   */
  setCellData(cellData: vtkDataSetAttributes): boolean;

  /**
   * Set dataset's field data
   * @param {vtkDataSetAttributes} fieldData
   */
  setFieldData(fieldData: vtkDataSetAttributes): boolean;

  /**
   * Set dataset's point data.
   * @param {vtkDataSetAttributes} pointData
   */
  setPointData(pointData: vtkDataSetAttributes): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkDataSet characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IDataSetInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IDataSetInitialValues
): void;

/**
 * Method used to create a new instance of vtkDataSet.
 * @param {IDataSetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IDataSetInitialValues): vtkDataSet;

/**
 * vtkDataSet is an abstract class that specifies an interface for dataset
 * objects. vtkDataSet also provides methods to provide information about
 * the data, such as center, bounding box, and representative length.
 *
 * In vtk a dataset consists of a structure (geometry and topology) and
 * attribute data. The structure is defined implicitly or explicitly as
 * a collection of cells. The geometry of the structure is contained in
 * point coordinates plus the cell interpolation functions. The topology
 * of the dataset structure is defined by cell types and how the cells
 * share their defining points.
 *
 * Attribute data in vtk is either point data (data at points) or cell data
 * (data at cells). Typically filters operate on point data, but some may
 * operate on cell data, both cell and point data, either one, or none.
 */
export declare const vtkDataSet: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  FieldAssociations: typeof FieldAssociations;
  FieldDataTypes: typeof FieldDataTypes;
};
export default vtkDataSet;
