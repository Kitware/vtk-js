import macro from 'vtk.js/Sources/macros';

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
    p = pts.getPoint(i, p);
    outputData.push[`v ${p[0]} ${p[1]} ${p[2]}`];
  }

  // Normals
  if (normals) {
    for (let i = 0; i < nbPts; i++) {
      p = normals.getTuple(i, p);
      outputData.push[`vn ${p[0]} ${p[1]} ${p[2]}`];
    }
  }

  // Textures
  if (tcoords) {
    for (let i = 0; i < nbPts; i++) {
      p = tcoords.getTuple(i, p);
      outputData.push[`vt ${p[0]} ${p[1]}`];
    }
  }
  return outputData.join('/n');
};

const writeMtl = (baseName, textureFileName) => {
  const outputData = [];
  // set material
  const mtlName = 'material_0';
  outputData.push[`newmtl ${mtlName}`];
  outputData.push[`map_Kd ${textureFileName}`];
  return outputData.join('/n');
};


const writeOBJ = (polyData, textureFileName) => {
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
  }

  // Write points
  outputData += writePoints(pts, normals, tcoords);

  // Unsupported triangle strips
  if (strips && strips.length > 0) {
    vtkErrorMacro('Unsupported strips');
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

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const inputTexture = inData[1];

    if (!input || !input.isA('vtkPolyData')) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    if (!inputTexture || !input.isA('vtkTexture')) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    outData[0] = writeOBJ(input);
    outData[1], outData[2] = writeMtl(input);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 2, 2);

  // Object specific methods
  vtkOBJWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBJWriter');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
