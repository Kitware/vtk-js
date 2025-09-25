import { zipSync, strToU8 } from 'fflate';
import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray/index';
import vtkTriangleStrip from 'vtk.js/Sources/Common/DataModel/TriangleStrip/index';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkOBJWriter methods
// ----------------------------------------------------------------------------

const writeFaces = (faces, withNormals, withTCoords) => {
  let outputData = '';
  const fd = faces.getData();

  let offset = 0;
  while (offset < fd.length) {
    const faceSize = fd[offset++];
    outputData += 'f';
    for (let i = 0; i < faceSize; i++) {
      outputData += ` ${fd[offset + i] + 1}`;
      if (withTCoords) {
        outputData += `/${fd[offset + i] + 1}`;
        if (withNormals) {
          outputData += `//${fd[offset + i] + 1}`;
        }
      } else if (withNormals) {
        outputData += `//${fd[offset + i] + 1}`;
      }
    }
    offset += faceSize;
    outputData += '\n';
  }
  return outputData;
};

const writeLines = (lines) => {
  let outputData = '';
  const ld = lines.getData();

  let offset = 0;
  while (offset < ld.length) {
    const lineSize = ld[offset++];
    outputData += 'l';
    for (let i = 0; i < lineSize; i++) {
      outputData += ` ${ld[offset + i] + 1}`;
    }
    offset += lineSize;
    outputData += '\n';
  }

  return outputData;
};

const writePoints = (pts, normals, tcoords) => {
  const outputData = [];
  const nbPts = pts.getNumberOfPoints();

  let p;

  // Positions
  for (let i = 0; i < nbPts; i++) {
    p = pts.getPoint(i);
    outputData.push(`v ${p[0]} ${p[1]} ${p[2]}`);
  }

  // Normals
  if (normals) {
    for (let i = 0; i < nbPts; i++) {
      p = normals.getTuple(i);
      outputData.push(`vn ${p[0]} ${p[1]} ${p[2]}`);
    }
  }

  // Textures
  if (tcoords) {
    for (let i = 0; i < nbPts; i++) {
      p = tcoords.getTuple(i);

      if (p[0] !== -1.0) {
        outputData.push(`vt ${p[0]} ${p[1]}`);
      }
    }
  }

  return `${outputData.join('\n')}\n`;
};

const writeMTL = (materialName, textureFileName) => {
  const outputData = [];
  outputData.push(`newmtl ${materialName}`);
  outputData.push(`map_Kd ${textureFileName}`);
  return outputData.join('\n');
};

const writeOBJ = (polyData, materialFilename, materialName) => {
  let outputData = '# VTK.js generated OBJ File\n';
  const pts = polyData.getPoints();
  const polys = polyData.getPolys();
  const strips = polyData.getStrips() ? polyData.getStrips().getData() : null;
  const lines = polyData.getLines();

  const normals = polyData.getPointData().getNormals();
  const tcoords = polyData.getPointData().getTCoords();

  const hasPtNormals = normals !== null;
  const hasPtTCoords = tcoords !== null;

  if (!pts) {
    vtkErrorMacro('No data to write!');
    return outputData;
  }

  if (materialFilename) {
    // Write material library
    outputData += `mtllib ${materialFilename}\n`;
  }

  // Write material if a texture is specified
  if (materialName) {
    // declare material in obj file
    outputData += `usemtl ${materialName}\n`;
  }

  // Write points
  outputData += writePoints(pts, normals, tcoords);

  // Decompose any triangle strips into triangles
  const polyStrips = vtkCellArray.newInstance();
  if (strips && strips.length > 0) {
    vtkTriangleStrip.decomposeStrip(pts, polyStrips);
  }

  // Write triangle strips
  if (polyStrips.getNumberOfCells() > 0) {
    outputData += writeFaces(polyStrips, hasPtNormals, hasPtTCoords);
  }

  // Write polygons.
  if (polys) {
    outputData += writeFaces(polys, hasPtNormals, hasPtTCoords);
  }

  // Write lines.
  if (lines) {
    outputData += writeLines(lines);
  }

  return outputData;
};

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  writeOBJ,
};

// ----------------------------------------------------------------------------
// vtkOBJWriter methods
// ----------------------------------------------------------------------------

function vtkOBJWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOBJWriter');

  publicAPI.exportAsZip = () => {
    publicAPI.update();
    const modelFilename = model.modelFilename;
    const materialFilename = model.materialFilename;
    const textureFileName = model.textureFileName;
    const imageData = model.texture.getInputAsJsImageData?.();

    const zipContent = {};

    zipContent[`${modelFilename}.obj`] = strToU8(model.output[0]);
    zipContent[`${materialFilename}.mtl`] = strToU8(model.mtl);

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        zipContent[`${textureFileName}.png`] = new Uint8Array(arrayBuffer);
        resolve(zipSync(zipContent));
      }, 'image/png');
    });
  };

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];

    if (!input || !input.isA('vtkPolyData')) {
      vtkErrorMacro('Invalid or missing vtkPolyData input');
      return;
    }

    // Update output
    const materialFilename = `${model.materialFilename}.mtl`;
    const textureFileName = `${model.textureFileName}.png`;
    outData[0] = writeOBJ(input, materialFilename, model.materialName);
    model.mtl = writeMTL(model.materialName, textureFileName);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  modelFilename: 'model',
  materialName: 'mat_01',
  materialFilename: 'material',
  texture: null,
  textureFileName: 'texture',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.get(publicAPI, model, ['mtl']);
  macro.set(publicAPI, model, [
    'modelFilename',
    'materialFilename',
    'texture',
    'textureFileName',
  ]);

  // Object specific methods
  vtkOBJWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBJWriter');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
