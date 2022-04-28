import macro from 'vtk.js/Sources/macros';
import vtkXMLWriter from 'vtk.js/Sources/IO/XML/XMLWriter';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkXMLImageDataWriter methods
// ----------------------------------------------------------------------------

function vtkXMLImageDataWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLImageDataWriter');

  // Capture "parentClass" api for internal use
  const superClass = { ...publicAPI };

  publicAPI.create = (dataObject) => {
    const parent = superClass.create(dataObject);

    const imageData = parent.ele('ImageData', {
      WholeExtent: dataObject.getExtent().join(' '),
      Origin: dataObject.getOrigin().join(' '),
      Spacing: dataObject.getSpacing().join(' '),
      Direction: dataObject.getDirection().join(' '),
    });

    const piece = imageData.ele('Piece', {
      Extent: dataObject.getExtent().join(' '),
    });

    publicAPI.processDataSetAttributes(
      piece,
      'PointData',
      dataObject.getPointData()
    );

    publicAPI.processDataSetAttributes(
      piece,
      'CellData',
      dataObject.getCellData()
    );

    return parent;
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
  vtkXMLWriter.extend(publicAPI, model, initialValues);
  vtkXMLImageDataWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkXMLImageDataWriter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
