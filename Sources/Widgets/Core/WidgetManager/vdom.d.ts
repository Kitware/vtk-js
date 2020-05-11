export function render(vnode: any): any;
/**
 * Returns a set of patch functions to be applied to a document node.
 *
 * Patch functions must return the effective result node.
 */
export function diff(oldVTree: any, newVTree: any): ((node: any) => any)[];
