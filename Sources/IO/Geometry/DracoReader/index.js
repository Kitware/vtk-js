import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const { vtkErrorMacro } = macro;
let decoderModule = {};

// ----------------------------------------------------------------------------
// static methods
// ----------------------------------------------------------------------------

/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 * @return {Promise<boolean>}
 */
function setWasmBinary(url, binaryName) {
  const dracoDecoderType = {};

  return new Promise((resolve, reject) => {
    dracoDecoderType.wasmBinaryFile = binaryName;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      if (xhr.status === 200) {
        dracoDecoderType.wasmBinary = xhr.response;
        // Use Promise.resolve to be compatible with versions before Draco 1.4.0
        Promise.resolve(window.DracoDecoderModule(dracoDecoderType)).then(
          (module) => {
            decoderModule = module;
            resolve(true);
          },
          reject
        );
      } else {
        reject(Error(`WASM binary could not be loaded: ${xhr.statusText}`));
      }
    };
    xhr.send(null);
  });
}

function setDracoDecoder(createDracoModule) {
  decoderModule = createDracoModule({});
}

function getDracoDecoder() {
  return decoderModule;
}

// ----------------------------------------------------------------------------
// vtkDracoReader methods
// ----------------------------------------------------------------------------

function decodeBuffer(buffer) {
  const byteArray = new Int8Array(buffer);
  const decoder = new decoderModule.Decoder();
  const decoderBuffer = new decoderModule.DecoderBuffer();
  decoderBuffer.Init(byteArray, byteArray.length);

  const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);

  let dracoGeometry;
  if (geometryType === decoderModule.TRIANGULAR_MESH) {
    dracoGeometry = new decoderModule.Mesh();
    const status = decoder.DecodeBufferToMesh(decoderBuffer, dracoGeometry);
    if (!status.ok()) {
      vtkErrorMacro(`Could not decode Draco file: ${status.error_msg()}`);
    }
  } else {
    vtkErrorMacro('Wrong geometry type, expected mesh, got point cloud.');
  }

  decoderModule.destroy(decoderBuffer);
  decoderModule.destroy(decoder);
  return dracoGeometry;
}

function getDracoAttributeAsFloat32Array(dracoGeometry, attributeId) {
  const decoder = new decoderModule.Decoder();
  const attribute = decoder.GetAttribute(dracoGeometry, attributeId);
  const numberOfComponents = attribute.num_components();
  const numberOfPoints = dracoGeometry.num_points();

  const attributeData = new decoderModule.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(
    dracoGeometry,
    attribute,
    attributeData
  );

  let i = numberOfPoints * numberOfComponents;
  const attributeArray = new Float32Array(i);
  while (i--) {
    attributeArray[i] = attributeData.GetValue(i);
  }

  return attributeArray;
}

function getPolyDataFromDracoGeometry(dracoGeometry) {
  const decoder = new decoderModule.Decoder();

  // Get position attribute ID
  const positionAttributeId = decoder.GetAttributeId(
    dracoGeometry,
    decoderModule.POSITION
  );

  if (positionAttributeId === -1) {
    console.error('No position attribute found in the decoded model.');
    decoderModule.destroy(decoder);
    decoderModule.destroy(dracoGeometry);
    return null;
  }

  const positionArray = getDracoAttributeAsFloat32Array(
    dracoGeometry,
    positionAttributeId,
    decoderModule
  );

  // Read indices
  let i = dracoGeometry.num_faces();
  const indices = new Uint32Array(i * 4);
  const indicesArray = new decoderModule.DracoInt32Array();
  while (i--) {
    decoder.GetFaceFromMesh(dracoGeometry, i, indicesArray);
    const index = i * 4;
    indices[index] = 3;
    indices[index + 1] = indicesArray.GetValue(0);
    indices[index + 2] = indicesArray.GetValue(1);
    indices[index + 3] = indicesArray.GetValue(2);
  }

  // Create polyData and add positions and indinces
  const cellArray = vtkCellArray.newInstance({ values: indices });
  const polyData = vtkPolyData.newInstance({ polys: cellArray });
  polyData.getPoints().setData(positionArray);

  // Look for other attributes
  const pointData = polyData.getPointData();

  // Normals
  const normalAttributeId = decoder.GetAttributeId(
    dracoGeometry,
    decoderModule.NORMAL
  );

  if (normalAttributeId !== -1) {
    const normalArray = getDracoAttributeAsFloat32Array(
      dracoGeometry,
      decoderModule.NORMAL,
      decoderModule
    );

    const normals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: normalArray,
      name: 'Normals',
    });
    pointData.setNormals(normals);
  }

  // Texture coordinates
  const texCoordAttributeId = decoder.GetAttributeId(
    dracoGeometry,
    decoderModule.TEX_COORD
  );

  if (texCoordAttributeId !== -1) {
    const texCoordArray = getDracoAttributeAsFloat32Array(
      dracoGeometry,
      texCoordAttributeId,
      decoderModule
    );

    const texCoords = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: texCoordArray,
      name: 'TCoords',
    });
    pointData.setTCoords(texCoords);
  }

  // Scalars
  const colorAttributeId = decoder.GetAttributeId(
    dracoGeometry,
    decoderModule.COLOR
  );

  if (colorAttributeId !== -1) {
    const colorArray = getDracoAttributeAsFloat32Array(
      dracoGeometry,
      colorAttributeId,
      decoderModule
    );

    const scalars = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: colorArray,
      name: 'Scalars',
    });

    pointData.setScalars(scalars);
  }

  decoderModule.destroy(decoder);
  return polyData;
}

function vtkDracoReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDracoReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    if (option.binary) {
      return model.dataAccessHelper.fetchBinary(url, {
        compression,
        progressCallback,
      });
    }
    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({
      progressCallback: option.progressCallback,
      binary: !!option.binary,
    });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    publicAPI.parseAsArrayBuffer(content);
  };

  publicAPI.parseAsArrayBuffer = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;
    const dracoGeometry = decodeBuffer(content);
    const polyData = getPolyDataFromDracoGeometry(dracoGeometry);
    decoderModule.destroy(dracoGeometry);
    model.output[0] = polyData;
  };

  publicAPI.requestData = () => {
    publicAPI.parse(model.parseData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);

  // vtkDracoReader methods
  vtkDracoReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDracoReader');

// ----------------------------------------------------------------------------

export default {
  extend,
  newInstance,
  setDracoDecoder,
  setWasmBinary,
  getDracoDecoder,
};
