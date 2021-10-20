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
      // End of chunk (found padding char)
      chunks.push(currentChunk);
      currentChunk = null;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

function writeChunk(b64Str, chunk, dstOffset, uint8) {
  const { start, count } = chunk;
  const remain = count % 4;
  const fourCharProcessCount = Math.floor(count / 4);
  let charIdx = start;
  let tmp = null;
  let offset = dstOffset;

  // Handle 4=>3
  for (let i = 0; i < fourCharProcessCount; i++) {
    while (!isValidChar(b64Str[charIdx])) {
      charIdx++;
    }
    tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 18;
    while (!isValidChar(b64Str[charIdx])) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 12;
    while (!isValidChar(b64Str[charIdx])) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 6;
    while (!isValidChar(b64Str[charIdx])) {
      charIdx++;
    }
    tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)];

    uint8[offset++] = (tmp >> 16) & 0xff;
    uint8[offset++] = (tmp >> 8) & 0xff;
    uint8[offset++] = tmp & 0xff;
  }

  // Handle remain
  switch (remain) {
    case 3:
      while (!isValidChar(b64Str[charIdx])) {
        charIdx++;
      }
      tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 10;
      while (!isValidChar(b64Str[charIdx])) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 4;
      while (!isValidChar(b64Str[charIdx])) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] >> 2;
      uint8[offset++] = (tmp >> 8) & 0xff;
      uint8[offset++] = tmp & 0xff;
      break;
    case 2:
      while (!isValidChar(b64Str[charIdx])) {
        charIdx++;
      }
      tmp = REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] << 2;
      while (!isValidChar(b64Str[charIdx])) {
        charIdx++;
      }
      tmp |= REVERSE_LOOKUP[b64Str.charCodeAt(charIdx++)] >> 4;
      uint8[offset++] = tmp & 0xff;
      break;
    case 1:
      throw new Error('BASE64: remain 1 should not happen');
    case 0:
      break;
    default:
      break;
  }

  return offset;
}

export function toArrayBuffer(b64Str) {
  const chunks = extractChunks(b64Str);
  const totalEncodedLength = chunks[chunks.length - 1].end + 1;
  const padding = (4 - (totalEncodedLength % 4)) % 4; // -length mod 4
  // Any padding chars in the middle of b64Str is to be interpreted as \x00,
  // whereas the terminating padding chars are to be interpreted as literal padding.
  const totalSize = ((totalEncodedLength + padding) * 3) / 4 - padding;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new Uint8Array(arrayBuffer);
  let dstOffset = 0;
  for (let i = 0; i < chunks.length; i++) {
    dstOffset += writeChunk(b64Str, chunks[i], dstOffset, view);
    dstOffset += (4 - (chunks[i].count % 4)) % 4;
  }

  return arrayBuffer;
}

function encodeTriplet(v1, v2, v3) {
  const triplet = (v1 << 16) + (v2 << 8) + v3;
  return (
    BASE64_CODE[triplet >> 18] +
    BASE64_CODE[(triplet >> 12) & 0x3f] +
    BASE64_CODE[(triplet >> 6) & 0x3f] +
    BASE64_CODE[triplet & 0x3f]
  );
}

export function fromArrayBuffer(ab) {
  const uint8 = new Uint8Array(ab);
  const leftoverLength = ab.byteLength % 3;
  const maxTripletIndex = ab.byteLength - leftoverLength;
  const segments = Array(maxTripletIndex / 3);
  for (let i = 0; i < segments.length; i++) {
    const bufOffset = i * 3;
    segments[i] = encodeTriplet(
      uint8[bufOffset],
      uint8[bufOffset + 1],
      uint8[bufOffset + 2]
    );
  }
  if (leftoverLength > 0) {
    const segment = encodeTriplet(
      uint8[maxTripletIndex],
      uint8[maxTripletIndex + 1] || 0,
      uint8[maxTripletIndex + 2] || 0
    );
    if (leftoverLength === 1) {
      segments.push(`${segment.substr(0, 2)}==`);
    } else if (leftoverLength === 2) {
      segments.push(`${segment.substr(0, 3)}=`);
    }
  }
  return segments.join('');
}

export default {
  toArrayBuffer,
  fromArrayBuffer,
};
