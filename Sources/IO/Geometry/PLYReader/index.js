import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const PLYFormats = {
  ASCII: 'ascii',
  BINARY_BIG_ENDIAN: 'binary_big_endian',
  BINARY_LITTLE_ENDIAN: 'binary_little_endian',
};

const mapping = {
  diffuse_red: 'red',
  diffuse_green: 'green',
  diffuse_blue: 'blue',
};

const patterns = {
  patternHeader: /ply([\s\S]*)end_header\r?\n/,
  patternBody: /end_header\s([\s\S]*)$/,
};

function parseHeader(data) {
  let headerText = '';
  let headerLength = 0;
  const result = patterns.patternHeader.exec(data);

  if (result !== null) {
    headerText = result[1];
    headerLength = result[0].length;
  }

  const header = {
    comments: [],
    elements: [],
    headerLength,
  };

  const lines = headerText.split('\n');
  let elem;
  let lineType;
  let lineValues;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.trim();

    if (line !== '') {
      let property;
      lineValues = line.split(/\s+/);
      lineType = lineValues.shift();
      line = lineValues.join(' ');

      switch (lineType) {
        case 'format':
          header.format = lineValues[0];
          header.version = lineValues[1];
          break;

        case 'comment':
          header.comments.push(line);
          break;

        case 'element':
          if (elem !== undefined) {
            header.elements.push(elem);
          }

          elem = {};
          elem.name = lineValues[0];
          elem.count = parseInt(lineValues[1], 10);
          elem.properties = [];
          break;

        case 'property':
          property = {
            type: lineValues[0],
          };

          if (property.type === 'list') {
            property.name = lineValues[3];
            property.countType = lineValues[1];
            property.itemType = lineValues[2];
          } else {
            property.name = lineValues[1];
          }

          if (property.name in mapping) {
            property.name = mapping[property.name];
          }
          elem.properties.push(property);
          break;

        case 'obj_info':
          header.objInfo = line;
          break;

        default:
          console.warn('unhandled', lineType, lineValues);
          break;
      }
    }
  }

  if (elem !== undefined) {
    header.elements.push(elem);
  }

  return header;
}

function postProcess(buffer, elements) {
  const vertElement = elements.find((element) => element.name === 'vertex');
  const faceElement = elements.find((element) => element.name === 'face');

  let nbVerts = 0;
  let nbFaces = 0;

  if (vertElement) {
    nbVerts = vertElement.count;
  }
  if (faceElement) {
    nbFaces = faceElement.count;
  }

  const pointValues = new Float32Array(nbVerts * 3);
  const colorArray = new Uint8Array(nbVerts * 3);
  const tcoordsArray = new Float32Array(nbVerts * 2);
  const normalsArray = new Float32Array(nbVerts * 3);

  const hasColor = buffer.colors.length > 0;
  const hasVertTCoords = buffer.uvs.length > 0;
  const hasNorms = buffer.normals.length > 0;
  const hasFaceTCoords = buffer.faceVertexUvs.length > 0;

  for (let vertIdx = 0; vertIdx < nbVerts; vertIdx++) {
    let a = vertIdx * 3 + 0;
    let b = vertIdx * 3 + 1;
    const c = vertIdx * 3 + 2;

    pointValues[a] = buffer.vertices[a];
    pointValues[b] = buffer.vertices[b];
    pointValues[c] = buffer.vertices[c];

    if (hasColor) {
      colorArray[a] = buffer.colors[a];
      colorArray[b] = buffer.colors[b];
      colorArray[c] = buffer.colors[c];
    }

    if (hasVertTCoords) {
      a = vertIdx * 2 + 0;
      b = vertIdx * 2 + 1;
      tcoordsArray[a] = buffer.uvs[a];
      tcoordsArray[b] = buffer.uvs[b];
    }

    if (hasNorms) {
      normalsArray[a] = buffer.normals[a];
      normalsArray[b] = buffer.normals[b];
      normalsArray[c] = buffer.normals[c];
    }
  }

  if (!hasVertTCoords && hasFaceTCoords) {
    // don't use array.shift, because buffer.indices will be used later
    let idxVerts = 0;
    let idxCoord = 0;
    for (let faceIdx = 0; faceIdx < nbFaces; ++faceIdx) {
      const nbFaceVerts = buffer.indices[idxVerts++];
      const texcoords = buffer.faceVertexUvs[idxCoord++];
      if (texcoords && nbFaceVerts * 2 === texcoords.length) {
        // grab the vertex index
        for (let vertIdx = 0; vertIdx < nbFaceVerts; ++vertIdx) {
          const vert = buffer.indices[idxVerts++];
          // new texture stored at the current face
          tcoordsArray[vert * 2 + 0] = texcoords[vertIdx * 2 + 0];
          tcoordsArray[vert * 2 + 1] = texcoords[vertIdx * 2 + 1];
        }
      } else {
        idxVerts += nbFaceVerts;
      }
    }
  }

  const polydata = vtkPolyData.newInstance();

  polydata.getPoints().setData(pointValues, 3);
  if (hasColor) {
    polydata.getPointData().setScalars(
      vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: colorArray,
        name: 'Scalars',
      })
    );
  }

  if (hasVertTCoords || hasFaceTCoords) {
    const da = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: tcoordsArray,
      name: 'TextureCoordinates',
    });
    const cpd = polydata.getPointData();
    cpd.addArray(da);
    cpd.setActiveTCoords(da.getName());
  }

  if (hasNorms) {
    polydata.getPointData().setNormals(
      vtkDataArray.newInstance({
        numberOfComponents: 3,
        name: 'Normals',
        values: normalsArray,
      })
    );
  }

  polydata.getPolys().setData(Uint32Array.from(buffer.indices));

  return polydata;
}

