import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import {
  BINARY_CHUNK_TYPES,
  BINARY_CHUNK_HEADER_INTS,
  BINARY_HEADER_INTS,
  BINARY_HEADER_LENGTH,
  BINARY_HEADER_MAGIC,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

function getChunkInfo(headerStart, data) {
  const header = new Uint32Array(data, headerStart, BINARY_CHUNK_HEADER_INTS);
  const chunkStart = headerStart + BINARY_CHUNK_HEADER_INTS * 4;
  const chunkLength = header[0];
  const chunkType = header[1];
  return { start: chunkStart, length: chunkLength, type: chunkType };
}

function getAllChunkInfos(data) {
  const infos = [];
  let chunkStart = BINARY_HEADER_INTS * 4;
  while (chunkStart < data.byteLength) {
    const chunkInfo = getChunkInfo(chunkStart, data);
    infos.push(chunkInfo);
    chunkStart += chunkInfo.length + BINARY_CHUNK_HEADER_INTS * 4;
  }
  return infos;
}

function getJsonFromChunk(chunkInfo, data) {
  const chunkLength = chunkInfo.length;
  const jsonStart = (BINARY_HEADER_INTS + BINARY_CHUNK_HEADER_INTS) * 4;
  const jsonSlice = new Uint8Array(data, jsonStart, chunkLength);
  const stringBuffer = BinaryHelper.arrayBufferToString(jsonSlice);
  return JSON.parse(stringBuffer);
}

function getBufferFromChunk(chunkInfo, data) {
  return data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length);
}

function parseGLB(data) {
  let json;
  const buffers = [];

  const headerView = new DataView(data, 0, BINARY_HEADER_LENGTH);

  const header = {
    magic: BinaryHelper.arrayBufferToString(new Uint8Array(data, 0, 4)),
    version: headerView.getUint32(4, true),
    length: headerView.getUint32(8, true),
  };

  if (header.magic !== BINARY_HEADER_MAGIC) {
    throw new Error('Unsupported glTF-Binary header.');
  } else if (header.version < 2.0) {
    throw new Error('Unsupported legacy binary file detected.');
  }

  const chunkInfos = getAllChunkInfos(data);

  chunkInfos.forEach((chunkInfo) => {
    if (chunkInfo.type === BINARY_CHUNK_TYPES.JSON && !json) {
      json = getJsonFromChunk(chunkInfo, data);
    } else if (chunkInfo.type === BINARY_CHUNK_TYPES.BIN) {
      buffers.push(getBufferFromChunk(chunkInfo, data));
    }
  });

  if (!json) {
    throw new Error('glTF-Binary: JSON content not found.');
  }
  if (!buffers) {
    throw new Error('glTF-Binary: Binary chunk not found.');
  }
  return { json, buffers };
}

export default parseGLB;
