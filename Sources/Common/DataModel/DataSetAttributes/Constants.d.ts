export namespace AttributeTypes {
    export const SCALARS: number;
    export const VECTORS: number;
    export const NORMALS: number;
    export const TCOORDS: number;
    export const TENSORS: number;
    export const GLOBALIDS: number;
    export const PEDIGREEIDS: number;
    export const EDGEFLAG: number;
    export const NUM_ATTRIBUTES: number;
}
export namespace AttributeLimitTypes {
    export const MAX: number;
    export const EXACT: number;
    export const NOLIMIT: number;
}
export namespace CellGhostTypes {
    export const DUPLICATECELL: number;
    export const HIGHCONNECTIVITYCELL: number;
    export const LOWCONNECTIVITYCELL: number;
    export const REFINEDCELL: number;
    export const EXTERIORCELL: number;
    export const HIDDENCELL: number;
}
export namespace PointGhostTypes {
    export const DUPLICATEPOINT: number;
    export const HIDDENPOINT: number;
}
export namespace AttributeCopyOperations {
    export const COPYTUPLE: number;
    export const INTERPOLATE: number;
    export const PASSDATA: number;
    export const ALLCOPY: number;
}
export const ghostArrayName: "vtkGhostType";
export namespace DesiredOutputPrecision {
    export const DEFAULT: number;
    export const SINGLE: number;
    export const DOUBLE: number;
}
declare namespace _default {
    export { AttributeCopyOperations };
    export { AttributeLimitTypes };
    export { AttributeTypes };
    export { CellGhostTypes };
    export { DesiredOutputPrecision };
    export { PointGhostTypes };
    export { ghostArrayName };
}
export default _default;
