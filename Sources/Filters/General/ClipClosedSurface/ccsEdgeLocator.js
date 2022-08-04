export default class CCSEdgeLocator {
  constructor() {
    this._edgeMap = new Map();
  }

  initialize() {
    this._edgeMap.clear();
  }

  insertUniqueEdge(i0, i1) {
    // Generate key, which is unique, since we order the edges
    const key = i1 < i0 ? `${i1}-${i0}` : `${i0}-${i1}`;
    let node = this._edgeMap.get(key);
    if (!node) {
      // Didn't find key, so add a new edge entry
      node = { edgeId: -1 };
      this._edgeMap.set(key, node);
    }
    return node;
  }
}
