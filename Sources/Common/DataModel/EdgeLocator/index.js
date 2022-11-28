class EdgeLocator {
  constructor(oriented = false) {
    this.oriented = oriented;
    this.edgeMap = new Map();
  }

  initialize() {
    this.edgeMap.clear();
  }

  computeEdgeKey(pointId0, pointId1) {
    return this.oriented || pointId0 < pointId1
      ? // Cantor pairing function:
        0.5 * (pointId0 * pointId1) * (pointId0 * pointId1 + 1) + pointId1
      : 0.5 * (pointId1 * pointId0) * (pointId1 * pointId0 + 1) + pointId0;
  }

  insertUniqueEdge(pointId0, pointId1, newEdgeValue) {
    // Generate a unique key
    const key = this.computeEdgeKey(pointId0, pointId1);
    let node = this.edgeMap.get(key);
    if (!node) {
      // Didn't find key, so add a new edge entry
      node = { key, edgeId: this.edgeMap.size, value: newEdgeValue };
      this.edgeMap.set(key, node);
    }
    return node;
  }

  insertEdge(pointId0, pointId1, newEdgeValue) {
    // Generate a unique key
    const key = this.computeEdgeKey(pointId0, pointId1);
    const node = { key, edgeId: this.edgeMap.size, value: newEdgeValue };
    this.edgeMap.set(key, node);
    return node;
  }

  isInsertedEdge(pointId0, pointId1) {
    const key = this.computeEdgeKey(pointId0, pointId1);
    return this.edgeMap.get(key);
  }

  static getEdgePointIds(node) {
    const n = 0.5 * (-1 + Math.sqrt(8 * node.key + 1));
    const pointId0 = node.key - 0.5 * (n + 1) * n;
    const pointId1 = n - pointId0;
    return [pointId0, pointId1];
  }
}

function newInstance(initialValues = {}) {
  return new EdgeLocator(initialValues.oriented);
}

export default { newInstance };
