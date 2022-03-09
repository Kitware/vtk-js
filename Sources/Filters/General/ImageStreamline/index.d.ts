import vtkImageData from "../../../Common/DataModel/ImageData";
import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Bounds, Extent, Vector2, Vector3 } from "../../../types";

/**
 * 
 */
export interface IImageStreamlineInitialValues {
	integrationStep?: number,
	maximumNumberOfSteps?: number,
}

type vtkImageStreamlineBase = vtkObject & vtkAlgorithm;

export interface vtkImageStreamline extends vtkImageStreamlineBase {

	/**
	 * 
	 * @param velArray 
	 * @param image 
	 * @param {Number} delT 
	 * @param {Number[]} xyz 
	 */
	computeNextStep(velArray: any, image: any, delT: number, xyz: number[]): boolean;

	/**
	 * 
	 * @param {Vector3} x 
	 * @param {Vector3} ijk 
	 * @param {Vector3} pcoords 
	 * @param {Extent} extent 
	 * @param {Vector3} spacing 
	 * @param {Vector3} origin 
	 * @param {Bounds} bounds 
	 */
	computeStructuredCoordinates(x: Vector3, ijk: Vector3, pcoords: Vector3, extent: Extent, spacing: Vector3, origin: Vector3, bounds: Bounds): boolean;

	/**
	 * Get the step length (delT) used during integration.
	 */
	getIntegrationStep(): number;

	/**
	 * Get the number of steps to be used in the integration. 
	 */
	getMaximumNumberOfSteps(): number;

	/**
	 * 
	 * @param {Vector3} ijk 
	 * @param {Vector2} dims 
	 * @param {Number[]} ids 
	 */
	getVoxelIndices(ijk: Vector3, dims: Vector2, ids: number[]): void;

	/**
	 * 
	 * @param {Vector3} pcoords 
	 * @param {Number[]} sf 
	 */
	interpolationFunctions(pcoords: Vector3, sf: number[]): void;
	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the step length (delT) used during integration.
	 * @param {Number} integrationStep 
	 */
	setIntegrationStep(integrationStep: number): boolean;

	/**
	 * Set the number of steps to be used in the integration. 
	 * Integration can terminal earlier if the streamline leaves the domain.
	 * @param {Number} maximumNumberOfSteps 
	 */
	setMaximumNumberOfSteps(maximumNumberOfSteps: number): boolean;

	/**
	 * 
	 * @param velArray 
	 * @param {vtkImageData} image 
	 * @param {Number[]} seed 
	 * @param {Number} offset 
	 */
	streamIntegrate(velArray: any, image: vtkImageData, seed: number[], offset: number): any[];

	/**
	 * 
	 * @param {Number[]} xyz 
	 * @param velArray 
	 * @param {vtkImageData} image 
	 * @param velAtArg 
	 */
	vectorAt(xyz: number[], velArray: any, image: vtkImageData, velAtArg: any): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageStreamline characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageStreamlineInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageStreamlineInitialValues): void;

/**
 * Method used to create a new instance of vtkImageStreamline
 * @param {IImageStreamlineInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageStreamlineInitialValues): vtkImageStreamline;


/**
 * vtkImageStreamline - integrate streamlines in a vtkImageData
 * 
 * vtkImageStreamline is a filter that generates streamlines from a vtkImageData
 * input over which a vector field is defined. This filter will look for vectors
 * (i.e. getVectors()) in the input. It will then integrate these vectors, using
 * Runge-Kutta 2, from a starting set of seeds defined by the points of the 2nd
 * input until a specified maximum number of steps is reached or until the
 * streamline leaves the domain.
 *
 * The output will be a vtkPolyData which contains a polyline for each
 * streamline. Currently, this filter does not interpolate any input fields to
 * the points of the streamline.
 */
export declare const vtkImageStreamline: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageStreamline;
