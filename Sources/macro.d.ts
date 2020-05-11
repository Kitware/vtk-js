export function setLoggerFunction(name: string, fn: (...args: any) => void): void;
export function vtkLogMacro(...args: any): void;
export function vtkInfoMacro(...args: any): void;
export function vtkDebugMacro(...args: any): void;

export function vtkErrorMacro(...args: any): void;
export function vtkWarningMacro(...args: any): void;

// Output error only once
export function vtkOnceErrorMacro(str: string): void;

// ----------------------------------------------------------------------------
// TypedArray
// ----------------------------------------------------------------------------

export enum TYPED_ARRAYS {
  Float32Array,
  Float64Array,
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
}

// ----------------------------------------------------------------------------
// capitalize provided string
// ----------------------------------------------------------------------------

/**
 * capitalize provided string
 */
export function capitalize(str: string): string;

/**
 * Lowercase the first letter of the provided string
 */
export function uncapitalize(str: string): string;

/**
 * Convert byte size into a well formatted string.
 *
 * @param size number of bytes
 * @param precision (default: 2) how many digit you want behind the unit
 * @param chunkSize (default: 1000) base 1000 or 1024
 */
export function formatBytesToProperUnit(size: number, precision?: number, chunkSize?: number): string;

// ----------------------------------------------------------------------------
// Convert thousand number with proper separator
// ----------------------------------------------------------------------------

/**
 *
 * @param n number to format
 * @param separator (default: ' ')
 */
export function formatNumbersWithThousandSeparator(n: number, separator?: string): string;

// ----------------------------------------------------------------------------
// Array helper
// ----------------------------------------------------------------------------

/**
 * Replace internal arrays with new reference but with same content
 *
 * @param model
 */
declare function safeArrays(model: object): void;

/**
 * Extract the key of an object where the given value match the given one
 *
 * @param e enum object to search key/value from
 * @param value to look for inside object
 */
declare function enumToString(e: object, value: any): string;

/**
 * If item is a VtkObject, return its getState() otherwise return itself.
 *
 * @param item object to extract its state from
 */
declare function getStateArrayMapFunc(item: any): any;

/**
 * Call provided function on the next EDT pass
 *
 * @param fn function to execute
 */
export function setImmediateVTK(fn: () => void ): void;

/**
 * Object returned on any subscription call
 */
export interface VtkSubscription {
  unsubscribe(): void;
}

/**
 * Base vtkClass which provides MTime tracking and class infrastructure
 */
export interface VtkObject {
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
  onModified(callback: (instance: VtkObject) => any): VtkSubscription;

