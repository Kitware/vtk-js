// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

export function extractCellSizes(cellArray) {
  let currentIdx = 0;
  return cellArray.filter((value, index) => {
    if (index === currentIdx) {
      currentIdx += value + 1;
      return true;
    }
    return false;
  });
}

export function getNumberOfCells(cellArray) {
  return extractCellSizes(cellArray).length;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export default {
  extractCellSizes,
  getNumberOfCells,
};
