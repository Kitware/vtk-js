import vtkDataArray from "./Common/Core/DataArray";
import { vtkPipelineConnection } from "./types";

/**
 * Object returned on any subscription call
 */
export interface vtkSubscription {
	unsubscribe(): void;
}

/**
 * Basic object representing a data range
 */
export interface vtkRange {
	min: number;
	max: number;
}

/**
 * Represents a debounced function.
 */
export interface vtkDebouncedFunction {
  (...args: any) : any;
  cancel() : void;
}

export interface vtkOutputPort {
	filter: vtkAlgorithm;
}

/**
 * vtkAlgorithm API
 */
export interface vtkAlgorithm {
	/**
	 * @param dataset
	 * @param port (default 0)
	 */
	setInputData(dataset: any, port?: number): void;
	/**
	 * @param port (default 0)
	 */
	getInputData(port?: number): any;
	/**
	 * @param outputPort
	 * @param port (default 0)
	 */
	setInputConnection(outputPort: vtkPipelineConnection, port?: number): void;
	/**
	 * @param port (default 0)
	 */
	getInputConnection(port?: number): vtkPipelineConnection;
	addInputConnection(outputPort: vtkPipelineConnection): void;
	addInputData(dataset: any): void;
	/**
	 * @param port (default 0)
	 */
	getOutputData(port?: number): any;
	shouldUpdate(): boolean;
	/**
	 * @param port (default 0)
	 */
	getOutputPort(port?: number): vtkPipelineConnection;
	update(): void;
	getNumberOfInputPorts(): number;
	getNumberOfOutputPorts(): number;
	/**
	 * @param port (default 0)
	 */
	getInputArrayToProcess(inputPort?: number): vtkDataArray;
	/**
	 *
	 * @param inputPort
	 * @param arrayName
	 * @param fieldAssociation
	 * @param attributeType (default 'Scalars')
	 */
	setInputArrayToProcess(
		inputPort: number,
		arrayName: string,
		fieldAssociation: string,
		attributeType?: string
	): void;
}

/**
* Base vtkClass which provides MTime tracking and class infrastructure
*/
export interface vtkObject {
	/**
	 * Allow to check if that object was deleted (.delete() was called before).
	 *
	 * @returns true if delete() was previously called
	 */
	isDeleted(): boolean;

	/**
	 * Mark the object dirty by increasing its MTime.
	 * Such action also trigger the onModified() callbacks if any was registered.
	 * This naturally happens when you call any setXXX(value) with a different value.
	 */
	modified(): void;

	/**
	 * Method to register callback when the object is modified().
	 *
	 * @param callback function
	 * @returns subscription object so you can easily unsubscribe later on
	 */
	onModified(callback: (instance: vtkObject) => any): vtkSubscription;

	/**
	 * Return the `Modified Time` which is a monotonic increasing integer
	 * global for all vtkObjects.
	 *
	 * This allow to solve a question such as:
	 *  - Is that object created/modified after another one?
	 *  - Do I need to re-execute this filter, or not? ...
	 *
	 * @return {Number} the global modified time.
	 */
	getMTime(): number;

	/**
	 * Method to check if an instance is of a given class name.
	 * For example such method for a vtkCellArray will return true
	 * for any of the following string: ['vtkObject', 'vtkDataArray', 'vtkCellArray']
	 */
	isA(className: string): boolean;

	/**
	 * Return the instance class name.
	 */
	getClassName(): string;

	/**
	 * Generic method to set many fields at one.
	 *
	 * For example calling the following function
	 * ```
	 * changeDetected = sphereSourceInstance.set({
	 *    phiResolution: 10,
	 *    thetaResolution: 20,
	 * });
	 * ```
	 * will be equivalent of calling
	 * ```
	 * changeDetected += sphereSourceInstance.setPhiResolution(10);
	 * changeDetected += sphereSourceInstance.setThetaResolution(20);
	 * changeDetected = !!changeDetected;
	 * ```
	 *
	 * In case you provide other field names that do not belong to the instance,
	 * vtkWarningMacro will be used to warn you. To disable those warning,
	 * you can set `noWarning` to true.
	 *
	 * If `noFunction` is set to true, the field will be set directly on the model
	 * without calling the `set${FieldName}()` method.
	 *
	 * @param map (default: {}) Object capturing the set of fieldNames and associated values to set.
	 * @param noWarning (default: false) Boolean to disable any warning.
	 * @param noFunctions (default: false) Boolean to skip any function execution and rely on only setting the fields on the model.
	 * @return true if a change was actually performed. False otherwise when the value provided were equal to the ones already set inside the instance.
	 */
	set(map?: object, noWarning?: boolean, noFunction?: boolean): boolean;

	/**
	 * Extract a set of properties at once from a vtkObject.
	 *
	 * This can be convenient to pass a partial state of
	 * one object to another.
	 *
	 * ```
	 * cameraB.set(cameraA.get('position', 'viewUp', 'focalPoint'));
	 * ```
	 *
	 * @param listOfKeys set of field names that you want to retrieve. If not provided, the full model get returned as a new object.
	 * @returns a new object containing only the values of requested fields
	 */
	get(...listOfKeys: Array<string>): object;

	/**
	 * Allow to get a direct reference of a model element
	 *
	 * @param name of the field to extract from the instance model
	 * @returns model[name]
	 */
	getReferenceByName(name: string): any;

	/**
	 * Dereference any internal object and remove any subscription.
	 * It gives custom class to properly detach themselves from the DOM
	 * or any external dependency that could prevent their deletion
	 * when the GC runs.
	 */
	delete(): void;

	/**
	 * Try to extract a serializable (JSON) object of the given
	 * instance tree.
	 *
	 * Such state can then be reused to clone or rebuild a full
	 * vtkObject tree using the root vtk() function.
	 *
	 * The following example will grab mapper and dataset that are
	 * beneath the vtkActor instance as well.
	 *
	 * ```
	 * const actorStr = JSON.stringify(actor.getState());
	 * const newActor = vtk(JSON.parse(actorStr));
	 * ```
	 */
	getState(): object;

	/**
	 * Try to copy the state of the other to ourselves by just using references.
	 *
	 * @param other instance to copy the reference from
	 * @param debug (default: false) if true feedback will be provided when mismatch happen
	 */
	shallowCopy(other: vtkObject, debug?: boolean): void;
}

export interface vtkProperty {
	name: string;
	children?: Array<vtkProperty>;
}

export interface vtkPropertyDomain {}
