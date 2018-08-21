/* eslint-disable no-bitwise */

// ----------------------------------------------------------------------------
// Decoding infrastructure
// ----------------------------------------------------------------------------

const REVERSE_LOOKUP = [];
REVERSE_LOOKUP['-'.charCodeAt(0)] = 62;
REVERSE_LOOKUP['_'.charCodeAt(0)] = 63;

const BASE64_CODE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (let i = 0; i < BASE64_CODE.length; i++) {
  REVERSE_LOOKUP[BASE64_CODE.charCodeAt(i)] = i;
}

// ----------------------------------------------------------------------------
// Base64 analysis
// ----------------------------------------------------------------------------

function isValidChar(c) {
  return REVERSE_LOOKUP[c.charCodeAt(0)] !== undefined;
}

function extractChunks(b64Str) {
  const strSize = b64Str.length;
  const chunks = [];

  let currentChunk = null;
  for (let i = 0; i < strSize; i++) {
    if (isValidChar(b64Str[i])) {
      if (!currentChunk) {
        currentChunk = { start: i, count: 0 };
      }
      currentChunk.count++;
      currentChunk.end = i;
    } else if (b64Str[i] === '=' && currentChunk) {
      // End of chunk
      chunks.push(currentChunk);
      currentChunk = null;
    } else {
      // Skip padding / formatting
      // => do nothing, just move along
    }
  }
  return chunks;
}

function writeChunk(b64Str, chunk, dstOffset, unit8) {
  const { start, count } = chunk;
  const remain = count % 4;
  const fourCharProcessCount = Math.floor(count / 4);
  let charIdx = start;
  let tmp = null;
  let offset = dstOffset;

  // Handle 4=>3
  for (let i = 0; i < fourCharProcessCount; i++) {
    while (!isValidChar(charIdx)) {
      charIdx++;
    }
    tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 18;
    while (!isValidChar(charIdx)) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 12;
    while (!isValidChar(charIdx)) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 6;
    while (!isValidChar(charIdx)) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)];

    unit8[offset++] = (tmp >> 16) & 0xff;
    unit8[offset++] = (tmp >> 8) & 0xff;
    unit8[offset++] = tmp & 0xff;
  }

  // Handle remain
  switch (remain) {
    case 3:
      while (!isValidChar(charIdx)) {
        charIdx++;
      }
      tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 10;
      while (!isValidChar(charIdx)) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 4;
      while (!isValidChar(charIdx)) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] >> 2;
      unit8[offset++] = (tmp >> 8) & 0xff;
      unit8[offset++] = tmp & 0xff;
      break;
    case 2:
      while (!isValidChar(charIdx)) {
        charIdx++;
      }
      tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx)] << 2;
      while (!isValidChar(charIdx)) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx)] >> 4;
      unit8[offset++] = tmp & 0xff;
      break;
    case 1:
      console.error('BASE64: remain 1 should not happen');
      break;
    case 0:
      break;
    default:
      break;
  }

  return offset;
}

function toArrayBuffer(b64Str) {
  const chunks = extractChunks(b64Str);
  let totalSize = 0;
  for (let i = 0; i < chunks.length; i++) {
    const { count } = chunks[i];
    const remain = count % 4;
    totalSize += (count - remain) * 3 + remain;
  }

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new Uint8Array(arrayBuffer);
  let dstOffset = 0;
  for (let i = 0; i < chunks.length; i++) {
    dstOffset += writeChunk(b64Str, chunks[i], dstOffset, view);
  }

  return arrayBuffer;
}

export default {
  toArrayBuffer,
};
