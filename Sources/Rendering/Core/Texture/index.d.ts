import { vtkAlgorithm } from "../../../interfaces";

export interface ITextureInitialValues {
	repeat?: boolean;
	interpolate?: boolean;
	edgeClamp?: boolean;
	imageLoaded?: boolean;
}

export interface vtkTexture extends vtkAlgorithm {

	/**
	 * 
	 */
	getRepeat(): boolean;

	/**
	 * 
	 */
	getEdgeClamp(): boolean;

	/**
	 * 
	 */
	getInterpolate(): boolean;

	/**
	 * 
	 */
	getImage(): any;

	/**
	 * 
	 */
	getImageLoaded(): boolean;

	/**
	 * 
	 * @param repeat 
	 * @default false
	 */
	setRepeat(repeat: boolean): boolean;

	/**
	 * 
	 * @param edgeClamp 
	 * @default false
	 */
	setEdgeClamp(edgeClamp: boolean): boolean;

	/**
	 * 
	 * @param interpolate 
	 * @default false
	 */
	setInterpolate(interpolate: boolean): boolean;


	/**
	 * 
	 * @param image 
	 * @default null
	 */
	setImage(image: any): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkTexture characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextureInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITextureInitialValues): void;

/**
 * Method use to create a new instance of vtkTexture.
 * @param {ITextureInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITextureInitialValues): vtkTexture;

/** 
 * vtkTexture is an image algorithm that handles loading and binding of texture maps.
 * It obtains its data from an input image data dataset type. 
 * Thus you can create visualization pipelines to read, process, and construct textures. 
 * Note that textures will only work if texture coordinates are also defined, and if the rendering system supports texture.
 */
export declare const vtkTexture: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkTexture;
