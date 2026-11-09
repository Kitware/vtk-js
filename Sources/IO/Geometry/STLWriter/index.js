// @author: Thomas Beznik <thomas.beznik@relu.eu>, with the help of Julien Finet <julien.finet@kitware.com> (https://github.com/Kitware/vtk-js/issues/1442)
// and inspired from Paul Kaplan (https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61).

import { vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import { FormatTypes } from 'vtk.js/Sources/IO/Geometry/STLWriter/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function writeFloatBinary(dataView, offset, float) {
  dataView.setFloat32(offset, float.toPrecision(6), true);
  return offset + 4;
}

function writeVectorBinary(dataView, offset, vector) {
  let off = writeFloatBinary(dataView, offset, vector[0]);
  off = writeFloatBinary(dataView, off, vector[1]);
  return writeFloatBinary(dataView, off, vector[2]);
}

// Each polygon with n points gives n - 2 triangles. Cells with less than 3
// points give no triangle.
function getNumberOfTriangles(polys) {
  let count = 0;
  for (let i = 0; i < polys.length;) {
    const pointNumber = polys[i];
    if (pointNumber >= 3) {
      count += pointNumber - 2;
    }
    i += pointNumber + 1;
  }
  return count;
}

// ----------------------------------------------------------------------------
// vtkSTLWriter methods
// ----------------------------------------------------------------------------

const binaryWriter = () => {
  let offset = 0;
  let dataView = null;
  return {
    init: (polyData) => {
      const polys = polyData.getPolys().getData();
      // The file has a header of 80 bytes, the triangle count in 4 bytes,
      // and 50 bytes for each triangle.
      const buffer = new ArrayBuffer(80 + 4 + 50 * getNumberOfTriangles(polys));
      dataView = new DataView(buffer);
    },
    writeHeader: (polyData) => {
      offset += 80; // Header is empty // TODO: could add date, version, package

      // The facet count is the number of triangles that the writer writes.
      const polys = polyData.getPolys().getData();
      dataView.setUint32(offset, getNumberOfTriangles(polys), true);
      offset += 4;
    },
    writeTriangle: (v1, v2, v3, dn) => {
      offset = writeVectorBinary(dataView, offset, dn);
      offset = writeVectorBinary(dataView, offset, v1);
      offset = writeVectorBinary(dataView, offset, v2);
      offset = writeVectorBinary(dataView, offset, v3);
      offset += 2; // unused 'attribute byte count' is a Uint16
    },
    writeFooter: (polyData) => {},
    getOutputData: () => dataView,
  };
};

const asciiWriter = () => {
  let file = '';
  return {
    init: (polyData) => {},
    writeHeader: (polyData) => {
      file += 'solid ascii\n';
    },
    writeTriangle: (v1, v2, v3, dn) => {
      file += ` facet normal ${dn[0].toPrecision(6)} ${dn[1].toPrecision(
        6
      )} ${dn[2].toPrecision(6)}\n`;
      file += '  outer loop\n';
      file += `   vertex ${v1[0].toPrecision(6)} ${v1[1].toPrecision(
        6
      )} ${v1[2].toPrecision(6)}\n`;
      file += `   vertex ${v2[0].toPrecision(6)} ${v2[1].toPrecision(
        6
      )} ${v2[2].toPrecision(6)}\n`;
      file += `   vertex ${v3[0].toPrecision(6)} ${v3[1].toPrecision(
        6
      )} ${v3[2].toPrecision(6)}\n`;
      file += '  endloop\n';
      file += ' endfacet\n';
    },
    writeFooter: (polyData) => {
      file += 'endsolid\n';
    },
    getOutputData: () => file,
  };
};

function writeSTL(polyData, format = FormatTypes.BINARY, transform = null) {
  let writer = null;
  if (format === FormatTypes.BINARY) {
    writer = binaryWriter();
  } else if (format === FormatTypes.ASCII) {
    writer = asciiWriter();
  } else {
    vtkErrorMacro('Invalid format type');
  }

  writer.init(polyData);
  writer.writeHeader(polyData);

  const polys = polyData.getPolys().getData();
  const points = polyData.getPoints().getData();
  const strips = polyData.getStrips() ? polyData.getStrips().getData() : null;

  const n = [];

  // Strips
  if (strips && strips.length > 0) {
    throw new Error('Unsupported strips');
  }

  const getPoint = (id, out) => {
    out[0] = points[id * 3];
    out[1] = points[id * 3 + 1];
    out[2] = points[id * 3 + 2];
    if (transform) {
      vec3.transformMat4(out, out, transform);
    }
    return out;
  };

  const v1 = [0, 0, 0];
  let v2 = [0, 0, 0];
  let v3 = [0, 0, 0];

  // Polys: write each polygon as a triangle fan. The fan shares v3 with the
  // next v2, thus each triangle reads one new point.
  for (let i = 0; i < polys.length;) {
    const pointNumber = polys[i];
    if (pointNumber >= 3) {
      getPoint(polys[i + 1], v1);
      getPoint(polys[i + 2], v3);
      for (let k = 2; k < pointNumber; k++) {
        const tmp = v2;
        v2 = v3;
        v3 = tmp;
        getPoint(polys[i + k + 1], v3);
        vtkTriangle.computeNormal(v1, v2, v3, n);
        writer.writeTriangle(v1, v2, v3, n);
      }
    }
    i += pointNumber + 1;
  }
  writer.writeFooter(polyData);
  return writer.getOutputData();
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  writeSTL,
};

// ----------------------------------------------------------------------------
// vtkSTLWriter methods
// ----------------------------------------------------------------------------

function vtkSTLWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSTLWriter');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    if (!input || input.getClassName() !== 'vtkPolyData') {
      vtkErrorMacro('Invalid or missing input');
      return;
    }
    outData[0] = writeSTL(input, model.format, model.transform);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  format: FormatTypes.BINARY,
  transform: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['format', 'transform']);

  // Object specific methods
  vtkSTLWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSTLWriter');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