function parseNumber(n, type) {
  let r;
  switch (type) {
    case 'char':
    case 'uchar':
    case 'short':
    case 'ushort':
    case 'int':
    case 'uint':
    case 'int8':
    case 'uint8':
    case 'int16':
    case 'uint16':
    case 'int32':
    case 'uint32':
      r = parseInt(n, 10);
      break;
    case 'float':
    case 'double':
    case 'float32':
    case 'float64':
      r = parseFloat(n);
      break;
    default:
      console.log('Unsupported type');
      break;
  }

  return r;
}

function parseElement(properties, line) {
  const values = line.split(/\s+/);
  const element = {};

  for (let i = 0; i < properties.length; i++) {
    if (properties[i].type === 'list') {
      const list = [];
      const n = parseNumber(values.shift(), properties[i].countType);

      for (let j = 0; j < n; j++) {
        list.push(parseNumber(values.shift(), properties[i].itemType));
      }

      element[properties[i].name] = list;
    } else {
      element[properties[i].name] = parseNumber(
        values.shift(),
        properties[i].type
      );
    }
  }

  return element;
}

function handleElement(buffer, name, element) {
  if (name === 'vertex') {
    buffer.vertices.push(element.x, element.y, element.z);

    // Normals
    if ('nx' in element && 'ny' in element && 'nz' in element) {
      buffer.normals.push(element.nx, element.ny, element.nz);
    }

    // Uvs
    if ('s' in element && 't' in element) {
      buffer.uvs.push(element.s, element.t);
    } else if ('u' in element && 'v' in element) {
      buffer.uvs.push(element.u, element.v);
    } else if ('texture_u' in element && 'texture_v' in element) {
      buffer.uvs.push(element.texture_u, element.texture_v);
    }

    // Colors
    if ('red' in element && 'green' in element && 'blue' in element) {
      buffer.colors.push(element.red, element.green, element.blue);
    }
  } else if (name === 'face') {
    const vertexIndices = element.vertex_indices || element.vertex_index;
    const texcoord = element.texcoord;

    if (vertexIndices && vertexIndices.length > 0) {
      buffer.indices.push(vertexIndices.length);
      vertexIndices.forEach((val, idx) => {
        buffer.indices.push(val);
      });
    }

    buffer.faceVertexUvs.push(texcoord);
  }
}

function binaryRead(dataview, at, type, littleEndian) {
  let r;
  switch (type) {
    case 'int8':
    case 'char':
      r = [dataview.getInt8(at), 1];
      break;
    case 'uint8':
    case 'uchar':
      r = [dataview.getUint8(at), 1];
      break;
    case 'int16':
    case 'short':
      r = [dataview.getInt16(at, littleEndian), 2];
      break;
    case 'uint16':
    case 'ushort':
      r = [dataview.getUint16(at, littleEndian), 2];
      break;
    case 'int32':
    case 'int':
      r = [dataview.getInt32(at, littleEndian), 4];
      break;
    case 'uint32':
    case 'uint':
      r = [dataview.getUint32(at, littleEndian), 4];
      break;
    case 'float32':
    case 'float':
      r = [dataview.getFloat32(at, littleEndian), 4];
      break;
    case 'float64':
    case 'double':
      r = [dataview.getFloat64(at, littleEndian), 8];
      break;
    default:
      console.log('Unsupported type');
      break;
  }
  return r;
}

