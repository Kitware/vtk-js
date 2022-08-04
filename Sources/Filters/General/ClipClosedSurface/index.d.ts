import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";
import vtkPlane from "../../../Common/DataModel/Plane";

/**
 *
 */
export enum ScalarMode {
	NONE,
	COLORS,
	LABELS,
}

/**
 *
 */
export interface IClipClosedSurfaceInitialValues {
	clippingPlanes?: vtkPlane[];
	tolerance?: number;
	passPointData?: boolean;
	triangulatePolys?: boolean;
	scalarMode?: ScalarMode;
	generateOutline?: boolean;
	generateFaces?: boolean;
	activePlaneId?: number;
	baseColor?: Vector3;
	clipColor?: Vector3;
	activePlaneColor?: Vector3;
	triangulationErrorDisplay?: boolean;
}

type vtkClipClosedSurfaceBase = vtkObject & vtkAlgorithm;

export interface vtkClipClosedSurface extends vtkClipClosedSurfaceBase {
	/**
	 *
	 * @param {any} inData
	 * @param {any} outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set scalarMode to NONE.
	 */
	setScalarModeToNone(): void;

	/**
	 * Set scalarMode to COLOR.
	 */
	setScalarModeToColor(): void;

	/**
	 * Set scalarMode to LABEL.
	 */
	setScalarModeToLabel(): void;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkClipClosedSurface characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(
	publicAPI: object,
	model: object,
	initialValues?: IClipClosedSurfaceInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkClipClosedSurface
 * @param {IClipClosedSurfaceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
	initialValues?: IClipClosedSurfaceInitialValues
): vtkClipClosedSurface;

/**
 * vtkClipClosedSurface
 */
export declare const vtkClipClosedSurface: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	// constants
	ScalarMode: typeof ScalarMode;
};

export default vtkClipClosedSurface;
