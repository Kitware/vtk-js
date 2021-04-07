import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';

/**
 * 
 */
interface IAnnotatedCubeActorInitialValues {
}

export interface vtkAnnotatedCubeActor extends vtkActor {
	/**
	 * Set the default style.
	 * @param style
	 * @returns 
	 */
	setDefaultStyle(style: any): boolean;

	/**
	 * The +X face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setXPlusFaceProperty(prop: object): boolean;

	/**
	 * The -X face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setXMinusFaceProperty(prop: object): boolean;

	/**
	 * The +Y face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setYPlusFaceProperty(prop: object): boolean;

	/**
	 * The -Y face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setYMinusFaceProperty(prop: object): boolean;

	/**
	 * The +Z face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setZPlusFaceProperty(prop: object): boolean;

	/**
	 * The -Z face property.
	 * @param {vtkProperty} prop face property
	 * @returns 
	 */
	setZMinusFaceProperty(prop: object): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAnnotatedCubeActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnnotatedCubeActorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IAnnotatedCubeActorInitialValues): void;

/**
 * Method use to create a new instance of vtkAnnotatedCubeActor
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IAnnotatedCubeActorInitialValues): vtkAnnotatedCubeActor;

/**
 * All propertyObjects may have any of the following keys:
 * * text: the face text (default “”)
 * * faceColor: the face color (default “white”)
 * * faceRotation: the face rotation, in degrees (default 0)
 * * fontFamily: the font family to use (default Arial)
 * * fontColor: the font color (default “black”)
 * * fontStyle: the CSS style for the text (default “normal”)
 * * fontSizeScale: A function that takes the face resolution and returns the
 * pixel size of the font (default (resolution) => resolution / 1.8)
 * * edgeThickness: the face edge/border thickness, which is a fraction of the
 * cube resolution (default 0.1)
 * * edgeColor: the color of each face’s edge/border (default “white”)
 * resolution: the pixel resolution of a face, i.e. pixel side length (default 200)
 * If a key is not specified, then the default value is used.
 */
export declare const vtkAnnotatedCubeActor: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkAnnotatedCubeActor;

