declare function render_1(vnode: any): any;
export const render: typeof render_1;
/**
 * Returns a set of patch functions to be applied to a document node.
 *
 * Patch functions must return the effective result node.
 */
declare function diff_1(oldVTree: any, newVTree: any): (node: any) => any[];
/**
 * Returns a set of patch functions to be applied to a document node.
 *
 * Patch functions must return the effective result node.
 */
export const diff: typeof diff_1;
