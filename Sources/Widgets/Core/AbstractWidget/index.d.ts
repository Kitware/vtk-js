/**
 * @param {*} publicAPI public methods to populate
 * @param {*} model internal values to populate
 * @param {object} initialValues Contains at least
 *   {viewType, renderer, camera, openGLRenderWindow, factory}
 */
declare function extend_1(publicAPI: any, model: any, initialValues?: any): void;
/**
 * @param {*} publicAPI public methods to populate
 * @param {*} model internal values to populate
 * @param {object} initialValues Contains at least
 *   {viewType, renderer, camera, openGLRenderWindow, factory}
 */
export const extend: typeof extend_1;
export const newInstance: any;
export interface T100 {
  newInstance: any;
  extend: typeof extend_1;
}
declare const T101: T100;
export default T101;
