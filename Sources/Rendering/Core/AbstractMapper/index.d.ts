import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import vtkPlane from "../../../Common/DataModel/Plane";
import { mat4 } from "gl-matrix";

/**
 * 
 */
export interface IAbstractMapperInitialValues {
	clippingPlanes?: vtkPlane[];
}

type vtkAbstractMapperBase = vtkObject & Omit<vtkAlgorithm,
	| 'getOutputData'
	| 'getOutputPort'> ;

export interface vtkAbstractMapper extends vtkAbstractMapperBase {

	/**
	 * Added plane needs to be a vtkPlane object.
	 * @param {vtkPlane} plane
	 */
	addClippingPlane(plane: vtkPlane): boolean;

	/**
	 * Get number of clipping planes.
	 * @return {Number} The number of clipping planes.
	 */
	getNumberOfClippingPlanes(): number;

	/**
	 * Get all clipping planes.
	 * @return {vtkPlane[]} An array of the clipping planes objects
	 */
	getClippingPlanes(): vtkPlane[];

	/**
	 * Remove all clipping planes.
	 */
	removeAllClippingPlanes(): void;

	/**
	 * Remove clipping plane.
	 * @param {vtkPlane} plane
	 */
	removeClippingPlane(plane: vtkPlane): boolean;

	/**
	 * Set clipping planes.
	 * @param {vtkPlane[]} planes
	 */
	setClippingPlanes(planes: vtkPlane[]): void;

	/**
	 * Get the ith clipping plane as a homogeneous plane equation.
	 * Use getNumberOfClippingPlanes() to get the number of planes.
	 * @param {mat4} propMatrix
	 * @param {Number} i
	 * @param {Number[]} hnormal
	 */
	getClippingPlaneInDataCoords(propMatrix : mat4, i : number, hnormal : number[]): void;

	/**
	 * 
	 */
	update(): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IAbstractMapperInitialValues): void;

/**
 * vtkAbstractMapper is an abstract class to specify interface between data and
 * graphics primitives or software rendering techniques. Subclasses of
 * vtkAbstractMapper can be used for rendering 2D data, geometry, or volumetric
 * data.
 */
export declare const vtkAbstractMapper: {
	extend: typeof extend,
};
export default vtkAbstractMapper;
