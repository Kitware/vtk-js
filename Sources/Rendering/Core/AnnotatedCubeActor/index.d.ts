import vtkActor, { IActorInitialValues } from '../Actor';

export interface IStyle {
	text?: string;
	faceColor?: string;
	faceRotation?: number;
	fontFamily?: string;
	fontColor?: string;
	fontStyle?: string;
	fontSizeScale?: (res: number) => number;
	edgeThickness?: number;
	edgeColor?: string;
	resolution?: number;
}

export interface IFaceProperty extends IStyle {
	text?: string;
	faceRotation?: number;
}

/**
 *
 */
export interface IAnnotatedCubeActorInitialValues extends IActorInitialValues {
}

export interface vtkAnnotatedCubeActor extends vtkActor {
	/**
	 * Set the default style.
	 * @param {IStyle} style
	 */
	setDefaultStyle(style: IStyle): boolean;

	/**
	 * The +X face property.
	 * @param {IFaceProperty} prop +X face property
	 */
	setXPlusFaceProperty(prop: IFaceProperty): boolean;

	/**
	 * The -X face property.
	 * @param {IFaceProperty} prop The -X face property.
	 */
	setXMinusFaceProperty(prop: IFaceProperty): boolean;

	/**
	 * The +Y face property.
	 * @param {IFaceProperty} prop The +Y face property.
	 */
	setYPlusFaceProperty(prop: IFaceProperty): boolean;

	/**
	 * The -Y face property.
	 * @param {IFaceProperty} prop The -Y ace property.
	 */
	setYMinusFaceProperty(prop: IFaceProperty): boolean;

	/**
	 * The +Z face property.
	 * @param {IFaceProperty} prop The +Z face property.
	 */
	setZPlusFaceProperty(prop: IFaceProperty): boolean;

	/**
	 * The -Z face property.
	 * @param {IFaceProperty} prop The -Z face property.
	 */
	setZMinusFaceProperty(prop: IFaceProperty): boolean;
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
 * @param {IAnnotatedCubeActorInitialValues} [initialValues] for pre-setting some of its content
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
