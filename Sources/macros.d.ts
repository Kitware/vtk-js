import { vtkSubscription, vtkDebouncedFunction, vtkProperty, vtkPropertyDomain } from "./interfaces";

/**
 * Allow user to redefine vtkXXXMacro method call.
 * @param name of the macro type [Log, Info, Debug, Error, Warning]
 * @param fn function to use when vtkXXXMacro is called.
 */
export function setLoggerFunction(name: string, fn: (...args: any) => void): void;

/**
 * Logging function used for level: Log
 * @param args arguments to print
 */
export function vtkLogMacro(...args: any): void;

/**
 * Logging function used for level: Info
 * @param args arguments to print
 */
export function vtkInfoMacro(...args: any): void;

/**
 * Logging function used for level: Debug
 * @param args arguments to print
 */
export function vtkDebugMacro(...args: any): void;

/**
 * Logging function used for level: Error
 * @param args arguments to print
 */
export function vtkErrorMacro(...args: any): void;

/**
 * Logging function used for level: Warning
 * @param args arguments to print
 */
export function vtkWarningMacro(...args: any): void;

/**
 * Output error only once
 * This is convenient when the error happen in a loop.
 * This allow you to catch the issue while not overloading your output console.
 */
export function vtkOnceErrorMacro(str: string): void;

/**
 * A way to create typed array based on its name without using the window namespace
 */
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

/**
 * Capitalize provided string.
 * This is typically used to convert the name of a field into its method name.
 *
 * ```
 * const set = `set${capitalize(fieldName)}`;
 * ```
 * @param str String to capitalize
 */
export function capitalize(str: string): string;

/**
 * Capitalize provided string.
 * This is typically used to convert the name of a field into its method name.
 * Ignore the first letter if it starts with underscore (i.e. _).
 *
 * ```
 * const set = `set${capitalize(fieldName)}`;
 * ```
 */
export function _capitalize(str: string): string;

/**
 * Lowercase the first letter of the provided string.
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
 * Measures the time it takes for a promise to finish from the time this function is invoked.
 *
 * The callback receives the time it took for the promise to resolve or reject.
 *
 * @param promise promise to measure
 * @param callback called with the elapsed time for the promise
 */
export function measurePromiseExecution(promise: Promise<any>, callback: (elapsed: number) => void): void;

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

/**
 * Add getter methods to the provided publicAPI for arrays.
 * A new array is used as returned value with get{FieldName}() method
 * unless get{FieldName}ByReference() is used.
 *
 * ```
 * get{FieldName}()            // add getters for object of type array with copy to be safe
 * get{FieldName}ByReference() // add getters for object of type array without copy
 * ```
 *
 * @param publicAPI object on which public methods get attached to
 * @param model object on which protected fields are stored
 * @param fieldNames list of fields available in model that we want to expose as get{FieldName}+get{FieldName}ByReference methods on the publicAPI
 */
export function getArray(publicAPI: object, model: object, fields: Array<string>): void;

/**
 * Add setter methods to the provided publicAPI for arrays.
 * if 'defaultVal' is supplied, shorter arrays will be padded to 'size' with
 * 'defaultVal'.
 * set{FieldName}From(abc) will copy the content of abc into current field
 * without calling modified.
 *
 * ```
 * set{FieldName}(a, b, c) / set{FieldName}([a, b, c]) / set{FieldName}(new Uint8Array(...)) / set{FieldName}(null)
 * set{FieldName}From([a, b, c])
 * ```
 *
 * @param publicAPI
 * @param model
 * @param fieldNames
 * @param size
 * @param defaultVal
 */
export function setArray(publicAPI: object, model: object, fieldNames: Array<string>, size: Number, defaultVal?: any): void;

/**
 * set/get XXX: add setter and getter for object of type array
 * @param publicAPI
 * @param model
 * @param fieldNames
 * @param size
 * @param defaultVal
 */
export function setGetArray(publicAPI: object, model: object, fieldNames: Array<string>, size: Number, defaultVal?: any): void;

/**
 * Convert model and publicAPI references to _fieldName into fieldName.
 * It renames:
 *   - model.fieldName into model._fieldName
 *   - publicAPI.set_fieldName and publicAPI.set_fieldNameFrom into publicAPI.setFieldName and publicAPI.setFieldNameFrom
 *   - publicAPI.get_fieldName and publicAPI.get_fieldNameByReference into publicAPI.getFieldName and publicAPI.getFieldNameByReference
 * @param publicAPI
 * @param model
 * @param fieldNames List of field names to move to protected, e.g. ['interactor', 'renderWindow']
 * @see get
 * @see set
 */
export function moveToProtected(publicAPI: object, model: object, fieldNames: Array<string>): void;

/**
 * Add algorithm methods onto the provided publicAPI
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param numberOfInputs
 * @param numberOfOutputs
 */
export function algo(publicAPI: object, model: object, numberOfInputs: number, numberOfOutputs: number): void;

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
  onChange(VtkCallback, priority?: number): vtkSubscription;
}

// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

export type VtkExtend = (publicAPI: object, model: object, initialValues: object) => void;

export function newInstance(extend: VtkExtend, className: string): any;

// ----------------------------------------------------------------------------
// Chain function calls
// ----------------------------------------------------------------------------

/**
 * Create a new closure that will chain the call of any provided methods
 * @param fn list of function to call
 */
export function chain(...fn: Array<Function>): Function;

/**
 * Test if provided object is an actual vtkObject or not
 * @param instance
 */
export function isVtkObject(instance: any): boolean;

/**
 * Traverse an instance tree of vtkObjects
 *
 * @param instance root of the tree to traverse
 * @param extractFunction function used to decorate vtkObject
 * @param accumulator (default []) array use to capture decorated by the extractFunction
 * @param visitedInstances (default []) array use to capture visitedInstances
 * @returns the accumulator is actually returned
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
 * @returns vtkDebouncedFunction A debounced function that can be called.
 *          Use .cancel() to clear any pending debounced call.
 */
export function debounce(func: (...args: any) => any, wait: number, immediate?: boolean): vtkDebouncedFunction;

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
  listProxyProperties: (groupName: string) => Array<vtkProperty>;
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
  getPropertyByName: (name: string) => vtkProperty;
  getPropertyDomainByName: (name: string) => vtkPropertyDomain;

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
  getCurrentGlobalMTime(): Number;
  getStateArrayMapFunc: typeof getStateArrayMapFunc,
  isVtkObject: typeof isVtkObject,
  keystore: typeof keystore,
  measurePromiseExecution: typeof measurePromiseExecution,
  moveToProtected: typeof moveToProtected,
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
  vtkWarningMacro: typeof vtkWarningMacro,
};

export default Macro;