function binaryReadElement(dataview, at, properties, littleEndian) {
  const element = {};
  let result;
  let read = 0;

  for (let i = 0; i < properties.length; i++) {
    if (properties[i].type === 'list') {
      const list = [];

      result = binaryRead(
        dataview,
        at + read,
        properties[i].countType,
        littleEndian
      );
      const n = result[0];
      read += result[1];

      for (let j = 0; j < n; j++) {
        result = binaryRead(
          dataview,
          at + read,
          properties[i].itemType,
          littleEndian
        );
        list.push(result[0]);
        read += result[1];
      }

      element[properties[i].name] = list;
    } else {
      result = binaryRead(
        dataview,
        at + read,
        properties[i].type,
        littleEndian
      );
      element[properties[i].name] = result[0];
      read += result[1];
    }
  }

  return [element, read];
}

// ----------------------------------------------------------------------------
// vtkPLYReader methods
// ----------------------------------------------------------------------------

function vtkPLYReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPLYReader');

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
    if (typeof content === 'string') {
      publicAPI.parseAsText(content);
    } else {
      publicAPI.parseAsArrayBuffer(content);
    }
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

    // Header
    const text = BinaryHelper.arrayBufferToString(content);
    const header = parseHeader(text);

    // ascii/binary detection
    const isBinary = header.format !== PLYFormats.ASCII;

    // Check if ascii format
    if (!isBinary) {
      publicAPI.parseAsText(content);
      return;
    }

    model.parseData = content;

    // Binary parsing
    const buffer = {
      indices: [],
      vertices: [],
      normals: [],
      uvs: [],
      faceVertexUvs: [],
      colors: [],
    };

    const littleEndian = header.format === PLYFormats.BINARY_LITTLE_ENDIAN;
    const arraybuffer =
      content instanceof ArrayBuffer ? content : content.buffer;
    const body = new DataView(arraybuffer, header.headerLength);
    let result;
    let loc = 0;

    for (let elem = 0; elem < header.elements.length; elem++) {
      for (let idx = 0; idx < header.elements[elem].count; idx++) {
        result = binaryReadElement(
          body,
          loc,
          header.elements[elem].properties,
          littleEndian
        );
        loc += result[1];
        const element = result[0];
        handleElement(buffer, header.elements[elem].name, element);
      }
    }

    const polydata = postProcess(buffer, header.elements);

    // Add new output
    model.output[0] = polydata;
  };

  publicAPI.parseAsText = (content) => {
    if (!content) {
      return;
    }

    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;

    // Header
    const text = BinaryHelper.arrayBufferToString(content);
    const header = parseHeader(text);

    // ascii/binary detection
    const isBinary = header.format !== PLYFormats.ASCII;

    // Check if ascii format
    if (isBinary) {
      publicAPI.parseAsArrayBuffer(content);
      return;
    }

    // Text parsing
    const buffer = {
      indices: [],
      vertices: [],
      normals: [],
      uvs: [],
      faceVertexUvs: [],
      colors: [],
    };

    const result = patterns.patternBody.exec(text);
    let body = '';
    if (result !== null) {
      body = result[1];
    }

    const lines = body.split('\n');
    let elem = 0;
    let idx = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.trim();
      if (line !== '') {
        if (idx >= header.elements[elem].count) {
          elem++;
          idx = 0;
        }

        const element = parseElement(header.elements[elem].properties, line);
        handleElement(buffer, header.elements[elem].name, element);
        idx++;
      }
    }

    const polydata = postProcess(buffer, header.elements);

    // Add new output
    model.output[0] = polydata;
  };

  publicAPI.requestData = (inData, outData) => {
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

  // vtkPLYReader methods
  vtkPLYReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPLYReader');

// ----------------------------------------------------------------------------

export default {
  extend,
  newInstance,
};
