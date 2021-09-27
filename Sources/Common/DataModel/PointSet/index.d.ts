import { Bounds } from '../../../types';
import vtkPoints from '../../Core/Points';
import vtkDataSet, { IDataSetInitialValues } from '../DataSet';

/**
 *
 */
export interface IPointSetInitialValues extends IDataSetInitialValues {
}

export interface vtkPointSet extends vtkDataSet {

	/**
	 * Compute the (X, Y, Z) bounds of the data.
	 */
	computeBounds(): void;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 *
	 */
	getNumberOfPoints(): number;

	/**
	 *
	 */
	getPoints(): vtkPoints;

	/**
	 *
	 */
	setPoints(points: vtkPoints): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPointSet characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPointSetInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPointSetInitialValues): void;

/**
 * Method used to create a new instance of vtkPointSet.
 * @param {IPointSetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPointSetInitialValues): vtkPointSet;

/**
 * vtkPointSet is an abstract class that specifies the interface for
 * datasets that explicitly use "point" arrays to represent geometry.
 *
 * For example, vtkPolyData and vtkUnstructuredGrid require point arrays
 * to specify point position, while vtkStructuredPoints generates point
 * positions implicitly.
 */
export declare const vtkPointSet: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPointSet;
