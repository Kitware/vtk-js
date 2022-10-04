export const BufferUsage = {
  Verts: 0,
  Lines: 1,
  Triangles: 2,
  Strips: 3,
  LinesFromStrips: 4,
  LinesFromTriangles: 5,
  Points: 6,
  UniformArray: 7,
  PointArray: 8,
  NormalsFromPoints: 9,
  Texture: 10,
  RawVertex: 11,
  Storage: 12,
  Index: 13,
};

export const PrimitiveTypes = {
  Start: 0,
  Points: 0,
  Lines: 1,
  Triangles: 2,
  TriangleStrips: 3,
  TriangleEdges: 4,
  TriangleStripEdges: 5,
  End: 6,
};

export default {
  BufferUsage,
  PrimitiveTypes,
};
