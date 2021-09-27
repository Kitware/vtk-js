import { vtkObject } from "../../../interfaces" ;
import vtkDataSetAttributes from '../DataSetAttributes';

export enum FieldDataTypes {
	UNIFORM,
	DATA_OBJECT_FIELD,
	COORDINATE,
	POINT_DATA,
	POINT,
	POINT_FIELD_DATA,
	CELL,
	CELL_FIELD_DATA,
	VERTEX,
	VERTEX_FIELD_DATA,
	EDGE,
	EDGE_FIELD_DATA,
	ROW,
	ROW_DATA,
}

export enum FieldAssociations {
	FIELD_ASSOCIATION_POINTS,
	FIELD_ASSOCIATION_CELLS,
	FIELD_ASSOCIATION_NONE,
	FIELD_ASSOCIATION_POINTS_THEN_CELLS,
	FIELD_ASSOCIATION_VERTICES,
	FIELD_ASSOCIATION_EDGES,
	FIELD_ASSOCIATION_ROWS,
	NUMBER_OF_ASSOCIATIONS,
}

/**
 *
 */
export interface IDataSetInitialValues {}

export interface vtkDataSet extends vtkObject {

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
export function extend(publicAPI: object, model: object, initialValues? : IDataSetInitialValues): void;

/**
 * Method used to create a new instance of vtkDataSet.
 * @param {IDataSetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues? : IDataSetInitialValues): vtkDataSet;

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
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkDataSet;
