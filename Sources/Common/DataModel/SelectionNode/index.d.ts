import { vtkObject } from "../../../interfaces" ;
import { Bounds } from "../../../types";
import { SelectionContent, SelectionField } from "./Constants";
import vtkProp from "../../../Rendering/Core/Prop";

export interface ISelectionNodeInitialValues {
	contentType?: SelectionContent;
	fieldType?: SelectionField;
	properties?: ISelectionNodeProperties;
	selectionList?: number[];
}

export interface ISelectionNodeProperties {
	propID?: number;
	prop?: vtkProp;
	compositeID?: number;
	attributeID?: number;
	pixelCount?: number;
	displayPosition?: [number, number, number];
	worldPosition?: [number, number, number];
}

export interface vtkSelectionNode extends vtkObject {
	/**
	 * Get the bounds of the selection points.
	 */
	getBounds(): Bounds;

	/**
	 * Returns -1 if not initialized.
	 */
	getContentType(): SelectionContent | -1;

	/**
	 * This functions is called internally by VTK.js and is not intended for public use.
	 */
	setContentType(contentType: SelectionContent): void;

	/**
	 * Returns -1 if not initialized.
	 */
	getFieldType(): SelectionField | -1;

	/**
	 * This functions is called internally by VTK.js and is not intended for public use.
	 */
	setFieldType(fieldType: SelectionField): void;

	/**
	 * Get the selection properties.
	 */
	getProperties(): ISelectionNodeProperties;

	/**
	 * This functions is called internally by VTK.js and is not intended for public use.
	 */
	setProperties(properties: ISelectionNodeProperties);
	
	/**
	 * Get the list of the underlying selected attribute IDs.
	 */
	getSelectionList(): number[];

	/**
	 * This functions is called internally by VTK.js and is not intended for public use.
	 */
	setSelectionList(selectionAttributeIDs: ISelectionNodeProperties);
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSelectionNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISelectionNodeInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISelectionNodeInitialValues): void;

/**
 * Method used to create a new instance of vtkSelectionNode.
 * @param {ISelectionNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISelectionNodeInitialValues): vtkSelectionNode;

/**
 * vtkSelectionNode represents a 2D n-sided polygon.
 * 
 * The polygons cannot have any internal holes, and cannot self-intersect.
 * Define the polygon with n-points ordered in the counter-clockwise direction.
 * Do not repeat the last point.
 */
export declare const vtkSelectionNode: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	SelectionContent: typeof SelectionContent;
    SelectionField: typeof SelectionField;
};
export default vtkSelectionNode;
