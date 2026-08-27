export declare const BufferUsage: {
  readonly Verts: 0;
  readonly Lines: 1;
  readonly Triangles: 2;
  readonly Strips: 3;
  readonly LinesFromStrips: 4;
  readonly LinesFromTriangles: 5;
  readonly Points: 6;
  readonly UniformArray: 7;
  readonly PointArray: 8;
  readonly NormalsFromPoints: 9;
  readonly Texture: 10;
  readonly RawVertex: 11;
  readonly Storage: 12;
  readonly Index: 13;
};

export type BufferUsage = (typeof BufferUsage)[keyof typeof BufferUsage];

export declare const PrimitiveTypes: {
  readonly Start: 0;
  readonly Points: 0;
  readonly Lines: 1;
  readonly Triangles: 2;
  readonly TriangleStrips: 3;
  readonly TriangleEdges: 4;
  readonly TriangleStripEdges: 5;
  readonly End: 6;
};

export type PrimitiveTypes =
  (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes];

declare const _default: {
  BufferUsage: typeof BufferUsage;
  PrimitiveTypes: typeof PrimitiveTypes;
};
export default _default;