  /**
   * Return the `Modified Time` which is a monotonic increasing integer
   * global for all vtkObjects.
   *
   * This allow to solve a question such as:
   *  - Is that object created/modified after another one?
   *  - Do I need to re-execute this filter, or not? ...
   *
   * @returns the global modified time
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
  shallowCopy(other: VtkObject, debug?: boolean): void;
}

/**
 * Turns the provided publicAPI into a VtkObject
 *
 * @param publicAPI (default: {}) object on which public methods get attached to
 * @param model (default: {}) object on which protected fields are stored
 * @returns publicAPI
 */
export function obj(publicAPI?: object, model?: object): object;

/**
 * Add getter methods to the provided publicAPI
 *
 * @param publicAPI object on which public methods get attached to
 * @param model object on which protected fields are stored
 * @param fieldNames list of fields available in model that we want to expose as get{FieldName} methods on the publicAPI
 */
export function get(publicAPI: object, model: object, fieldNames: Array<string>): void;

/**
 * Add setter methods to the provided publicAPI
 *
 * @param publicAPI object on which public methods get attached to
 * @param model object on which protected fields are stored
 * @param fieldNames list of fields available in model that we want to expose as set{FieldName} methods on the publicAPI
 */
export function set(publicAPI: object, model: object, fields: Array<string>): void;

/**
 * Add setter+getter methods to the provided publicAPI
 *
 * @param publicAPI object on which public methods get attached to
 * @param model object on which protected fields are stored
 * @param fieldNames list of fields available in model that we want to expose as set{FieldName}+get{FieldName} methods on the publicAPI
 */
export function setGet(publicAPI: object, model: object, fields: Array<string>): void;

// ----------------------------------------------------------------------------
// getXXX: add getters for object of type array with copy to be safe
// getXXXByReference: add getters for object of type array without copy
// ----------------------------------------------------------------------------
/**
 * Add getter methods to the provided publicAPI for arrays.
 * A new array is used as returned value with get{FieldName}() method
 * unless get{FieldName}ByReference() is used.
 *
 * ```
 * get{FieldName}()
 * get{FieldName}ByReference()
 * ```
 *
 * @param publicAPI object on which public methods get attached to
 * @param model object on which protected fields are stored
 * @param fieldNames list of fields available in model that we want to expose as get{FieldName}+get{FieldName}ByReference methods on the publicAPI
 */
export function getArray(publicAPI: object, model: object, fields: Array<string>): void;

// ----------------------------------------------------------------------------
// setXXX: add setter for object of type array
// if 'defaultVal' is supplied, shorter arrays will be padded to 'size' with 'defaultVal'
// set...From: fast path to copy the content of an array to the current one without call to modified.
// ----------------------------------------------------------------------------

/**
 * Add setter methods to the provided publicAPI for arrays.
 * if 'defaultVal' is supplied, shorter arrays will be padded to 'size' with
 * 'defaultVal'.
 * set{FieldName}From(abc) will copy the content of abc into current field
 * without calling modified.
 *
 * ```
 * set{FieldName}(a, b, c) / set{FieldName}(abc)
 * set{FieldName}From(abc)
 * ```
 *
 * @param publicAPI
 * @param model
 * @param fieldNames
 * @param size
 * @param defaultVal
 */
export function setArray(publicAPI: object, model: object, fieldNames: Array<string>, size: Number, defaultVal?: any): void;

// ----------------------------------------------------------------------------
// set/get XXX: add setter and getter for object of type array
// ----------------------------------------------------------------------------

export function setGetArray(publicAPI: object, model: object, fieldNames: Array<string>, size: Number, defaultVal?: any): void;

// ----------------------------------------------------------------------------
// Some core data model definitions
// ----------------------------------------------------------------------------

export interface VtkRange {
  min: number;
  max: number;
}

export interface VtkDataArray {
  getElementComponentSize(): number;
  /**
   *
   * @param tupleIdx
   * @param componentIndex (default: 0)
   */
  getComponent(tupleIdx: number, componentIndex: number): number;
  setComponent(tupleIdx: number, componentIndex: number, value: number): void;
  getData: () => Array<number>;
  /**
   * Return the range of the given component.
   *
   * @param componentIndex (default: -1)
   */
  getRange(componentIndex?: number): VtkRange;
  setRange(rangeValue: VtkRange, componentIndex: number): [number, number];
  setTuple(idx: number, tuple: Array<number>): void;
  /**
   *
   * @param idx
   * @param tupleToFill (default [])
   */
  getTuple(idx: number, tupleToFill?: Array<number>): Array<number>;
  /**
   *
   * @param idx (default: 1)
   */
  getTupleLocation(idx: number): number;
  getNumberOfComponents: () => number;
  getNumberOfValues: () => number;
  getNumberOfTuples: () => number;
  getDataType: () => string;
  newClone: () => VtkDataArray;
  getName: () => string;
  setData: (typedArray: Array<number>, numberOfComponents: number) => void;
  getState: () => object;
  // --- via macro --
  setName: (name: string) => boolean;
  setNumberOfComponents: (numberOfComponents: number) => boolean;
}

// ----------------------------------------------------------------------------
// vtkAlgorithm: setInputData(), setInputConnection(), getOutputData(), getOutputPort()
// ----------------------------------------------------------------------------

export interface VtkOutputPort {
  filter: VtkAlgorithm;
}

export type VtkPipelineConnection = () => any | VtkOutputPort;

export interface VtkAlgorithm {
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
  setInputConnection(outputPort: VtkPipelineConnection, port?: number): void;
  /**
   * @param port (default 0)
   */
  getInputConnection(port?: number): VtkPipelineConnection;
  addInputConnection(outputPort: VtkPipelineConnection): void;
  addInputData(dataset: any): void;
  /**
   * @param port (default 0)
   */
  getOutputData(port?: number): any;
  shouldUpdate(): boolean;
  /**
   * @param port (default 0)
   */
  getOutputPort(port?: number): VtkPipelineConnection;
  update(): void;
  getNumberOfInputPorts(): number;
  getNumberOfOutputPorts(): number;
  /**
   * @param port (default 0)
   */
  getInputArrayToProcess(inputPort?: number): VtkDataArray;
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

export function algo(publicAPI: object, model: object, numberOfInputs: number, numberOfOutputs: number): void;

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), invokeXXX(args...)
// ----------------------------------------------------------------------------

/**
 * Symbols used as return value for callback
 */
export const VOID: Symbol;

/**
 * Symbols used as return value for callback when you want to stop
 * any further callback calls after yours.
 */
export const EVENT_ABORT: Symbol;

export function event(publicAPI: object, model: object, eventName: string): void;

/**
 * Event callback
 * @param args
 * @returns symbol to either keep going or interrupt existing callback call stack
 */
export function VtkCallback(...args: any): void | symbol;

// Example of event(,, 'change')
export interface VtkChangeEvent {
  /**
   * Call any registered callbacks with the given arguments
   * @param args
   */
  invokeChange(...args: any): void;
  /**
   * Execute higher priority callback first
   * negative priority use setTimeout(cb, -priority) for later callback
   *
   * @param VtkCallback
   * @param priority (default 0.0)
   */
  onChange(VtkCallback, priority?: number): VtkSubscription;
}

// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

export type VtkExtend = (publicAPI: object, model: object, initialValues: object) => void;

export function newInstance(extend: VtkExtend, className: string): any;

// ----------------------------------------------------------------------------
// Chain function calls
// ----------------------------------------------------------------------------

export function chain(...fn: any): any;

// ----------------------------------------------------------------------------
// Some utility methods for vtk objects
// ----------------------------------------------------------------------------

export function isVtkObject(instance: any): boolean;

/**
 *
 * @param instance
 * @param extractFunction
 * @param accumulator (default [])
 * @param visitedInstances (default [])
 */
export function traverseInstanceTree(
  instance: any,
  extractFunction: any,
  accumulator?: Array<any>,
  visitedInstances?: Array<any>
): Array<any>;

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @param func
 * @param wait
 * @param immediate (default false)
 */
export function debounce(func: (...args: any) => any, wait: number, immediate?: boolean): (...args: any) => any;

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds.
 *
 * @param callback
 * @param delay
 */
export function throttle(callback: (...args: any) => any, delay: number): (...args: any) => any;

/**
 * keystore(publicAPI, model, initialKeystore)
 *
 *    - initialKeystore: Initial keystore. This can be either a Map or an
 *      object.
 *
 * Generated API
 *  setKey(key, value) : mixed (returns value)
 *  getKey(key) : mixed
 *  getAllKeys() : [mixed]
 *  deleteKey(key) : Boolean
 */
export interface VtkKeyStore {
  setKey: (key: string, value: any) => void;
  getKey: (key: string) => any;
  getAllKeys: () => Array<string>;
  deleteKey: (key: string) => void;
  clearKeystore: () => void;
}

/**
 *
 * @param publicAPI
 * @param model
 * @param initialKeystore (default {})
 */
export function keystore(publicAPI: object, model: object, initialKeystore?: object): void;

// ----------------------------------------------------------------------------
// proxy(publicAPI, model, sectionName, propertyUI)
//
//    - sectionName: Name of the section for UI
//    - propertyUI: List of props with their UI description
//
// Generated API
//  getProxyId() : String
//  listProxyProperties() : [string]
//  updateProxyProperty(name, prop)
//  getProxySection() => List of properties for UI generation
// ----------------------------------------------------------------------------

export interface VtkProxyManager {
}

export interface VtkProperty {
  name: string;
  children?: Array<VtkProperty>;
}

export interface VtkPropertyDomain {
}

export interface VtkProxySection {
  id: string;
  name: string;
  ui: object;
  properties: Array<any>,
}

export interface VtkLink {
  /**
   *
   * @param instance
   * @param propertyName
   * @param updateMe (default: false)
   */
  bind(instance: VtkProxy, propertyName: string, updateMe?: boolean): void;
  unbind: (instance: VtkProxy, propertyName: string) => void;
  unsubscribe: () => void;
  persistent: boolean;
}

export interface VtkProxy extends VtkKeyStore {
  getProxyId(): string;
  getProxyGroup(): string;
  getProxyName: () => string;
  setProxyManager: (pxm: VtkProxyManager) => boolean;
  getProxyManager: () => VtkProxyManager;

