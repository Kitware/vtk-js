import macro from 'vtk.js/Sources/macros';

import {
  FormatTypes,
  TextureCoordinatesName,
} from 'vtk.js/Sources/IO/Geometry/PLYWriter/Constants';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPLYWriter methods
// ----------------------------------------------------------------------------
const writeHeader = (
  polyData,
  fileFormat,
  fileType,
  headerComments,
  textureFileName,
  textureCoordinatesName,
  vertexCount,
  faceListLength,
  withNormals,
  withUVs,
  withColors,
  withIndices
) => {
  const isBinary = fileFormat !== FormatTypes.ASCII;
  let format;
  if (isBinary) {
    format = fileType ? 'binary_little_endian' : 'binary_big_endian';
  } else format = 'ascii';

  headerComments.unshift('VTK.js generated PLY File');
  if (textureFileName) {
    headerComments.push(`TextureFile ${textureFileName}`);
  }
  const commentElements = headerComments
    .map((comment) => `comment ${comment}`)
    .join('\n');

  const header = [
    'ply',
    `format ${format} 1.0`,
    `${commentElements}`,
    `element vertex ${vertexCount}`,
    'property float x',
    'property float y',
    'property float z',
  ];

  // normals
  if (withNormals) {
    header.push('property float nx', 'property float ny', 'property float nz');
  }

  // uvs
  if (withUVs) {
    header.push(
      `property float ${textureCoordinatesName[0]}`,
      `property float ${textureCoordinatesName[1]}`
    );
  }

  // colors
  if (withColors) {
    header.push(
      'property uchar red',
      'property uchar green',
      'property uchar blue'
    );
  }

  // faces
  if (withIndices) {
    header.push(
      `element face ${faceListLength}`,
      'property list uchar int vertex_indices'
    );
  }

  header.push('end_header\n');
  return header.join('\n');
};

const binaryWriter = () => {
  let output;
  let vOffset;
  let fOffset;
  const indexByteCount = 4;
  let ft;
  return {
    init: (polyData) => {},
    writeHeader: (
      polyData,
      fileFormat,
      fileType,
      headerComments,
      textureFileName,
      textureCoordinatesName,
      numPts,
      numPolys,
      withNormals,
      withUVs,
      withColors,
      withIndices
    ) => {
      const vertexCount = polyData.getPoints().getNumberOfPoints();
      ft = fileType;
      // 1 byte shape descriptor
      // 3 vertex indices at ${indexByteCount} bytes
      const faceListLength = withIndices
        ? numPolys * (indexByteCount * 3 + 1)
        : 0;

      // 3 position values at 4 bytes
      // 3 normal values at 4 bytes
      // 3 color channels with 1 byte
      // 2 uv values at 4 bytes
      const vertexListLength =
        vertexCount *
        (4 * 3 +
          (withNormals ? 4 * 3 : 0) +
          (withUVs ? 4 * 2 : 0) +
          (withColors ? 3 : 0));

      const header = writeHeader(
        polyData,
        fileFormat,
        fileType,
        headerComments,
        textureFileName,
        textureCoordinatesName,
        numPts,
        numPolys,
        withNormals,
        withUVs,
        withColors,
        withIndices
      );
      const headerBin = new TextEncoder().encode(header);
      output = new DataView(
        new ArrayBuffer(headerBin.length + vertexListLength + faceListLength)
      );
      new Uint8Array(output.buffer).set(headerBin, 0);
      vOffset = headerBin.length;
      fOffset = vOffset + vertexListLength;
    },
    writeVertice: (x, y, z, nx, ny, nz, u, v, r, g, b) => {
      // xyz
      output.setFloat32(vOffset, x, ft);
      vOffset += 4;
      output.setFloat32(vOffset, y, ft);
      vOffset += 4;
      output.setFloat32(vOffset, z, ft);
      vOffset += 4;
      // nxnynz
      if (nx !== null && ny !== null && nz !== null) {
        output.setFloat32(vOffset, nx, ft);
        vOffset += 4;
        output.setFloat32(vOffset, ny, ft);
        vOffset += 4;
        output.setFloat32(vOffset, nz, ft);
        vOffset += 4;
      }
      // uv
      if (u !== null && v !== null) {
        output.setFloat32(vOffset, u, ft);
        vOffset += 4;
        output.setFloat32(vOffset, v, ft);
        vOffset += 4;
      }
      // rgb
      if (r !== null && g !== null && b !== null) {
        output.setUint8(vOffset, r);
        vOffset += 1;
        output.setUint8(vOffset, g);
        vOffset += 1;
        output.setUint8(vOffset, b);
        vOffset += 1;
      }
    },
    writeFace: (n, x, y, z) => {
      output.setUint8(fOffset, n);
      fOffset += 1;
      output.setUint32(fOffset, x, ft);
      fOffset += indexByteCount;
      output.setUint32(fOffset, y, ft);
      fOffset += indexByteCount;
      output.setUint32(fOffset, z, ft);
      fOffset += indexByteCount;
    },
    writeFooter: (polyData) => {},
    getOutputData: () => output,
  };
};

