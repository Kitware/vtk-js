export function getEndianness() {
  const a = new ArrayBuffer(4);
  const b = new Uint8Array(a);
  const c = new Uint32Array(a);
  b[0] = 0xa1;
  b[1] = 0xb2;
  b[2] = 0xc3;
  b[3] = 0xd4;
  if (c[0] === 0xd4c3b2a1) return 'LittleEndian';
  if (c[0] === 0xa1b2c3d4) return 'BigEndian';
  return null;
}

export const ENDIANNESS = getEndianness();

export function swapBytes(buffer, wordSize) {
  if (wordSize < 2) {
    return;
  }

  const bytes = new Int8Array(buffer);
  const size = bytes.length;
  const tempBuffer = [];

  for (let i = 0; i < size; i += wordSize) {
    for (let j = 0; j < wordSize; j++) {
      tempBuffer.push(bytes[i + j]);
    }
    for (let j = 0; j < wordSize; j++) {
      bytes[i + j] = tempBuffer.pop();
    }
  }
}

export default {
  ENDIANNESS,
  getEndianness,
  swapBytes,
};
