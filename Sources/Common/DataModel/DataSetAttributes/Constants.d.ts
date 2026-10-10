export declare const AttributeTypes: {
  readonly SCALARS: 0;
  readonly VECTORS: 1;
  readonly NORMALS: 2;
  readonly TCOORDS: 3;
  readonly TENSORS: 4;
  readonly GLOBALIDS: 5;
  readonly PEDIGREEIDS: 6;
  readonly EDGEFLAG: 7;
  readonly NUM_ATTRIBUTES: 8;
};

export type AttributeTypes =
  (typeof AttributeTypes)[keyof typeof AttributeTypes];

export declare const AttributeLimitTypes: {
  readonly MAX: 0;
  readonly EXACT: 1;
  readonly NOLIMIT: 2;
};

export type AttributeLimitTypes =
  (typeof AttributeLimitTypes)[keyof typeof AttributeLimitTypes];

export declare const CellGhostTypes: {
  /**
   * The cell is present on multiple processors
   */
  readonly DUPLICATECELL: 1;
  /**
   * The cell has more neighbors than in a regular mesh
   */
  readonly HIGHCONNECTIVITYCELL: 2;
  /**
   * The cell has less neighbors than in a regular mesh
   */
  readonly LOWCONNECTIVITYCELL: 4;
  /**
   * Other cells are present that refines it
   */
  readonly REFINEDCELL: 8;
  /**
   * The cell is on the exterior of the data set
   */
  readonly EXTERIORCELL: 16;
  /**
   * The cell is needed to maintain connectivity, but the data values should be
   * ignored
   */
  readonly HIDDENCELL: 32;
};

export type CellGhostTypes =
  (typeof CellGhostTypes)[keyof typeof CellGhostTypes];

export declare const PointGhostTypes: {
  /**
   * The point is present on multiple processors
   */
  readonly DUPLICATEPOINT: 1;
  /**
   * The point is needed to maintain connectivity, but the data values should be
   * ignored
   */
  readonly HIDDENPOINT: 2;
};

export type PointGhostTypes =
  (typeof PointGhostTypes)[keyof typeof PointGhostTypes];

export declare const AttributeCopyOperations: {
  readonly COPYTUPLE: 0;
  readonly INTERPOLATE: 1;
  readonly PASSDATA: 2;
  /**
   * All of the above
   */
  readonly ALLCOPY: 3;
};

export type AttributeCopyOperations =
  (typeof AttributeCopyOperations)[keyof typeof AttributeCopyOperations];

export declare const ghostArrayName: string;

export declare const DesiredOutputPrecision: {
  /**
   * Use the point type that does not truncate any data
   */
  readonly DEFAULT: 0;
  /**
   * Use Float32Array
   */
  readonly SINGLE: 1;
  /**
   * Use Float64Array
   */
  readonly DOUBLE: 2;
};

export type DesiredOutputPrecision =
  (typeof DesiredOutputPrecision)[keyof typeof DesiredOutputPrecision];

declare const _default: {
  AttributeCopyOperations: typeof AttributeCopyOperations;
  AttributeLimitTypes: typeof AttributeLimitTypes;
  AttributeTypes: typeof AttributeTypes;
  CellGhostTypes: typeof CellGhostTypes;
  DesiredOutputPrecision: typeof DesiredOutputPrecision;
  PointGhostTypes: typeof PointGhostTypes;
  ghostArrayName: typeof ghostArrayName;
};
export default _default;
