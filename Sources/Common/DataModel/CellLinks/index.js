import macro from 'vtk.js/Sources/macros';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
export const InitLink = {
  ncells: 0,
  cells: null,
};

function resize(model, sz) {
  let newSize = sz;
  if (sz >= model.array.length) {
    newSize += model.array.length;
  }

  while (newSize > model.array.length)
    model.array.push({
      ncells: 0,
      cells: null,
    });
  model.array.length = newSize;
}

// ----------------------------------------------------------------------------
// vtkCellLinks methods
// ----------------------------------------------------------------------------

function vtkCellLinks(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCellLinks');

  /**
   * Build the link list array. All subclasses of vtkAbstractCellLinks
   * must support this method.
   */
  publicAPI.buildLinks = (data) => {
    const numPts = data.getPoints().getNumberOfPoints();
    const numCells = data.getNumberOfCells();

    // fill out lists with number of references to cells
    const linkLoc = new Uint32Array(numPts);

    // Use fast path if polydata
    if (data.isA('vtkPolyData')) {
      // traverse data to determine number of uses of each point
      for (let cellId = 0; cellId < numCells; ++cellId) {
        const { cellPointIds } = data.getCellPoints(cellId);
        cellPointIds.forEach((cellPointId) => {
          publicAPI.incrementLinkCount(cellPointId);
        });
      }

      // now allocate storage for the links
      publicAPI.allocateLinks(numPts);
      model.maxId = numPts - 1;

      for (let cellId = 0; cellId < numCells; ++cellId) {
        const { cellPointIds } = data.getCellPoints(cellId);
        cellPointIds.forEach((cellPointId) => {
          publicAPI.insertCellReference(
            cellPointId,
            linkLoc[cellPointId]++,
            cellId
          );
        });
      }
    } // any other type of dataset
    else {
      // traverse data to determine number of uses of each point
      for (let cellId = 0; cellId < numCells; cellId++) {
        // TODO: Currently not supported: const cell = data.getCell(cellId);
        const cell = vtkCell.newInstance();
        cell.getPointsIds().forEach((cellPointId) => {
          publicAPI.incrementLinkCount(cellPointId);
        });
      }

      // now allocate storage for the links
      publicAPI.allocateLinks(numPts);
      model.maxId = numPts - 1;

      for (let cellId = 0; cellId < numCells; ++cellId) {
        // TODO: Currently not supported: const cell = data.getCell(cellId);
        const cell = vtkCell.newInstance();
        cell.getPointsIds().forEach((cellPointId) => {
          publicAPI.insertCellReference(
            cellPointId,
            linkLoc[cellPointId]++,
            cellId
          );
        });
      }
    } // end else
  };

  /**
   * Build the link list array with a provided connectivity array.
   */
  // publicAPI.buildLinks = (data, connectivity) => {};

  /**
   * Allocate the specified number of links (i.e., number of points) that
   * will be built.
   */
  publicAPI.allocate = (numLinks, ext = 1000) => {
    model.array = Array(numLinks)
      .fill()
      .map(() => ({
        ncells: 0,
        cells: null,
      }));
    model.extend = ext;
    model.maxId = -1;
  };

  publicAPI.initialize = () => {
    model.array = null;
  };

  /**
   * Get a link structure given a point id.
   */
  publicAPI.getLink = (ptId) => model.array[ptId];

  /**
   * Get the number of cells using the point specified by ptId.
   */
  publicAPI.getNcells = (ptId) => model.array[ptId].ncells;

  /**
   * Return a list of cell ids using the point.
   */
  publicAPI.getCells = (ptId) => model.array[ptId].cells;

  /**
   * Insert a new point into the cell-links data structure. The size parameter
   * is the initial size of the list.
   */
  publicAPI.insertNextPoint = (numLinks) => {
    model.array.push({ ncells: numLinks, cells: Array(numLinks) });
    ++model.maxId;
  };

  /**
   * Insert a cell id into the list of cells (at the end) using the cell id
   * provided. (Make sure to extend the link list (if necessary) using the
   * method resizeCellList().)
   */
  publicAPI.insertNextCellReference = (ptId, cellId) => {
    model.array[ptId].cells[model.array[ptId].ncells++] = cellId;
  };

  /**
   * Delete point (and storage) by destroying links to using cells.
   */
  publicAPI.deletePoint = (ptId) => {
    model.array[ptId].ncells = 0;
    model.array[ptId].cells = null;
  };

  /**
   * Delete the reference to the cell (cellId) from the point (ptId). This
   * removes the reference to the cellId from the cell list, but does not
   * resize the list (recover memory with resizeCellList(), if necessary).
   */
  publicAPI.removeCellReference = (cellId, ptId) => {
    model.array[ptId].cells = model.array[ptId].cells.filter(
      (cell) => cell !== cellId
    );
    model.array[ptId].ncells = model.array[ptId].cells.length;
  };

  /**
   * Add the reference to the cell (cellId) from the point (ptId). This
   * adds a reference to the cellId from the cell list, but does not resize
   * the list (extend memory with resizeCellList(), if necessary).
   */
  publicAPI.addCellReference = (cellId, ptId) => {
    model.array[ptId].cells[model.array[ptId].ncells++] = cellId;
  };

  /**
   * Change the length of a point's link list (i.e., list of cells using a
   * point) by the size specified.
   */
  publicAPI.resizeCellList = (ptId, size) => {
    model.array[ptId].cells.length = size;
  };

  /**
   * Reclaim any unused memory.
   */
  publicAPI.squeeze = () => {
    resize(model, model.maxId + 1);
  };

  /**
   * Reset to a state of no entries without freeing the memory.
   */
  publicAPI.reset = () => {
    model.maxId = -1;
  };

  /**
   * Standard DeepCopy method.  Since this object contains no reference
   * to other objects, there is no ShallowCopy.
   */
  publicAPI.deepCopy = (src) => {
    model.array = [...src.array];
    model.extend = src.extend;
    model.maxId = src.maxId;
  };

  /**
   * Increment the count of the number of cells using the point.
   */
  publicAPI.incrementLinkCount = (ptId) => {
    ++model.array[ptId].ncells;
  };

  publicAPI.allocateLinks = (n) => {
    for (let i = 0; i < n; ++i) {
      model.array[i].cells = new Array(model.array[i].ncells);
    }
  };

  /**
   * Insert a cell id into the list of cells using the point.
   */
  publicAPI.insertCellReference = (ptId, pos, cellId) => {
    model.array[ptId].cells[pos] = cellId;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  array: null, // pointer to data
  maxId: 0, // maximum index inserted thus far
  extend: 0, // grow array by this point
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  vtkCellLinks(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCellLinks');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
