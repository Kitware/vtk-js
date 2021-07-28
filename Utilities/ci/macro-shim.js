/**
 * Macro shim to provide backwards compat with
 * projects that still import from 'macro.js'
 */
import macro from './macros.js';

export * from './macros.js';
export default macro;
