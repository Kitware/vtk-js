// Author: Thomas Beznik, with the help of Julien Finet (https://github.com/Kitware/vtk-js/issues/1442)
// and inspired from Paul Kaplan (https://gist.github.com/paulkaplan/6d5f0ab2c7e8fdc68a61).

import { vec3 } from 'gl-matrix';
import { macro } from 'vtk.js/Sources/macro';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import { FormatTypes } from 'paraview-glance/src/vtk/vtkSTLWriter/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function writeFloatBinary(dataview, offset, float) {
  dataview.setFloat32(offset, float.toPrecision(6), true);
  return offset + 4;
}

function writeVectorBinary(dataview, offset, vector) {
  let off = writeFloatBinary(dataview, offset, vector[0]);
  off = writeFloatBinary(dataview, off, vector[1]);
  return writeFloatBinary(dataview, off, vector[2]);
}

// ----------------------------------------------------------------------------
// vtkSTLWriter methods
// ----------------------------------------------------------------------------

function vtkSTLWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSTLWriter');

  function getPoint(j, points, polys) {
    let i = j;
    const v = [
      points[polys[i] * 3],
      points[polys[i] * 3 + 1],
      points[polys[i++] * 3 + 2],
    ];
    return [i, v];
  }

  function getPoints(j, points, polys, transform) {
    let i = j;
    let v1 = [];
    let v2 = [];
    let v3 = [];
    [i, v1] = getPoint(i, points, polys);
    [i, v2] = getPoint(i, points, polys);
    [i, v3] = getPoint(i, points, polys);
    if (transform) {
      vec3.transformMat4(v1, v1, transform);
      vec3.transformMat4(v2, v2, transform);
      vec3.transformMat4(v3, v3, transform);
    }
    return [i, v1, v2, v3];
  }

  function writeBinary(polyData, transform) {
    const polys = polyData.getPolys().getData();
    const points = polyData.getPoints().getData();
    const strips = polyData.getStrips() ? polyData.getStrips().getData() : null;
    const buffer = new ArrayBuffer(80 + 4 + (50 * polys.length) / 4); // buffer for the full file; size = header (80) + num cells (4) +  50 bytes per poly
    const dataview = new DataView(buffer);
    let offset = 0;

    offset += 80; // Header is empty // TODO: could add date, version, package

    let v1 = [];
    let v2 = [];
    let v3 = [];
    const dn = [];

    // First need to write the number of cells
    dataview.setUint32(offset, polyData.getNumberOfCells(), true);
    offset += 4;

    // Strips
    if (strips && strips.length > 0) {
      throw new Error('Unsupported strips');
    }

    // Polys
    for (let i = 0; i < polys.length; ) {
      const pointNumber = polys[i++];

      if (pointNumber) {
        [i, v1, v2, v3] = getPoints(i, points, polys, transform);
        vtkTriangle.computeNormal(v1, v2, v3, dn);

        offset = writeVectorBinary(dataview, offset, dn);
        offset = writeVectorBinary(dataview, offset, v1);
        offset = writeVectorBinary(dataview, offset, v2);
        offset = writeVectorBinary(dataview, offset, v3);
        offset += 2; // unused 'attribute byte count' is a Uint16
      }
    }
    return dataview;
  }

  function writeASCII(polyData, transform) {
    const polys = polyData.getPolys().getData();
    const points = polyData.getPoints().getData();
    const strips = polyData.getStrips() ? polyData.getStrips().getData() : null;
    let file = '';

    file += 'solid ascii\n';

    const n = [];
    let v1 = [];
    let v2 = [];
    let v3 = [];

    // Strips

    if (strips && strips.length > 0) {
      throw new Error('Unsupported strips');
    }

    // Polys
    for (let i = 0; i < polys.length; ) {
      const pointNumber = polys[i++];

      if (pointNumber) {
        [i, v1, v2, v3] = getPoints(i, points, polys, transform);
        vtkTriangle.computeNormal(v1, v2, v3, n);

        file += ` facet normal ${n[0].toPrecision(6)} ${n[1].toPrecision(
          6
        )} ${n[2].toPrecision(6)}\n`;
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
      } else {
        throw new Error('Unsupported polygon');
      }
    }

    file += 'endsolid\n';

    return file;
  }

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    if (!input || input.getClassName() !== 'vtkPolyData') {
      vtkErrorMacro('Invalid or missing input');
      return;
    }
    if (model.format === FormatTypes.ASCII) {
      outData[0] = writeASCII(input, model.transform);
    } else if (model.format === FormatTypes.BINARY) {
      outData[0] = writeBinary(input, model.transform);
    } else {
      vtkErrorMacro('Invalid format type');
    }
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

export default { newInstance, extend };