  updateUI: (ui: object) => void;
  listProxyProperties: (groupName: string) => Array<VtkProperty>;
  updateProxyProperty: (propertyName: string, propUI: object) => void;
  activate: () => void;
  registerPropertyLinkForGC: (otherLink: VtkLink, type: string) => void;
  gcPropertyLinks(type: string): void;

  /**
   *
   * @param id
   * @param persistent (default: false)
   */
  getPropertyLink(id: string, persistent?: boolean): VtkLink;

  /**
   *
   * @param groupName (default: ROOT_GROUP_NAME)
   */
  getProperties(groupName?: string): Array<any>;
  listPropertyNames: () => Array<string>;
  getPropertyByName: (name: string) => VtkProperty;
  getPropertyDomainByName: (name: string) => VtkPropertyDomain;

  getProxySection: () => VtkProxySection;
  delete: () => void;
}

export function proxy(publicAPI: object, model: object): void;

/**
 * proxyPropertyMapping(publicAPI, model, map)
 *
 * ```
 *   map = {
 *      opacity: { modelKey: 'property', property: 'opacity' },
 *   }
 * ```
 *
 * Generated API:
 *  Elevate set/get methods from internal object stored in the model to current one
 *
 * @param publicAPI
 * @param model
 * @param map
 */
export function proxyPropertyMapping(publicAPI: object, model: object, map: object): void;

/**
 * proxyPropertyState(publicAPI, model, state, defaults)
 *
 * ```
 *   state = {
 *     representation: {
 *       'Surface with edges': { property: { edgeVisibility: true, representation: 2 } },
 *       Surface: { property: { edgeVisibility: false, representation: 2 } },
 *       Wireframe: { property: { edgeVisibility: false, representation: 1 } },
 *       Points: { property: { edgeVisibility: false, representation: 0 } },
 *     },
 *   }
 *
 *   defaults = {
 *      representation: 'Surface',
 *   }
 * ```
 *
 * Generated API
 *   get / set Representation ( string ) => push state to various internal objects
 *
 * @param publicAPI
 * @param model
 * @param state (default: {})
 * @param defaults (default: {})
 */
export function proxyPropertyState(publicAPI: object, model: object, state?: object, defaults?: object): void;

// ----------------------------------------------------------------------------
// From : https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
//
//
// Copyright (c) 2015, Facebook, Inc.
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree. An additional grant
// of patent rights can be found in the PATENTS file in the same directory.
//
//
// Mouse wheel (and 2-finger trackpad) support on the web sucks.  It is
// complicated, thus this doc is long and (hopefully) detailed enough to answer
// your questions.
//
// If you need to react to the mouse wheel in a predictable way, this code is
// like your bestest friend.// hugs//
//
// As of today, there are 4 DOM event types you can listen to:
//
//   'wheel'                -- Chrome(31+), FF(17+), IE(9+)
//   'mousewheel'           -- Chrome, IE(6+), Opera, Safari
//   'MozMousePixelScroll'  -- FF(3.5 only!) (2010-2013) -- don't bother!
//   'DOMMouseScroll'       -- FF(0.9.7+) since 2003
//
// So what to do?  The is the best:
//
//   normalizeWheel.getEventType();
//
// In your event callback, use this code to get sane interpretation of the
// deltas.  This code will return an object with properties:
//
//   spinX   -- normalized spin speed (use for zoom) - x plane
//   spinY   -- " - y plane
//   pixelX  -- normalized distance (to pixels) - x plane
//   pixelY  -- " - y plane
//
// Wheel values are provided by the browser assuming you are using the wheel to
// scroll a web page by a number of lines or pixels (or pages).  Values can vary
// significantly on different platforms and browsers, forgetting that you can
// scroll at different speeds.  Some devices (like trackpads) emit more events
// at smaller increments with fine granularity, and some emit massive jumps with
// linear speed or acceleration.
//
// This code does its best to normalize the deltas for you:
//
//   - spin is trying to normalize how far the wheel was spun (or trackpad
//     dragged).  This is super useful for zoom support where you want to
//     throw away the chunky scroll steps on the PC and make those equal to
//     the slow and smooth tiny steps on the Mac. Key data: This code tries to
//     resolve a single slow step on a wheel to 1.
//
//   - pixel is normalizing the desired scroll delta in pixel units.  You'll
//     get the crazy differences between browsers, but at least it'll be in
//     pixels!
//
//   - positive value indicates scrolling DOWN/RIGHT, negative UP/LEFT.  This
//     should translate to positive value zooming IN, negative zooming OUT.
//     This matches the newer 'wheel' event.
//
// Why are there spinX, spinY (or pixels)?
//
//   - spinX is a 2-finger side drag on the trackpad, and a shift + wheel turn
//     with a mouse.  It results in side-scrolling in the browser by default.
//
//   - spinY is what you expect -- it's the classic axis of a mouse wheel.
//
//   - I dropped spinZ/pixelZ.  It is supported by the DOM 3 'wheel' event and
//     probably is by browsers in conjunction with fancy 3D controllers .. but
//     you know.
//
// Implementation info:
//
// Examples of 'wheel' event if you scroll slowly (down) by one step with an
// average mouse:
//
//   OS X + Chrome  (mouse)     -    4   pixel delta  (wheelDelta -120)
//   OS X + Safari  (mouse)     -  N/A   pixel delta  (wheelDelta  -12)
//   OS X + Firefox (mouse)     -    0.1 line  delta  (wheelDelta  N/A)
//   Win8 + Chrome  (mouse)     -  100   pixel delta  (wheelDelta -120)
//   Win8 + Firefox (mouse)     -    3   line  delta  (wheelDelta -120)
//
// On the trackpad:
//
//   OS X + Chrome  (trackpad)  -    2   pixel delta  (wheelDelta   -6)
//   OS X + Firefox (trackpad)  -    1   pixel delta  (wheelDelta  N/A)
//
// On other/older browsers.. it's more complicated as there can be multiple and
// also missing delta values.
//
// The 'wheel' event is more standard:
//
// http://www.w3.org/TR/DOM-Level-3-Events/#events-wheelevents
//
// The basics is that it includes a unit, deltaMode (pixels, lines, pages), and
// deltaX, deltaY and deltaZ.  Some browsers provide other values to maintain
// backward compatibility with older events.  Those other values help us
// better normalize spin speed.  Example of what the browsers provide:
//
//                          | event.wheelDelta | event.detail
//        ------------------+------------------+--------------
//          Safari v5/OS X  |       -120       |       0
//          Safari v5/Win7  |       -120       |       0
//         Chrome v17/OS X  |       -120       |       0
//         Chrome v17/Win7  |       -120       |       0
//                IE9/Win7  |       -120       |   undefined
//         Firefox v4/OS X  |     undefined    |       1
//         Firefox v4/Win7  |     undefined    |       3
//
// ----------------------------------------------------------------------------

export interface VtkNormalizedWheelEvent {
  spinX: number;
  spinY: number;
  pixelX: number;
  pixelY: number;
}

export function normalizeWheel(wheelEvent: object): VtkNormalizedWheelEvent;

// ----------------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------------

declare const Macro: {
  algo: typeof algo,
  capitalize: typeof capitalize,
  chain: typeof chain,
  debounce: typeof debounce,
  enumToString: typeof enumToString,
  event: typeof event,
  EVENT_ABORT: typeof EVENT_ABORT,
  formatBytesToProperUnit: typeof formatBytesToProperUnit,
  formatNumbersWithThousandSeparator: typeof formatNumbersWithThousandSeparator,
  get: typeof get,
  getArray: typeof getArray,
  getCurrentGlobalMTime: () => Number,
  getStateArrayMapFunc: typeof getStateArrayMapFunc,
  isVtkObject: typeof isVtkObject,
  keystore: typeof keystore,
  newInstance: typeof newInstance,
  normalizeWheel: typeof normalizeWheel,
  obj: typeof obj,
  proxy: typeof proxy,
  proxyPropertyMapping: typeof proxyPropertyMapping,
  proxyPropertyState: typeof proxyPropertyState,
  safeArrays: typeof safeArrays,
  set: typeof set,
  setArray: typeof setArray,
  setGet: typeof setGet,
  setGetArray: typeof setGetArray,
  setImmediate: typeof setImmediateVTK,
  setLoggerFunction: typeof setLoggerFunction,
  throttle: typeof throttle,
  traverseInstanceTree: typeof traverseInstanceTree,
  TYPED_ARRAYS: typeof TYPED_ARRAYS,
  uncapitalize: typeof uncapitalize,
  VOID: typeof VOID,
  vtkDebugMacro: typeof vtkDebugMacro,
  vtkErrorMacro: typeof vtkErrorMacro,
  vtkInfoMacro: typeof vtkInfoMacro,
  vtkLogMacro: typeof vtkLogMacro,
  vtkOnceErrorMacro: typeof vtkOnceErrorMacro,
  vtkWarningMacro: typeof vtkWarningMacro
};

export default Macro;
