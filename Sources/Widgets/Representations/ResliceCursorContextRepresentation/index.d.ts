import {vtkWidgetRepresentation, IWidgetRepresentationInitialValues} from "../WidgetRepresentation";

export interface IResliceCursorContextRepresentationInitialValues extends IWidgetRepresentationInitialValues {
	axis1Name?: string,
	axis2Name?: string,
	rotationEnabled?: boolean,
	rotationHandlePosition?: number,
	scaleInPixels?: boolean,
	viewType: any,
	coincidentTopologyParameters: object,
}

export interface vtkResliceCursorContextRepresentation extends vtkWidgetRepresentation {

	/**
	 * Returns the ratio applied on the smallest view side (width or height)
	 * used to compute the position of the rotation handles.
	 * 1 to place the handles on the edge of the smallest view side, 0.5 to
	 * place the handles half way between the center of the reslice cursor
	 * and the edge of the smallest view side.
	 * 0.5 by default
	 */
	getRotationHandlePosition(): number;

	/**
	 * Sets the ratio applied on the smallest view side (width or height) used to
	 * compute the position of the rotation handles
	 * @param {number} ratio a positive floating percent of the smallest view side
	 * @returns true if modified, false otherwise
	 * @see getRotationHandlePosition()
	 */
	 setRotationHandlePosition(ratio: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkResliceCursorContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IResliceCursorContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IResliceCursorContextRepresentationInitialValues): void;

/**
 * Method use to create a new instance of vtkResliceCursorContextRepresentation
 * @param {IResliceCursorContextRepresentationInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IResliceCursorContextRepresentationInitialValues): vtkResliceCursorContextRepresentation;

export declare const vtkResliceCursorContextRepresentation: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkResliceCursorContextRepresentation;
