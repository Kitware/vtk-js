import {
	VtkAlgorithm,
	VtkObject
} from 'vtk.js/Sources/macro';

/**
 *
 */
interface ICylinderSourceInitialValues {
	height?: number;
	radius?: number;
	resolution?: number;
	center?: number[];
	direction?: number[];
	capping?: boolean;
	pointType?: string;
}

type vtkAlgorithm = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' |
	'addInputConnection' |
	'addInputData' > ;

export interface vtkCylinderSource extends vtkAlgorithm {

		/**
	 * Get the cap the base of the cylinder with a polygon.
	 * @default true
	 */
	getCapping(): boolean;

	/**
	 * Get the center of the cylinder.
	 * @default [0, 0, 0]
	 */
	getCenter(): number[];

	/**
	 * Get the center of the cylinder.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the orientation vector of the cylinder.
	 * @default [1.0, 0.0, 0.0]
	 */
	getDirection(): number[];

	/**
	 * Get the orientation vector of the cylinder.
	 */
	getDirectionByReference(): number[];

	/**
	 * Get the height of the cylinder.
	 * @default 1.0
	 */
	getHeight(): number;

	/**
	 * Get the base radius of the cylinder.
	 * @default 0.5
	 */
	getRadius(): number;

	/**
	 * Get the number of facets used to represent the cylinder.
	 * @default 6
	 */
	getResolution(): number;

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Turn on/off whether to cap the base of the cone with a polygon.
	 * @param capping
	 */
	setCapping(capping: boolean): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * Warning: this is not the center of the base of the cone!
	 * @param x
	 * @param y
	 * @param z
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * Warning: this is not the center of the base of the cone!
	 * @param center
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: number[]): boolean;

	/**
	 *
	 * @param x
	 * @param y
	 * @param z
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 *
	 * @param direction
	 */
	setDirectionFrom(direction: number[]): boolean;

	/**
	 * Set the height of the cone.
	 * This is the height along the cone in its specified direction.
	 * @param height
	 */
	setHeight(height: number): boolean;

	/**
	 * Set the base radius of the cone.
	 * @param {number} radius
	 */
	setRadius(radius: number): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param resolution
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCylinderSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICylinderSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkCylinderSource.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICylinderSourceInitialValues): vtkCylinderSource;

/**
 * vtkCylinderSource creates a polygonal cylinder centered at Center;
 * The axis of the cylinder is aligned along the global y-axis.
 * The height and radius of the cylinder can be specified, as well as the number of sides.
 * It is also possible to control whether the cylinder is open-ended or capped.
 * If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkCylinderSource.
 */
export declare const vtkCylinderSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCylinderSource;