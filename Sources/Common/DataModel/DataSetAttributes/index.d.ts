import { vtkObject } from "../../../interfaces" ;
import { IFieldDataInitialValues, vtkFieldData } from './FieldData';
import vtkDataArray from '../../Core/DataArray';

export enum AttributeTypes {
	SCALARS,
	VECTORS,
	NORMALS,
	TCOORDS,
	TENSORS,
	GLOBALIDS,
	PEDIGREEIDS,
	EDGEFLAG,
	NUM_ATTRIBUTES,
}

export enum AttributeLimitTypes {
	MAX,
	EXACT,
	NOLIMIT,
}

export enum CellGhostTypes {
	/**
	 * The cell is present on multiple processors
	 */
	DUPLICATECELL,
	/**
	 * The cell has more neighbors than in a regular mesh
	 */
	HIGHCONNECTIVITYCELL,
	/**
	 * The cell has less neighbors than in a regular mesh
	 */
	LOWCONNECTIVITYCELL,
	/**
	 * Tther cells are present that refines it.
	 */
	REFINEDCELL,
	/**
	 * The cell is on the exterior of the data set
	 */
	EXTERIORCELL,
	/**
	 * The cell is needed to maintain connectivity, but the data values should be ignored.
	 */
	HIDDENCELL,
}

export enum PointGhostTypes {
	/**
	 * The cell is present on multiple processors
	 */
	DUPLICATEPOINT,
	/**
	 * The point is needed to maintain connectivity, but the data values should be ignored.
	 */
	HIDDENPOINT
}

export enum AttributeCopyOperations {
	COPYTUPLE,
	INTERPOLATE,
	PASSDATA,
	/**
	 * All of the above
	 */
	ALLCOPY,
}

export const ghostArrayName: string;

export enum DesiredOutputPrecision {
	/**
	 * Use the point type that does not truncate any data
	 */
	DEFAULT,
	/**
	 * Use Float32Array
	 */
	SINGLE,
	/**
	 * Use Float64Array
	 */
	DOUBLE,
}

/**
 *
 */
export interface IDataSetAttributesInitialValues extends IFieldDataInitialValues {
	activeScalars?: number;
	activeVectors?: number;
	activeTensors?: number;
	activeNormals?: number;
	activeTCoords?: number;
	activeGlobalIds?: number;
	activePedigreeIds?: number;
}

export interface vtkDataSetAttributes extends vtkFieldData {

	/**
	 * @todo No yet Implemented
	 * @param x
	 */
	checkNumberOfComponents(x: any): boolean;

	/**
	 *
	 * @param {string} attType
	 */
	getActiveAttribute(attType: string): any;

	/**
	 *
	 */
	getActiveScalars(): number;

	/**
	 *
	 */
	getActiveVectors(): number;

	/**
	 *
	 */
	getActiveTensors(): number;

	/**
	 *
	 */
	getActiveNormals(): number;

	/**
	 *
	 */
	getActiveTCoords(): number;

	/**
	 *
	 */
	getActiveGlobalIds(): number;

	/**
	 *
	 */
	getActivePedigreeIds(): number;

	/**
	 * Get the scalar data.
	 */
	getScalars(): vtkDataArray;

	/**
	 * Get the vectors data.
	 */
	getVectors(): vtkDataArray;

	/**
	 * Get the normal data.
	 */
	getNormals(): vtkDataArray;

	/**
	 * Get the texture coordinate data.
	 */
	getTCoords(): vtkDataArray;

	/**
	 * Get the tensors data.
	 */
	getTensors(): vtkDataArray;

	/**
	 * Get the global id data.
	 */
	getGlobalIds(): vtkDataArray;

	/**
	 * Get the pedigree id data.
	 */
	getPedigreeIds(): vtkDataArray;

	/**
	 *
	 * @param arr
	 * @param uncleanAttType
	 */
	setAttribute(arr: any, uncleanAttType: string): number;

	/**
	 *
	 * @param {string} arrayName
	 * @param attType
	 */
	setActiveAttributeByName(arrayName: string, attType: any): number;

	/**
	 *
	 * @param {Number} arrayIdx
	 * @param uncleanAttType
	 */
	setActiveAttributeByIndex(arrayIdx: number, uncleanAttType: string): number;

	/**
	 * Override to allow proper handling of active attributes
	 */
	removeAllArrays(): void;

	/**
	 * Override to allow proper handling of active attributes
	 * @param {string} arrayName The name of the array.
	 */
	removeArray(arrayName: string): void;

	/**
	 * Override to allow proper handling of active attributes
	 * @param {Number} arrayIdx The index of the array.
	 */
	removeArrayByIndex(arrayIdx: number): void;

	/**
	 *
	 */
	initializeAttributeCopyFlags(): void;

