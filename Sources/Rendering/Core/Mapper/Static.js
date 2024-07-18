export const Resolve = {
  Off: 0,
  PolygonOffset: 1,
};

let resolveCoincidentTopologyPolygonOffsetFaces = Resolve.PolygonOffset;
let resolveCoincidentTopology = Resolve.Off;

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
  return setResolveCoincidentTopology(Resolve.Off);
}

export function setResolveCoincidentTopologyToOff() {
  return setResolveCoincidentTopology(Resolve.Off);
}

export function setResolveCoincidentTopologyToPolygonOffset() {
  return setResolveCoincidentTopology(Resolve.PolygonOffset);
}

export function getResolveCoincidentTopologyAsString() {
  return RESOLVE_COINCIDENT_TOPOLOGY_MODE[resolveCoincidentTopology];
}

export default {
  Resolve,
  getResolveCoincidentTopologyAsString,
  getResolveCoincidentTopologyPolygonOffsetFaces,
  getResolveCoincidentTopology,
  setResolveCoincidentTopology,
  setResolveCoincidentTopologyPolygonOffsetFaces,
  setResolveCoincidentTopologyToDefault,
  setResolveCoincidentTopologyToOff,
  setResolveCoincidentTopologyToPolygonOffset,
};
