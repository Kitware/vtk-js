import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import {
  BINARY_CHUNK_TYPES,
  BINARY_CHUNK_HEADER_INTS,
  BINARY_HEADER_INTS,
  BINARY_HEADER_LENGTH,
  BINARY_HEADER_MAGIC,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

function getChunkInfo(headerStart, data) {
  // Cache array view
  const header = new Uint32Array(data, headerStart, BINARY_CHUNK_HEADER_INTS);
  const chunkStart = headerStart + BINARY_CHUNK_HEADER_INTS * 4;
  return {
    start: chunkStart,
    length: header[0],
    type: header[1],
  };
}

function getAllChunkInfos(data) {
  // Pre-calculate array size
  const maxChunks = Math.floor((data.byteLength - BINARY_HEADER_LENGTH) / 8);
  const infos = new Array(maxChunks);
  let chunkStart = BINARY_HEADER_INTS * 4;
  let chunkCount = 0;

  while (chunkStart < data.byteLength) {
    const chunkInfo = getChunkInfo(chunkStart, data);
    infos[chunkCount++] = chunkInfo;
    chunkStart += chunkInfo.length + BINARY_CHUNK_HEADER_INTS * 4;
  }

  // Trim array to actual size
  return infos.slice(0, chunkCount);
}

function getJsonFromChunk(chunkInfo, data) {
  const jsonStart = (BINARY_HEADER_INTS + BINARY_CHUNK_HEADER_INTS) * 4;
  const jsonView = new Uint8Array(data, jsonStart, chunkInfo.length);
  const decoder = new TextDecoder('utf-8');
  const jsonString = decoder.decode(jsonView);
  return JSON.parse(jsonString);
}

function getBufferFromChunk(chunkInfo, data) {
  return data.slice(chunkInfo.start, chunkInfo.start + chunkInfo.length);
}

function parseGLB(data) {
  if (data.byteLength < BINARY_HEADER_LENGTH) {
    throw new Error('Invalid GLB: File too small');
  }

  // Cache DataView
  const headerView = new DataView(data, 0, BINARY_HEADER_LENGTH);
  const magic = new Uint8Array(data, 0, 4);

  const header = {
    magic: BinaryHelper.arrayBufferToString(magic),
    version: headerView.getUint32(4, true),
    length: headerView.getUint32(8, true),
  };

  if (header.magic !== BINARY_HEADER_MAGIC) {
    throw new Error('Unsupported glTF-Binary header.');
  }
  if (header.version < 2.0) {
    throw new Error('Unsupported legacy binary file detected.');
  }
  if (header.length > data.byteLength) {
    throw new Error('Invalid GLB: Declared length exceeds file size');
  }

  const chunkInfos = getAllChunkInfos(data);
  let json = null;
  const buffers = [];

  // Process chunks sequentially
  for (let i = 0; i < chunkInfos.length; i++) {
    const chunkInfo = chunkInfos[i];
    if (chunkInfo.type === BINARY_CHUNK_TYPES.JSON && !json) {
      json = getJsonFromChunk(chunkInfo, data);
    } else if (chunkInfo.type === BINARY_CHUNK_TYPES.BIN) {
      buffers.push(getBufferFromChunk(chunkInfo, data));
    }
  }

  if (!json) {
    throw new Error('glTF-Binary: JSON content not found.');
  }

  return { json, buffers };
}

export default parseGLB;
