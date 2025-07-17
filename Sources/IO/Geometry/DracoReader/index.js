import macro from 'vtk.js/Sources/macros';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const { vtkErrorMacro } = macro;
let decoderModule = null;
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

/**
 * Set the Draco decoder module
 * @param {*} dracoDecoder
 */
async function setDracoDecoder(dracoDecoder) {
  decoderModule = await dracoDecoder({});
}

function getDracoDecoder() {
  return decoderModule;
}

// ----------------------------------------------------------------------------
// vtkDracoReader methods
// ----------------------------------------------------------------------------
function getDracoDataType(attributeType) {
  switch (attributeType) {
    case Float32Array:
      return decoderModule.DT_FLOAT32;
    case Int8Array:
      return decoderModule.DT_INT8;
    case Int16Array:
      return decoderModule.DT_INT16;
    case Int32Array:
      return decoderModule.DT_INT32;
    case Uint8Array:
      return decoderModule.DT_UINT8;
    case Uint16Array:
      return decoderModule.DT_UINT16;
    case Uint32Array:
      return decoderModule.DT_UINT32;
    default:
      return decoderModule.DT_FLOAT32;
  }
}

/**
 * Decode a single attribute
 * @param {*} decoder The Draco decoder
 * @param {*} dracoGeometry The geometry to decode
 * @param {*} attributeName The name of the attribute
 * @param {*} attributeType The type of the attribute
 * @param {*} attribute The attribute to decode
 * @returns object with name, array, itemSize
 */
function decodeAttribute(
  decoder,
  dracoGeometry,
  attributeName,
  attributeType,
  attribute
) {
  const numComponents = attribute.num_components();
  const numPoints = dracoGeometry.num_points();
  const numValues = numPoints * numComponents;

  const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
  const dataType = getDracoDataType(attributeType);

  const ptr = decoderModule._malloc(byteLength);
  decoder.GetAttributeDataArrayForAllPoints(
    dracoGeometry,
    attribute,
    dataType,
    byteLength,
    ptr
  );

  // eslint-disable-next-line new-cap
  const array = new attributeType(
    decoderModule.HEAPF32.buffer,
    ptr,
    numValues
  ).slice();

  decoderModule._free(ptr);

  return {
    name: attributeName,
    array,
    itemSize: numComponents,
  };
}

/**
 * Decode the indices of the geometry
 * @param {*} decoder The Draco decoder
 * @param {*} dracoGeometry The geometry to decode
 * @returns The indices array of the geometry
 */
function decodeIndices(decoder, dracoGeometry) {
  const numFaces = dracoGeometry.num_faces();
  const numIndices = numFaces * 3;
  const byteLength = numIndices * 4;

  const ptr = decoderModule._malloc(byteLength);
  decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
  const indices = new Uint32Array(
    decoderModule.HEAPF32.buffer,
    ptr,
    numIndices
  ).slice();
  decoderModule._free(ptr);
  return indices;
}

/**
 * Get the polyData from the Draco geometry
 * @param {*} decoder The Draco decoder
 * @param {*} dracoGeometry The geometry to decode
 * @returns {vtkPolyData} The polyData of the geometry
 */
function getPolyDataFromDracoGeometry(decoder, dracoGeometry) {
  const indices = decodeIndices(decoder, dracoGeometry);
  const nCells = indices.length - 2;

  const cells = vtkCellArray.newInstance();
  cells.allocate((4 * indices.length) / 3);
  for (let cellId = 0; cellId < nCells; cellId += 3) {
    const cell = indices.slice(cellId, cellId + 3);
    cells.insertNextCell(cell);
  }

  const polyData = vtkPolyData.newInstance({ polys: cells });

  // Look for attributes
  const attributeIDs = {
    points: 'POSITION',
    normals: 'NORMAL',
    scalars: 'COLOR',
    tcoords: 'TEX_COORD',
  };

  Object.keys(attributeIDs).forEach((attributeName) => {
    const attributeType = Float32Array;

    const attributeID = decoder.GetAttributeId(
      dracoGeometry,
      decoderModule[attributeIDs[attributeName]]
    );

    if (attributeID === -1) return;

    const attribute = decoder.GetAttribute(dracoGeometry, attributeID);

    const attributeResult = decodeAttribute(
      decoder,
      dracoGeometry,
      attributeName,
      attributeType,
      attribute
    );

    const pointData = polyData.getPointData();
    switch (attributeName) {
      case 'points':
        polyData
          .getPoints()
          .setData(attributeResult.array, attributeResult.itemSize);
        break;
      case 'normals':
        pointData.setNormals(
          vtkDataArray.newInstance({
            numberOfComponents: attributeResult.itemSize,
            values: attributeResult.array,
            name: 'Normals',
          })
        );
        break;
      case 'scalars':
        pointData.setScalars(
          vtkDataArray.newInstance({
            numberOfComponents: attributeResult.itemSize,
            values: attributeResult.array,
            name: 'Scalars',
          })
        );
        break;
      case 'tcoords':
        pointData.setTCoords(
          vtkDataArray.newInstance({
            numberOfComponents: attributeResult.itemSize,
            values: attributeResult.array,
            name: 'TCoords',
          })
        );
        break;
      default:
        break;
    }
  });

  // we will generate normals if they're missing
  const hasNormals = polyData.getPointData().getNormals();
  if (!hasNormals) {
    const pdn = vtkPolyDataNormals.newInstance();
    pdn.setInputData(polyData);
    pdn.setComputePointNormals(true);
    return pdn.getOutputData();
  }

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

    const byteArray = new Int8Array(content);

    const decoder = new decoderModule.Decoder();
    const buffer = new decoderModule.DecoderBuffer();
    buffer.Init(byteArray, byteArray.length);

    const geometryType = decoder.GetEncodedGeometryType(buffer);
    let dracoGeometry;
    if (geometryType === decoderModule.TRIANGULAR_MESH) {
      dracoGeometry = new decoderModule.Mesh();
      const status = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
      if (!status.ok()) {
        vtkErrorMacro(`Could not decode Draco file: ${status.error_msg()}`);
        return;
      }
    } else {
      vtkErrorMacro('Wrong geometry type, expected mesh, got point cloud.');
      return;
    }
    const polyData = getPolyDataFromDracoGeometry(decoder, dracoGeometry);
    decoderModule.destroy(dracoGeometry);
    decoderModule.destroy(buffer);
    decoderModule.destroy(decoder);
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
