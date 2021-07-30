import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkXMLReader from 'vtk.js/Sources/IO/XML/XMLReader';

// ----------------------------------------------------------------------------
// Global method
// ----------------------------------------------------------------------------

function handleArray(
  polydata,
  cellType,
  piece,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const size = Number(piece.getAttribute(`NumberOf${cellType}`));
  if (size > 0) {
    const dataArrayElem = piece
      .getElementsByTagName(cellType)[0]
      .getElementsByTagName('DataArray')[0];
    const { values, numberOfComponents } = vtkXMLReader.processDataArray(
      size,
      dataArrayElem,
      compressor,
      byteOrder,
      headerType,
      binaryBuffer
    );
    polydata[`get${cellType}`]().setData(values, numberOfComponents);
  }
  return size;
}

// ----------------------------------------------------------------------------

function handleCells(
  polydata,
  cellType,
  piece,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const size = Number(piece.getAttribute(`NumberOf${cellType}`));
  if (size > 0) {
    const values = vtkXMLReader.processCells(
      size,
      piece.getElementsByTagName(cellType)[0],
      compressor,
      byteOrder,
      headerType,
      binaryBuffer
    );
    polydata[`get${cellType}`]().setData(values);
  }
  return size;
}

// ----------------------------------------------------------------------------
// vtkXMLPolyDataReader methods
// ----------------------------------------------------------------------------

function vtkXMLPolyDataReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLPolyDataReader');

  publicAPI.parseXML = (rootElem, type, compressor, byteOrder, headerType) => {
    const datasetElem = rootElem.getElementsByTagName(model.dataType)[0];
    const pieces = datasetElem.getElementsByTagName('Piece');
    const nbPieces = pieces.length;

    for (let outputIndex = 0; outputIndex < nbPieces; outputIndex++) {
      // Create dataset
      const polydata = vtkPolyData.newInstance();
      const piece = pieces[outputIndex];

      // Points
      const nbPoints = handleArray(
        polydata,
        'Points',
        piece,
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );

      // Cells
      let nbCells = 0;
      ['Verts', 'Lines', 'Strips', 'Polys'].forEach((cellType) => {
        nbCells += handleCells(
          polydata,
          cellType,
          piece,
          compressor,
          byteOrder,
          headerType,
          model.binaryBuffer
        );
      });

      // Fill data
      vtkXMLReader.processFieldData(
        nbPoints,
        piece.getElementsByTagName('PointData')[0],
        polydata.getPointData(),
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );
      vtkXMLReader.processFieldData(
        nbCells,
        piece.getElementsByTagName('CellData')[0],
        polydata.getCellData(),
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );

      // Add new output
      model.output[outputIndex] = polydata;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  dataType: 'PolyData',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkXMLReader.extend(publicAPI, model, initialValues);
  vtkXMLPolyDataReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkXMLPolyDataReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
