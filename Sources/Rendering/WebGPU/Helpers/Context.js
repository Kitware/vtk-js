/**
 * Resolve the WebGPU rendering context (renderer, render window, device) for a
 * view node, replacing the ancestor walk that was copy pasted across mappers,
 * actors and passes.
 * Pass parentType when the caller first needs an intermediate ancestor (the
 * actor or image slice the node draws through); the walk to the renderer starts
 * from that ancestor. Omit it for nodes (actors, volumes, passes) that sit
 * directly under the renderer.
 * @param {*} node
 * @param {*} parentType
 * @returns { parent, renderer, renderWindow, device }
 */
export function getWebGPUContext(node, parentType = null) {
  const parent = parentType ? node.getFirstAncestorOfType(parentType) : null;
  const from = parent ?? node;
  const renderer = from?.getFirstAncestorOfType('vtkWebGPURenderer');
  const renderWindow = renderer?.getFirstAncestorOfType(
    'vtkWebGPURenderWindow'
  );
  const device = renderWindow?.getDevice();
  return { parent, renderer, renderWindow, device };
}

export default { getWebGPUContext };
