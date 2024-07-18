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
  const changed = resolveCoincidentTopologyPolygonOffsetFaces === value;
  resolveCoincidentTopologyPolygonOffsetFaces = value;
  return changed;
}

export function getResolveCoincidentTopology() {
  return resolveCoincidentTopology;
}

export function setResolveCoincidentTopology(mode = 0) {
  const changed = resolveCoincidentTopology === mode;
  resolveCoincidentTopology = mode;
  return changed;
}

export function setResolveCoincidentTopologyToDefault() {
  return setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToOff() {
  return setResolveCoincidentTopology(0); // VTK_RESOLVE_OFF
}

export function setResolveCoincidentTopologyToPolygonOffset() {
  return setResolveCoincidentTopology(1); // VTK_RESOLVE_POLYGON_OFFSET
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
