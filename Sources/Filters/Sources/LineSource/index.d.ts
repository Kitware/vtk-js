import {
	VtkAlgorithm,
	VtkObject
} from 'vtk.js/Sources/macro';

/**
 * 
 */
interface ILineSourceInitialValues {

	/**
	 * 
	 */
	resolution?: number;
		
	 /**
	  * 
	  */
	point1?: number[];
		 
	 /**
	  * 
	  */
	point2?: number[];
		 
	 /**
	  * 
	  */
	pointType?: string;
}

type vtkAlgorithm = VtkObject & Pick<VtkAlgorithm,
	'getNumberOfInputPorts' |
	'getNumberOfOutputPorts' |
	'getInputArrayToProcess' |
	'getOutputData' |
	'getOutputPort' |
	'setInputArrayToProcess' |
	'shouldUpdate' |
	'update'> ;

export interface vtkLineSource extends vtkAlgorithm {

	/**
	 * Get the orientation vector of the cylinder.
	 * @default [-1, 0, 0]
	 */
	getPoint1(): number[];

	/**
	 * Get the orientation vector of the cylinder.
	 */
	getPoint1ByReference(): number[];

	/**
	 * Get the orientation vector of the cylinder.
	 * @default [1, 0, 0]
	 */
	getPoint2(): number[];

	/**
	 * Get the orientation vector of the cylinder.
	 */
	getPoint2ByReference(): number[];

	/**
	 * Get the number of facets used to represent the cylinder.
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
	setPoint1(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param direction 
	 */
	setPoint1From(direction: number[]): boolean;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param direction 
	 */
	setPoint2From(direction: number[]): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param resolution 
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLineSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkLineSource.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineSourceInitialValues): vtkLineSource;

/**
 * vtkLineSource creates a polygonal cylinder centered at Center; 
 * The axis of the cylinder is aligned along the global y-axis. 
 * The height and radius of the cylinder can be specified, as well as the number of sides. 
 * It is also possible to control whether the cylinder is open-ended or capped.
 * If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkLineSource.
 */
export declare const vtkLineSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkLineSource;