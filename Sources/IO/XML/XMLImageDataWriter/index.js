import macro from 'vtk.js/Sources/macro';
import vtkXMLWriter from 'vtk.js/Sources/IO/XML/XMLWriter';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

export const TYPED_ARRAY = {
  Int8Array: 'Int8',
  Uint8Array: 'UInt8',
  Int16Array: 'Int16',
  Uint16Array: 'UInt16',
  Int32Array: 'Int32',
  Uint32Array: 'UInt32',
  Float32Array: 'Float32',
  Float64Array: 'Float64',
};

// ----------------------------------------------------------------------------
// vtkXMLImageDataWriter methods
// ----------------------------------------------------------------------------

function vtkXMLImageDataWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLImageDataWriter');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.create = (dataObject) => {
    const parent = superClass.create(dataObject);

    const imageData = parent.ele('ImageData', {
      WholeExtent: dataObject.getExtent().join(' '),
      Origin: dataObject.getOrigin().join(' '),
      Spacing: dataObject.getSpacing().join(' '),
    });

    const piece = imageData.ele('Piece', {
      Extent: dataObject.getExtent().join(' '),
    });

    const pointData = piece.ele('PointData', {
      Scalars: dataObject
        .getPointData()
        .getScalars()
        .getName(),
    });

    for (let i = 0; i < dataObject.getPointData().getNumberOfArrays(); ++i) {
      const scalars = dataObject.getPointData().getArrayByIndex(i);

      pointData.ele(
        'DataArray',
        {
          type: TYPED_ARRAY[scalars.getDataType()],
          Name: scalars.getName(),
          format: publicAPI.getFormat(),
          RangeMin: scalars.getRange()[0],
          RangeMax: scalars.getRange()[1],
          NumberOfComponents: scalars.getNumberOfComponents(),
        },
        vtkXMLWriter.processDataArray(
          scalars,
          publicAPI.getFormat(),
          publicAPI.getBlockSize()
        )
      );
    }

    piece.ele('CellData');

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
