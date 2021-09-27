import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ICylinderSourceInitialValues {
	height?: number;
	initAngle?: number;
	otherRadius?: number;
	radius?: number;
	resolution?: number;
	center?: number[];
	direction?: number[];
	capping?: boolean;
	pointType?: string;
}

type vtkCylinderSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkCylinderSource extends vtkCylinderSourceBase {

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
	 * Get the initial angle along direction
	 * @default 0
	 * @see getDirection
	 */
	getInitAngle(): number;

	/**
	 * Get the radius on Z axis. If not null and different from radius,
	 * the cylinder base becomes an ellipse instead of a circle.
	 * @default null
	 * @see getRadius()
	 */
	getOtherRadius(): number;

	/**
	 * Get the base radius of the cylinder.
	 * @default 0.5
	 * @see getOtherRadius()
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
	 * @param {Boolean} capping The capping value. 
	 */
	setCapping(capping: boolean): boolean;

	/**
	 * Set the center of the cylinder.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the cylinder.
	 * @param {Number[]} center The center point's coordinates.
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: number[]): boolean;

	/**
	 * Set the direction for the cylinder.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 * Set the direction for the cylinder.
	 * @param {Number[]} direction The direction coordinates.
	 */
	setDirection(direction: number[]): boolean;

	/**
	 * Set the direction for the cylinder.
	 * @param {Number[]} direction The direction coordinates.
	 */
	setDirectionFrom(direction: number[]): boolean;

	/**
	 * Set the height of the cylinder.
	 * @param {Number} height The height along the cylinder in its specified direction.
	 */
	setHeight(height: number): boolean;

	/**
	 * Set the initial angle along direction.
	 * @param {Number} initAngle The initial angle in radian.
	 */
	setInitAngle(radianAngle: number): boolean;

	/**
	 * Set the base Z radius of the cylinder.
	 * @param {Number} radius The radius of the cylinder in Z.
	 * @see setRadius()
	 */
	setOtherRadius(radius: number): boolean;

	/**
	 * Set the base radius of the cylinder.
	 * @param {Number} radius The radius of the cylinder.
	 * @see setOtherRadius()
	 */
	setRadius(radius: number): boolean;

	/**
	 * Set the number of facets used to represent the cylinder.
	 * @param {Number} resolution The number of facets used to represent the cylinder.
	 */
	setResolution(resolution: number): boolean;

}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCylinderSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICylinderSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICylinderSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkCylinderSource.
 * @param {ICylinderSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICylinderSourceInitialValues): vtkCylinderSource;

/**
 * vtkCylinderSource creates a polygonal cylinder centered at Center;
 * The axis of the cylinder is aligned along the global y-axis.
 * The height and radius of the cylinder can be specified, as well as the number of sides.
 * It is also possible to control whether the cylinder is open-ended or capped.
 * If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkCylinderSource.
 * 
 * @example
 * ```js
 * import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
 * 
 * const cylinder = vtkCylinderSource.newInstance({ height: 2, radius: 1, resolution: 80 });
 * const polydata = cylinder.getOutputData();
 * ```
 */
export declare const vtkCylinderSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCylinderSource;