const asciiWriter = () => {
  let fileContent = '';
  return {
    init: (polyData) => {},
    writeHeader: (
      polyData,
      fileFormat,
      fileType,
      headerComments,
      textureFileName,
      textureCoordinatesName,
      numPts,
      numPolys,
      withNormals,
      withUVs,
      withColors,
      withIndices
    ) => {
      fileContent += writeHeader(
        polyData,
        fileFormat,
        fileType,
        headerComments,
        textureFileName,
        textureCoordinatesName,
        numPts,
        numPolys,
        withNormals,
        withUVs,
        withColors,
        withIndices
      );
    },
    writeVertice: (x, y, z, nx, ny, nz, u, v, r, g, b) => {
      fileContent += `${x} ${y} ${z}`;
      if (nx !== null && ny !== null && nz !== null) {
        fileContent += ` ${nx} ${ny} ${nz}`;
      }
      if (u !== null && v !== null) {
        fileContent += ` ${u} ${v}`;
      }
      if (r !== null && g !== null && b !== null) {
        fileContent += ` ${r} ${g} ${b}`;
      }
      fileContent += '\n';
    },
    writeFace: (n, x, y, z) => {
      fileContent += `${n} ${x} ${y} ${z}\n`;
    },
    writeFooter: (polyData) => {},
    getOutputData: () => fileContent,
  };
};

function writePLY(
  polyData,
  format,
  dataByteOrder,
  headerComments,
  textureFileName,
  textureCoordinatesName,
  transform,
  withNormals,
  withUVs,
  withColors,
  withIndices
) {
  const inPts = polyData.getPoints();
  const polys = polyData.getPolys();

  if (inPts === null || polys === null) {
    vtkErrorMacro('No data to write!');
  }

  let writer = null;
  if (format === FormatTypes.BINARY) {
    writer = binaryWriter();
  } else if (format === FormatTypes.ASCII) {
    writer = asciiWriter();
  } else {
    vtkErrorMacro('Invalid type format');
  }

  let tCoordsName = textureCoordinatesName;
  if (typeof textureCoordinatesName === 'undefined') {
    vtkWarningMacro(
      'Invalid TextureCoordinatesName value, fallback to default uv values'
    );
    tCoordsName = TextureCoordinatesName.UV;
  }

  writer.init(polyData);

  const numPts = inPts.getNumberOfPoints();
  const numPolys = polys.getNumberOfCells();

  // textureCoords / uvs
  const textureCoords = polyData.getPointData().getTCoords();
  // eslint-disable-next-line no-param-reassign
  withUVs = !(textureCoords === null);

  // scalars / colors
  const scalars = polyData.getPointData().getScalars();
  // eslint-disable-next-line no-param-reassign
  withColors = !(scalars === null);

  const fileType = dataByteOrder ? 0 : 1;

  writer.writeHeader(
    polyData,
    format,
    fileType,
    headerComments,
    textureFileName,
    tCoordsName,
    numPts,
    numPolys,
    withNormals,
    withUVs,
    withColors,
    withIndices
  );

  const normals = polyData.getPointData().getNormals();

  // points / vertices
  for (let i = 0; i < numPts; i++) {
    // eslint-disable-next-line prefer-const
    let p = inPts.getPoint(i);

    // TODO: apply transform matrix
    if (transform) {
      // vec3.transformMat4(p, p, transform);
    }

    // coords
    // divide by 1 to remove trailing zeros
    const x = p[0].toPrecision(6) / 1;
    const y = p[1].toPrecision(6) / 1;
    const z = p[2].toPrecision(6) / 1;

    // normals
    let nx = null;
    let ny = null;
    let nz = null;

    // uvs
    let u = null;
    let v = null;

    // colors
    let r = null;
    let g = null;
    let b = null;

    if (textureCoords) {
      u = textureCoords.getData()[i * 2];
      v = textureCoords.getData()[i * 2 + 1];
    }

    if (scalars) {
      r = scalars.getData()[i * 3];
      g = scalars.getData()[i * 3 + 1];
      b = scalars.getData()[i * 3 + 2];
    }

    if (normals) {
      nx = normals.getData()[i * 2];
      ny = normals.getData()[i * 2 + 1];
      nz = normals.getData()[i * 2 + 2];
    }

    writer.writeVertice(x, y, z, nx, ny, nz, u, v, r, g, b);
  }

  // polys / indices
  const pd = polys.getData();
  for (let i = 0, l = pd.length; i < l; i += 4) {
    writer.writeFace(pd[i + 0], pd[i + 1], pd[i + 2], pd[i + 3]);
  }

  writer.writeFooter(polyData);
  return writer.getOutputData();
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  writePLY,
};

// ----------------------------------------------------------------------------
// vtkPLYWriter methods
// ----------------------------------------------------------------------------

function vtkPLYWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPLYWriter');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    if (!input || input.getClassName() !== 'vtkPolyData') {
      vtkErrorMacro('Invalid or missing input');
      return;
    }
    outData[0] = writePLY(
      input,
      model.format,
      model.dataByteOrder,
      model.headerComments,
      model.textureFileName,
      model.textureCoordinatesName,
      model.transform,
      model.withNormals,
      model.withUVs,
      model.withColors,
      model.withIndices
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  format: FormatTypes.ASCII,
  dataByteOrder: 0,
  headerComments: [],
  textureFileName: null,
  textureCoordinatesName: TextureCoordinatesName.UV,
  transform: null,
  withNormals: true,
  withUVs: true,
  withColors: true,
  withIndices: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, [
    'format',
    'dataByteOrder', // binary_little_endian 0 binary_big_endian 1
    'headerComments',
    'textureFileName',
    'textureCoordinatesName',
    'transform',
    'withNormals',
    'withUVs',
    'withColors',
    'withIndices',
  ]);

  // Object specific methods
  vtkPLYWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPLYWriter');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
