import macro from 'vtk.js/Sources/macros';
import {
  CellType,
  CellTypesStrings,
} from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

/**
 * Given an int (as defined in vtkCellType.h) identifier for a class
 * return it's classname.
 */
function getClassNameFromTypeId(typeId) {
  return typeId < CellTypesStrings.length
    ? CellTypesStrings[typeId]
    : 'UnknownClass';
}

/**
 * Given a data object classname, return it's int identified (as
 * defined in vtkCellType.h)
 */
function getTypeIdFromClassName(cellTypeString) {
  return CellTypesStrings.findIndex(cellTypeString);
}

/**
 * This convenience method is a fast check to determine if a cell type
 * represents a linear or nonlinear cell.  This is generally much more
 * efficient than getting the appropriate vtkCell and checking its IsLinear
 * method.
 */
function isLinear(type) {
  return (
    type < CellType.VTK_QUADRATIC_EDGE ||
    type === CellType.VTK_CONVEX_POINT_SET ||
    type === CellType.VTK_POLYHEDRON
  );
}

function hasSubCells(cellType) {
  return (
    cellType === CellType.VTK_TRIANGLE_STRIP ||
    cellType === CellType.VTK_POLY_LINE ||
    cellType === CellType.VTK_POLY_VERTEX
  );
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  getClassNameFromTypeId,
  getTypeIdFromClassName,
  isLinear,
  hasSubCells,
};

// ----------------------------------------------------------------------------
// vtkCellTypes methods
// ----------------------------------------------------------------------------

function vtkCellTypes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCellTypes');

  /**
   * Allocate memory for this array. Delete old storage only if necessary.
   */
  publicAPI.allocate = (sz = 512, ext = 1000) => {
    model.size = sz > 0 ? sz : 1;
    model.extend = ext > 0 ? ext : 1;
    model.maxId = -1;
    model.typeArray = new Uint8Array(sz);
    model.locationArray = new Uint32Array(sz);
  };

  /**
   * Add a cell at specified id.
   */
  publicAPI.insertCell = (cellId, type, loc) => {
    model.typeArray[cellId] = type;
    model.locationArray[cellId] = loc;

    if (cellId > model.maxId) {
      model.maxId = cellId;
    }
  };

  /**
   * Add a cell to the object in the next available slot.
   */
  publicAPI.insertNextCell = (type, loc) => {
    publicAPI.insertCell(++model.maxId, type, loc);
    return model.maxId;
  };

  /**
   * Specify a group of cell types. This version is provided to maintain
   * backwards compatibility and does a copy of the cellLocations
   */
  publicAPI.setCellTypes = (ncells, cellTypes, cellLocations) => {
    model.size = ncells;

    model.typeArray = cellTypes;
    model.locationArray = cellLocations;

    model.maxId = ncells - 1;
  };

  /**
   * Return the location of the cell in the associated vtkCellArray.
   */
  publicAPI.getCellLocation = (cellId) => model.locationArray[cellId];

  /**
   * Delete cell by setting to nullptr cell type.
   */
  publicAPI.deleteCell = (cellId) => {
    model.typeArray[cellId] = CellType.VTK_EMPTY_CELL;
  };

  /**
   * Return the number of types in the list.
   */
  publicAPI.getNumberOfTypes = () => model.maxId + 1;

  /**
   * Return true if type specified is contained in list; false otherwise.
   */
  publicAPI.isType = (type) => {
    const numTypes = publicAPI.getNumberOfTypes();

    for (let i = 0; i < numTypes; ++i) {
      if (type === publicAPI.getCellType(i)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add the type specified to the end of the list. Range checking is performed.
   */
  publicAPI.insertNextType = (type) => publicAPI.insertNextCell(type, -1);

  /**
   * Return the type of cell.
   */
  publicAPI.getCellType = (cellId) => model.typeArray[cellId];

  /**
   * Reclaim any extra memory.
   */
  // TODO: publicAPI.squeeze = () =>  {};

  /**
   * Initialize object without releasing memory.
   */
  publicAPI.reset = () => {
    model.maxId = -1;
  };

  /**
   * Standard DeepCopy method.  Since this object contains no reference
   * to other objects, there is no ShallowCopy.
   */
  publicAPI.deepCopy = (src) => {
    publicAPI.allocate(src.getSize(), src.getExtend());
    model.typeArray.set(src.getTypeArray());
    model.locationArray.set(src.getLocationArray());
    model.maxId = src.getMaxId();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // typeArray: null, // pointer to types array
  // locationArray: null;   // pointer to array of offsets
  size: 0, // allocated size of data
  maxId: -1, // maximum index inserted thus far
  extend: 1000, // grow array by this point
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['size', 'maxId', 'extend']);
  macro.getArray(publicAPI, model, ['typeArray', 'locationArray']);

  vtkCellTypes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCellTypes');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
