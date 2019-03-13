import builder from 'xmlbuilder';

import macro from 'vtk.js/Sources/macro';
import { FormatTypes } from 'vtk.js/Sources/IO/XML/XMLWriter/Constants';

// ----------------------------------------------------------------------------
// vtkXMLWriter methods
// ----------------------------------------------------------------------------

function vtkXMLWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLWriter');

  // Can be overriden in subclass
  publicAPI.create = (dataObject) =>
    builder
      .create('VTKFile')
      .att('type', model.dataType)
      .att('version', '0.1')
      .att('byte_order', 'LittleEndian')
      .att('header_type', 'UInt32')
      .att(
        'compressor',
        model.format === FormatTypes.ascii ? '' : 'vtkZLibDataCompressor'
      );

  publicAPI.write = (object) => publicAPI.create(object).end({ pretty: true });

  publicAPI.requestData = (inData, outData) => {
    model.file = publicAPI.write(inData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // file: null,
  format: FormatTypes.ascii,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['format']);
  macro.get(publicAPI, model, ['file']);
  macro.algo(publicAPI, model, 1, 0);

  // vtkXMLWriter methods
  vtkXMLWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
