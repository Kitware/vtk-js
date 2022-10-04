import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const { vtkErrorMacro } = macro;

function parseHeader(headerString) {
  const headerSubStr = headerString.split(' ');
  const fieldValues = headerSubStr.filter((e) => e.indexOf('=') > -1);

  const header = {};
  for (let i = 0; i < fieldValues.length; ++i) {
    const fieldValueStr = fieldValues[i];
    const fieldValueSubStr = fieldValueStr.split('=');
    if (fieldValueSubStr.length === 2) {
      header[fieldValueSubStr[0]] = fieldValueSubStr[1];
    }
  }
  return header;
}

function addValuesToArray(src, dst) {
  for (let i = 0; i < src.length; i++) {
    dst.push(src[i]);
  }
}

// facet normal ni nj nk
//     outer loop
//         vertex v1x v1y v1z
//         vertex v2x v2y v2z
//         vertex v3x v3y v3z
//     endloop
// endfacet
function readTriangle(lines, offset, points, cellArray, cellNormals) {
  const normalLine = lines[offset];
  if (normalLine === undefined) {
    return -1;
  }
  if (normalLine.indexOf('endfacet') !== -1) {
    return offset + 1;
  }
  if (normalLine.indexOf('facet') === -1) {
    return offset + 1; // Move to next line
  }
  let nbVertex = 0;
  let nbConsumedLines = 2;
  const firstVertexIndex = points.length / 3;
  const normal = normalLine
    .split(/[ \t]+/)
    .filter((i) => i)
    .slice(-3)
    .map(Number);
  addValuesToArray(normal, cellNormals);
  while (lines[offset + nbConsumedLines].indexOf('vertex') !== -1) {
    const line = lines[offset + nbConsumedLines];
    const coords = line
      .split(/[ \t]+/)
      .filter((i) => i)
      .slice(-3)
      .map(Number);
    addValuesToArray(coords, points);
    nbVertex++;
    nbConsumedLines++;
  }

  cellArray.push(nbVertex);
  for (let i = 0; i < nbVertex; i++) {
    cellArray.push(firstVertexIndex + i);
  }

  while (
    lines[offset + nbConsumedLines] &&
    lines[offset + nbConsumedLines].indexOf('endfacet') !== -1
  ) {
    nbConsumedLines++;
  }
  // +1 (endfacet) +1 (next facet)
  return offset + nbConsumedLines + 2;
}

// ----------------------------------------------------------------------------
// vtkSTLReader methods
// ----------------------------------------------------------------------------

function vtkSTLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSTLReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const compression =
      option.compression !== undefined ? option.compression : model.compression;
    const progressCallback =
      option.progressCallback !== undefined
        ? option.progressCallback
        : model.progressCallback;

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

    // Fetch metadata
    return publicAPI.loadData(option);
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

    model.parseData = content;

    // ascii/binary detection
    let isBinary = false;
    // 80=STL header, 4=uint32 of num of triangles (le)
    const dview = new DataView(content, 0, 80 + 4);
    const numTriangles = dview.getUint32(80, true);
    // 50 bytes per triangle
    isBinary = 84 + numTriangles * 50 === content.byteLength;

    // Check if ascii format
    if (!isBinary) {
      publicAPI.parseAsText(BinaryHelper.arrayBufferToString(content));
      return;
    }

    // Binary parsing
    // Header
    const headerData = content.slice(0, 80);
    const headerStr = BinaryHelper.arrayBufferToString(headerData);
    const header = parseHeader(headerStr);

    // Data
    const dataView = new DataView(content, 84);
    // global.dataview = dataView;
    const nbFaces = (content.byteLength - 84) / 50;
    const pointValues = new Float32Array(nbFaces * 9);
    const normalValues = new Float32Array(nbFaces * 3);
    const cellValues = new Uint32Array(nbFaces * 4);
    const cellDataValues = new Uint16Array(nbFaces);
    let cellOffset = 0;

    for (let faceIdx = 0; faceIdx < nbFaces; faceIdx++) {
      const offset = faceIdx * 50;
      normalValues[faceIdx * 3 + 0] = dataView.getFloat32(offset + 0, true);
      normalValues[faceIdx * 3 + 1] = dataView.getFloat32(offset + 4, true);
      normalValues[faceIdx * 3 + 2] = dataView.getFloat32(offset + 8, true);

      pointValues[faceIdx * 9 + 0] = dataView.getFloat32(offset + 12, true);
      pointValues[faceIdx * 9 + 1] = dataView.getFloat32(offset + 16, true);
      pointValues[faceIdx * 9 + 2] = dataView.getFloat32(offset + 20, true);
      pointValues[faceIdx * 9 + 3] = dataView.getFloat32(offset + 24, true);
      pointValues[faceIdx * 9 + 4] = dataView.getFloat32(offset + 28, true);
      pointValues[faceIdx * 9 + 5] = dataView.getFloat32(offset + 32, true);
      pointValues[faceIdx * 9 + 6] = dataView.getFloat32(offset + 36, true);
      pointValues[faceIdx * 9 + 7] = dataView.getFloat32(offset + 40, true);
      pointValues[faceIdx * 9 + 8] = dataView.getFloat32(offset + 44, true);

      cellValues[cellOffset++] = 3;
      cellValues[cellOffset++] = faceIdx * 3 + 0;
      cellValues[cellOffset++] = faceIdx * 3 + 1;
      cellValues[cellOffset++] = faceIdx * 3 + 2;

      cellDataValues[faceIdx] = dataView.getUint16(offset + 48, true);
    }

    // Rotate points
    const orientationField = 'SPACE';
    if (orientationField in header && header[orientationField] !== 'LPS') {
      const XYZ = header[orientationField];
      const mat4 = new Float32Array(16);
      mat4[15] = 1;
      switch (XYZ[0]) {
        case 'L':
          mat4[0] = 1;
          break;
        case 'R':
          mat4[0] = -1;
          break;
        default:
          vtkErrorMacro(
            `Can not convert STL file from ${XYZ} to LPS space: ` +
              `permutations not supported. Use itk.js STL reader instead.`
          );
          return;
      }
      switch (XYZ[1]) {
        case 'P':
          mat4[5] = 1;
          break;
        case 'A':
          mat4[5] = -1;
          break;
        default:
          vtkErrorMacro(
            `Can not convert STL file from ${XYZ} to LPS space: ` +
              `permutations not supported. Use itk.js STL reader instead.`
          );
          return;
      }
      switch (XYZ[2]) {
        case 'S':
          mat4[10] = 1;
          break;
        case 'I':
          mat4[10] = -1;
          break;
        default:
          vtkErrorMacro(
            `Can not convert STL file from ${XYZ} to LPS space: ` +
              `permutations not supported. Use itk.js STL reader instead.`
          );
          return;
      }
      vtkMatrixBuilder
        .buildFromDegree()
        .setMatrix(mat4)
        .apply(pointValues)
        .apply(normalValues);
    }

    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(pointValues, 3);
    polydata.getPolys().setData(cellValues);
    polydata
      .getCellData()
      .setScalars(
        vtkDataArray.newInstance({ name: 'Attribute', values: cellDataValues })
      );
    polydata.getCellData().setNormals(
      vtkDataArray.newInstance({
        name: 'Normals',
        values: normalValues,
        numberOfComponents: 3,
      })
    );

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

    const lines = content.split('\n');
    let offset = 1;
    const points = [];
    const cellArray = [];
    const cellNormals = [];

    while (offset !== -1) {
      offset = readTriangle(lines, offset, points, cellArray, cellNormals);
    }

    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(Float32Array.from(points), 3);
    polydata.getPolys().setData(Uint32Array.from(cellArray));
    polydata.getCellData().setNormals(
      vtkDataArray.newInstance({
        name: 'Normals',
        values: Float32Array.from(cellNormals),
        numberOfComponents: 3,
      })
    );

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

  // vtkSTLReader methods
  vtkSTLReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSTLReader');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
