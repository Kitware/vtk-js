import { vtkObject, vtkSubscription } from '../../../interfaces';
import vtkImageStream from '../ImageStream';

/**
 * Bind optional dependency from WSLink to our current class.
 * This is mandatory when using that class
 *
 * ```
 * import SmartConnect from 'wslink/src/SmartConnect';
 * import vtkWSLinkClient from '@kitware/vtk.js/IO/Core/WSLinkClient';
 *
 * vtkWSLinkClient.setSmartConnectClass(SmartConnect);
 * ```
 *
 * @param smartConnectClass
 */
export function setSmartConnectClass(smartConnectClass: object): void;

export interface vtkWSLinkClient extends vtkObject {

  /**
   * Virtually increase work load to maybe keep isBusy() on
   * while executing a synchronous task.
   */
  beginBusy(): void;

  /**
   * Virtually decreasing work load to maybe free isBusy()
   * after executing a synchronous task. Other async calls
   * could still keep the state as busy.
   */
  endBusy(): void;

  /**
   * Return the current state of busy.
   * Do we still have pending calls?
   */
  isBusy(): boolean;

  /**
   * Return true if the client is currently connected to a server
   */
  isConnected(): boolean;

  /**
   * Initiate the connection with the server
   * @param {Object} config
   * @param {Function} [configDecorator] (default: null)
   */
  connect(config: object, configDecorator?: (config: object) => object): Promise<vtkWSLinkClient>;

  /**
   * Disconnect from server
   * @param {Number} timeout amount of second to wait before the server exit as well. If we want to avoid the server from quitting, `-1` should be provided. (default=60)
   */
  disconnect(timeout: number): void;

  /**
   * Register dynamically a protocol after being connected
   *
   * @param {String} name
   * @param {Function} protocol
   */
  registerProtocol(name: string, protocol: (session: object) => object): void;

  /**
   * Remove a given protocol from the available list
   *
   * @param {String} name
   */
  unregisterProtocol(name: string): void;

  // --- via macro --

  /**
   * Assign protocols to the client. Those will only be used at connect time and therefore needs to be set before being connected otherwise `registerProtocol` should be used instead.
   * @returns {Boolean} true if the set method modified the object
   */
  setProtocols(protocols: object): boolean;

  /**
   * Get protocols that were either provided in `newInstance` or via its set
   */
  getProtocols(): object;

  /**
   * Update the list of methods that should be ignore from the busy state monitoring
   * @returns {Boolean} true if the set method modified the object
   */
  setNotBusyList(methodList: [string]): boolean;

  /**
   * @returns {object} the current set of methods to ignore from busy state
   */
  getNotBusyList(): object;

  /**
   * Should the client auto listen to image stream topic by creating its imageStream object
   * @param {Boolean} autoCreate (default: true)
   * @returns {Boolean} true if the set method modified the object
   */
  setCreateImageStream(autoCreate: boolean): boolean;

  /**
   * @returns {Boolean} the autoCreate state for imageStream
   */
  getCreateImageStream(): boolean;

  /**
   * Set a config decorator to possibly alterate the config object that get received from the launcher.
   * @param decorator function for config object
   */
  setConfigDecorator(decorator: (config: object) => object): boolean;

  /**
   * @returns {Function} configDecorator function if any was provided
   */
  getConfigDecorator(): (config: object) => object;

  /**
   *
   */
  getConnection(): any;

  /**
   *
   */
  getConfig(): object;

  /**
   *
   */
  getRemote(): object;

  /**
   *
   */
  getImageStream(): vtkImageStream;

  /**
   *
   * @param callback
   * @param priority
   */
  onBusyChange(callback: Function, priority: number): vtkSubscription;

  /**
   *
   */
  invokeBusyChange(): void;

  onConnectionReady(callback: (httpReq: any) => void): vtkSubscription;
  // invokeConnectionReady(): void

  onConnectionError(callback: (httpReq: any) => void): vtkSubscription;
  // invokeConnectionError(): void

  onConnectionClose(callback: (httpReq: any) => void): vtkSubscription;
  // invokeConnectionClose(): void
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkWSLinkClient characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkWSLinkClient
 * @param {object} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkWSLinkClient;

/**
 * vtkWSLinkClient is a WSLink client for talking to a server over WebSocket
 */
export declare const vtkWSLinkClient: {
  newInstance: typeof newInstance,
  extend: typeof extend,
  // static
  setSmartConnectClass: typeof setSmartConnectClass,
};

export default vtkWSLinkClient;
