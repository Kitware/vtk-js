import vtkProp from "../../../Rendering/Core/Prop";

export interface IWidgetRepresentationInitialValues {
    labels?: Array<any>,
    coincidentTopologyParameters?: object,
    displayScaleParams?: object,
    scaleInPixels?: boolean
}

export interface vtkWidgetRepresentation extends vtkProp {
    getLabels(): Array<any>;
    setLabels(labels: Array<any>): void;

    /**
     * Gets the coincident topology parameters applied on the actor mappers
     */
    getCoincidentTopologyParameters(): object;
    /**
     * Sets the coincident topology parameters applied on the actor mappers
     */
    setCoincidentTopologyParameters(parameters: object): boolean;

    /**
     * Sets the current view and camera scale parameters.
     * Called by the WidgetManager.
     * @see setScaleInPixels()
     */
    setDisplayScaleParams(params: object): boolean;

    /**
     * Gets wether actors should have a fix size in display coordinates.
     * @see setScaleInPixels()
     */
    getScaleInPixels(): boolean;

    /**
     * Sets wether actors should have a fix size in display coordinates.
     * @see getScaleInPixels()
     */
    setScaleInPixels(scale: boolean): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkWidgetRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWidgetRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IWidgetRepresentationInitialValues): void;

/**
 * Method use to create a new instance of vtkWidgetRepresentation
 * @param {IWidgetRepresentationInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IWidgetRepresentationInitialValues): vtkWidgetRepresentation;

export declare const vtkWidgetRepresentation: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkWidgetRepresentation;