	/**
	 *
	 * @param {Number} activeScalars 
	 */
	setActiveScalars(activeScalars: number): boolean;

	/**
	 *
	 * @param {Number} activeVectors 
	 */
	setActiveVectors(activeVectors: number): boolean;

	/**
	 *
	 * @param {Number} activeTensors 
	 */
	setActiveTensors(activeTensors: number): boolean;

	/**
	 *
	 * @param {Number} activeNormals 
	 */
	setActiveNormals(activeNormals: number): boolean;

	/**
	 *
	 * @param {Number} activeTCoords 
	 */
	setActiveTCoords(activeTCoords: number): boolean;

	/**
	 *
	 * @param {Number} activeGlobalIds 
	 */
	setActiveGlobalIds(activeGlobalIds: number): boolean;

	/**
	 *
	 * @param {Number} activePedigreeIds 
	 */
	setActivePedigreeIds(activePedigreeIds: number): boolean;

	/**
	 * Try to copy the state of the other to ourselves by just using references.
	 *
	 * @param other instance to copy the reference from
	 * @param debug (default: false) if true feedback will be provided when mismatch happen
	 * @override
	 */
	shallowCopy(other: vtkObject, debug?: boolean): void;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveScalars(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveVectors(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveNormals(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveTCoords(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveTensors(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActiveGlobalIds(arrayName: string): boolean;

	/**
	 *
	 * @param {string} arrayName The name of the array to activate.
	 */
	setActivePedigreeIds(arrayName: string): boolean;

	/**
	 * Set the scalar data.
	 * @param {vtkDataArray} scalars The scalar data.
	 */
	setScalars(scalars: vtkDataArray): boolean;

	/**
	 * Set the vector data.
	 * @param {vtkDataArray} vectors The vector data.
	 */
	setVectors(vectors: vtkDataArray): boolean;

	/**
	 * Set the normal data.
	 * @param {vtkDataArray} normals The normal data.
	 */
	setNormals(normals: vtkDataArray): boolean;

	/**
	 * Set the texture coordinate data.
	 * @param {vtkDataArray} tcoords The texture coordinate data.
	 */
	setTCoords(tcoords: vtkDataArray): boolean;

	/**
	 * Set the tensor data.
	 * @param {vtkDataArray} tensors The tensor data.
	 */
	setTensors(tensors: vtkDataArray): boolean;

	/**
	 * Set the global id data.
	 * @param {vtkDataArray} globalIds The global id data.
	 */
	setGlobalIds(globalIds: vtkDataArray): boolean;

	/**
	 * Set the pedigree id data.
	 * @param {vtkDataArray} pedigreeids The pedigree id data.
	 */
	setPedigreeIds(pedigreeIds: vtkDataArray): boolean;

	/**
	 *
	 */
	copyScalarsOff(): void;

	/**
	 *
	 */
	copyVectorsOff(): void;

	/**
	 *
	 */
	copyNormalsOff(): void;

	/**
	 *
	 */
	copyTCoordsOff(): void;

	/**
	 *
	 */
	copyTensorsOff(): void;

	/**
	 *
	 */
	copyGlobalIdsOff(): void;

	/**
	 *
	 */
	copyPedigreeIdsOff(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkDataSetAttributes characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IDataSetAttributesInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IDataSetAttributesInitialValues): void;

/**
 * Method used to create a new instance of vtkDataSetAttributes.
 * @param {IDataSetAttributesInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IDataSetAttributesInitialValues): vtkDataSetAttributes;

/**
 * vtkDataSetAttributes is a class that is used to represent and manipulate
 * attribute data (e.g., scalars, vectors, normals, texture coordinates,
 * tensors, global ids, pedigree ids, and field data).
 *
 * This adds to vtkFieldData the ability to pick one of the arrays from the
 * field as the currently active array for each attribute type. In other words,
 * you pick one array to be called "THE" Scalars, and then filters down the
 * pipeline will treat that array specially. For example vtkContourFilter will
 * contour "THE" Scalar array unless a different array is asked for.
 *
 * Additionally vtkDataSetAttributes provides methods that filters call to pass
 * data through, copy data into, and interpolate from Fields. PassData passes
 * entire arrays from the source to the destination. Copy passes through some
 * subset of the tuples from the source to the destination. Interpolate
 * interpolates from the chosen tuple(s) in the source data, using the provided
 * weights, to produce new tuples in the destination. Each attribute type has
 * pass, copy and interpolate "copy" flags that can be set in the destination to
 * choose which attribute arrays will be transferred from the source to the
 * destination.
 *
 * Finally this class provides a mechanism to determine which attributes a group
 * of sources have in common, and to copy tuples from a source into the
 * destination, for only those attributes that are held by all.
 */
export declare const vtkDataSetAttributes: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkDataSetAttributes;
