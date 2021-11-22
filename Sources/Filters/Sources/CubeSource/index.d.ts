import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Bounds, Vector3 } from "../../../types";

/**
 *
 */
export interface ICircleSourceInitialValues {
	xLength?: number;
	yLength?: number;
	zLength?: number;
	center?: Vector3;
	rotations?: Vector3;
	pointType?: string;
	generate3DTextureCoordinates?: boolean;
}

type vtkCubeSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkCubeSource extends vtkCubeSourceBase {

	/**
	 * Get the center of the cube.
	 * @default [0.0, 0.0, 0.0]
	 */
	getCenter(): Vector3;

	/**
	 * Get the center of the cube.
	 */
	getCenterByReference(): Vector3;

	/**
	 *
	 * @default false
	 */
	getGenerate3DTextureCoordinates(): boolean;

	/**
	 *
	 * @default [0.0, 0.0, 0.0]
	 */
	getRotations(): Vector3;

	/**
	 *
	 * @default [0.0, 0.0, 0.0]
	 */
	getRotationsByReference(): Vector3;

	/**
	 * Get the length of the cube in the x-direction.
	 * @default 1.0
	 */
	getXLength(): number;

	/**
	 * Get the length of the cube in the y-direction.
	 * @default 1.0
	 */
	getYLength(): number;

	/**
	 * Get the length of the cube in the z-direction.
	 * @default 1.0
	 */
	getZLength(): number;

	/**
	 * Expose methods
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Convenience methods allows creation of cube by specifying bounding box.
	 * @param {Number} xMin 
	 * @param {Number} xMax 
	 * @param {Number} yMin 
	 * @param {Number} yMax 
	 * @param {Number} zMin 
	 * @param {Number} zMax 
	 */
	setBounds(xMin: number, xMax: number, yMin: number, yMax: number, zMin: number, zMax: number): boolean;

	/**
	 * Convenience methods allows creation of cube by specifying bounding box.
	 * @param {Bounds} bounds The bounds for the cube.
	 */
	setBounds(bounds: Bounds): boolean;

	/**
	 * Set the center of the cube.
	 * @param x
	 * @param y
	 * @param z
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the cube.
	 * @param center
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 *
	 * @param generate3DTextureCoordinates
	 */
	setGenerate3DTextureCoordinates(generate3DTextureCoordinates: boolean): boolean;

	/**
	 * Float array of size 3 representing the angles, in degrees, of rotation for the cube.
	 * @param xAngle
	 * @param yAngle
	 * @param zAngle
	 */
	setRotations(xAngle: number, yAngle: number, zAngle: number): boolean;

	/**
	 *
	 * @param {Vector3} rotations
	 */
	setRotationsFrom(rotations: Vector3): boolean;

	/**
	 * Set the length of the cube in the x-direction.
	 * @param xLength
	 */
	setXLength(xLength: number): boolean;

	/**
	 * Set the length of the cube in the y-direction.
	 * @param yLength
	 */
	setYLength(yLength: number): boolean;

	/**
	 * Set the length of the cube in the z-direction.
	 * @param zLength
	 */
	setZLength(zLength: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCubeSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICircleSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICircleSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkCubeSource.
 * @param {ICircleSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICircleSourceInitialValues): vtkCubeSource;

/**
 * vtkCubeSource creates a cube centered at origin. The cube is represented with four-sided polygons.
 * It is possible to specify the length, width, and height of the cube independently.
 * 
 * @example
 * ```js
 * import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
 * 
 * const cubeSource = vtkCubeSource.newInstance({ xLength: 5, yLength: 5, zLength: 5 });
 * const polydata = cubeSource.getOutputData();
 * ```
 */
export declare const vtkCubeSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCubeSource;
