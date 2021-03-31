import {
	VtkAlgorithm,
	VtkObject
} from 'vtk.js/Sources/macro';

/**
 * 
 */
interface ICircleSourceInitialValues {

	/**
	 * 
	 */
	radius?: number;
		
	/**
	 * 
	 */
	resolution?: number;
		
	/**
	 * 
	 */
	center?: number[];
		
	/**
	 * 
	 */
	pointType?: string;
		
	/**
	 * 
	 */
	lines?: boolean;
		
	/**
	 * 
	 */
	face?: boolean;
}

type vtkAlgorithm = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' | 
	'addInputConnection' | 
	'addInputData' > ;

export interface vtkCircleSource extends vtkAlgorithm {

	/**
	 * Get the center of the cone.
	 * @default [0, 0, 0]
	 */
	getCenter(): number[];

	/**
	 * Get the center of the cone.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the orientation vector of the cone.
	 * @default [1.0, 0.0, 0.0]
	 */
	getDirection(): number[];

	/**
	 * Get the orientation vector of the cone.
	 */
	getDirectionByReference(): number[];

	/**
	 * 
	 * @default true
	 */
	getFace(): boolean;

	/**
	 * 
	 * @default false
	 */
	getLines(): boolean;

	/**
	 * Get the radius of the cylinder base. 
	 * @default 1.0
	 */
	getRadius(): number;

	/**
	 * Get the number of facets used to define cylinder.
	 * @default 6
	 */
	getResolution(): number;

	/**
	 * Expose methods
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

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
	 * Set the center of the circle.
	 * @param x 
	 * @param y 
	 * @param z 
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the circle.
	 * @param center 
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: number[]): boolean;

	/**
	 * 
	 * @param face
	 */
	setFace(face: boolean): boolean;

	/**
	 * 
	 * @param lines
	 */
	 setLines(lines: boolean): boolean;

	/** 
	 * Set the radius of the circle.
	 * @param radius 
	 */
	setRadius(radius: number): boolean;

	/** 
	 * Set the resolution of the circle.
	 * @param resolution 
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCircleSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICircleSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkCircleSource.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICircleSourceInitialValues): vtkCircleSource;

/**
 * 
 */
export declare const vtkCircleSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCircleSource;
