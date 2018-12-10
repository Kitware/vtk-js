let resolveCoincidentTopologyPolygonOffsetFaces = 1;
let resolveCoincidentTopology = 0;

export const RESOLVE_COINCIDENT_TOPOLOGY_MODE = [
  'VTK_RESOLVE_OFF',
  'VTK_RESOLVE_POLYGON_OFFSET',
];

export function getResolveCoincidentTopologyPolygonOffsetFaces() {
  return resolveCoincidentTopologyPolygonOffsetFaces;
}

export function setResolveCoincidentTopologyPolygonOffsetFaces(value) {
  resolveCoincidentTopologyPolygonOffsetFaces = value;
}

export function getResolveCoincidentTopology() {
  return resolveCoincidentTopology;
}

export function setResolveCoincidentTopology(mode = 0) {
  resolveCoincidentTopology = mode;
}

export function setResolveCoincidentTopologyToDefault() {
  setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToOff() {
  setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToPolygonOffset() {
  setResolveCoincidentTopology(1); // VTK_RESOLVE_POLYGON_OFFSET
}

export function getResolveCoincidentTopologyAsString() {
  return RESOLVE_COINCIDENT_TOPOLOGY_MODE[resolveCoincidentTopology];
}

export default {
  getResolveCoincidentTopologyAsString,
  getResolveCoincidentTopologyPolygonOffsetFaces,
  getResolveCoincidentTopology,
  setResolveCoincidentTopology,
  setResolveCoincidentTopologyPolygonOffsetFaces,
  setResolveCoincidentTopologyToDefault,
  setResolveCoincidentTopologyToOff,
  setResolveCoincidentTopologyToPolygonOffset,
};
