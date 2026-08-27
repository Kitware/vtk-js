import { vtkObject } from '../../../interfaces';

/**
 *
 */
export interface ICellTypesInitialValues {
  size?: number;
  maxId?: number;
  extend?: number;
  typeArray?: Uint8Array;
  locationArray?: Uint32Array;
}

export interface vtkCellTypes extends vtkObject {
  /**
   * Allocate memory for this array. Delete old storage only if necessary.
   * @param {Number} [sz] (default: 512)
   * @param {Number} [ext] (default: 1000)
   */
  allocate(sz?: number, ext?: number): void;

  /**
   * Standard DeepCopy method. Since this object contains no reference
   * to other objects, there is no ShallowCopy.
   * @param {vtkCellTypes} src
   */
  deepCopy(src: vtkCellTypes): void;

  /**
   * Delete cell by setting it to the empty cell type.
   * @param {Number} cellId
   */
  deleteCell(cellId: number): void;

  /**
   * Return the location of the cell in the associated vtkCellArray.
   * @param {Number} cellId
   */
  getCellLocation(cellId: number): number;

  /**
   * Return the type of cell.
   * @param {Number} cellId
   */
  getCellType(cellId: number): number;

  /**
   * Get the growth increment of the arrays.
   */
  getExtend(): number;

  /**
   * Get the array of cell locations.
   */
  getLocationArray(): number[];

  /**
   * Get the array of cell locations without copying it.
   */
  getLocationArrayByReference(): Uint32Array;

  /**
   * Get the maximum index inserted so far.
   */
  getMaxId(): number;

  /**
   * Return the number of types in the list.
   */
  getNumberOfTypes(): number;

  /**
   * Get the allocated size of the data.
   */
  getSize(): number;

  /**
   * Get the array of cell types.
   */
  getTypeArray(): number[];

  /**
   * Get the array of cell types without copying it.
   */
  getTypeArrayByReference(): Uint8Array;

  /**
   * Add a cell at the specified id.
   * @param {Number} cellId
   * @param {Number} type
   * @param {Number} loc
   */
  insertCell(cellId: number, type: number, loc: number): void;

  /**
   * Add a cell to the object in the next available slot.
   * Returns the id of the inserted cell.
   * @param {Number} type
   * @param {Number} loc
   */
  insertNextCell(type: number, loc: number): number;

  /**
   * Add the type specified to the end of the list, with a location of -1.
   * Returns the id of the inserted cell.
   * @param {Number} type
   */
  insertNextType(type: number): number;

  /**
   * Return true if the type specified is contained in the list.
   * @param {Number} type
   */
  isType(type: number): boolean;

  /**
   * Initialize the object without releasing memory.
   */
  reset(): void;

  /**
   * Specify a group of cell types.
   * @param {Number} ncells
   * @param {Uint8Array} cellTypes
   * @param {Uint32Array} cellLocations
   */
  setCellTypes(
    ncells: number,
    cellTypes: Uint8Array,
    cellLocations: Uint32Array
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCellTypes characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICellTypesInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICellTypesInitialValues
): void;

/**
 * Method used to create a new instance of vtkCellTypes.
 * @param {ICellTypesInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICellTypesInitialValues
): vtkCellTypes;

/**
 * Given an int (as defined in vtkCellType.h) identifier for a class
 * return its classname.
 * @static
 * @param {Number} typeId
 */
declare function getClassNameFromTypeId(typeId: number): string;

/**
 * Given a data object classname, return its int identifier (as
 * defined in vtkCellType.h)
 * @static
 * @param {String} cellTypeString
 */
declare function getTypeIdFromClassName(cellTypeString: string): number;

/**
 * Fast check to determine if a cell type represents a linear or nonlinear cell.
 * @static
 * @param {Number} type
 */
declare function isLinear(type: number): boolean;

/**
 * Returns true for cell types that are made of several sub cells
 * (triangle strips, poly lines and poly vertices).
 * @static
 * @param {Number} cellType
 */
declare function hasSubCells(cellType: number): boolean;

export declare const STATIC: {
  getClassNameFromTypeId: typeof getClassNameFromTypeId;
  getTypeIdFromClassName: typeof getTypeIdFromClassName;
  isLinear: typeof isLinear;
  hasSubCells: typeof hasSubCells;
};

/**
 * vtkCellTypes provides a mapping from cell ids to cell types and to the
 * location of the cell definition in the associated vtkCellArray.
 */
export declare const vtkCellTypes: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  getClassNameFromTypeId: typeof getClassNameFromTypeId;
  getTypeIdFromClassName: typeof getTypeIdFromClassName;
  isLinear: typeof isLinear;
  hasSubCells: typeof hasSubCells;
};
export default vtkCellTypes;
