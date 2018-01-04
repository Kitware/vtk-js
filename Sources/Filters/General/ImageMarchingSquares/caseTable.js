// ----------------------------------------------------------------------------
// Marching squares case functions (using lines to generate the 2D tessellation).
// For each case, a list of edge ids that form the triangles. A -1 marks the
// end of the list of edges. Edges are taken three at a time to generate
// triangle points.
// ----------------------------------------------------------------------------
const MARCHING_SQUARES_CASES = [
  [-1, -1, -1, -1, -1] /* 0 */,
  [0, 3, -1, -1, -1] /* 1 */,
  [1, 0, -1, -1, -1] /* 2 */,
  [1, 3, -1, -1, -1] /* 3 */,
  [2, 1, -1, -1, -1] /* 4 */,
  [0, 3, 2, 1, -1] /* 5 */,
  [2, 0, -1, -1, -1] /* 6 */,
  [2, 3, -1, -1, -1] /* 7 */,
  [3, 2, -1, -1, -1] /* 8 */,
  [0, 2, -1, -1, -1] /* 9 */,
  [1, 0, 3, 2, -1] /* 10 */,
  [1, 2, -1, -1, -1] /* 11 */,
  [3, 1, -1, -1, -1] /* 12 */,
  [0, 1, -1, -1, -1] /* 13 */,
  [3, 0, -1, -1, -1] /* 14 */,
  [-1, -1, -1, -1, -1] /* 15 */,
];

const EDGES = [[0, 1], [1, 3], [2, 3], [0, 2]];

function getCase(index) {
  return MARCHING_SQUARES_CASES[index];
}

// Define the four edges of the pixel by the following pairs of vertices
function getEdge(eid) {
  return EDGES[eid];
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------
export default {
  getCase,
  getEdge,
};
