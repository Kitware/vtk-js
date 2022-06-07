import vtkXMLReader from 'vtk.js/Sources/IO/XML/XMLReader';
import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

// ----------------------------------------------------------------------------
// vtkXMLImageDataReader methods
// ----------------------------------------------------------------------------

function vtkXMLImageDataReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLImageDataReader');

  publicAPI.parseXML = (rootElem, type, compressor, byteOrder, headerType) => {
    const imageDataElem = rootElem.getElementsByTagName(model.dataType)[0];
    const origin = imageDataElem
      .getAttribute('Origin')
      .split(' ')
      .map((t) => Number(t));
    const spacing = imageDataElem
      .getAttribute('Spacing')
      .split(' ')
      .map((t) => Number(t));
    const direction = imageDataElem
      .getAttribute('Direction')
      ?.split(' ')
      .map((t) => Number(t));
    const pieces = imageDataElem.getElementsByTagName('Piece');
    const nbPieces = pieces.length;

    for (let outputIndex = 0; outputIndex < nbPieces; outputIndex++) {
      // Create image data
      const piece = pieces[outputIndex];
      const extent = piece
        .getAttribute('Extent')
        .split(' ')
        .map((t) => Number(t));
      const imageData = vtkImageData.newInstance({
        origin,
        spacing,
        direction,
        extent,
      });

      // Fill data
      vtkXMLReader.processFieldData(
        imageData.getNumberOfPoints(),
        piece.getElementsByTagName('PointData')[0],
        imageData.getPointData(),
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );

      vtkXMLReader.processFieldData(
        imageData.getNumberOfCells(),
        piece.getElementsByTagName('CellData')[0],
        imageData.getCellData(),
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );

      // Add new output
      model.output[outputIndex] = imageData;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  dataType: 'ImageData',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkXMLReader.extend(publicAPI, model, initialValues);
  vtkXMLImageDataReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkXMLImageDataReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
