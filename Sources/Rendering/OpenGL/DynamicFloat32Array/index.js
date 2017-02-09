export default class DynamicFloat32Array {
  constructor() {
    this.reset();
  }

  reset() {
    this.floats = [];
    this.bytes = [];
  }

  getNumberOfElements() {
    return this.floats.length;
  }

  push(value) {
    this.floats.push(value);
  }

  pushBytes(r, g, b, a = 255) {
    const offset = this.floats.length * 4;
    const bytes = Uint8Array.from([r, g, b, a]);
    this.bytes.push({ offset, bytes });
    this.floats.push(0); // place holder
  }

  pushBytesFromArray(buffer, offset = 0, length = 4, fillValue = 255) {
    const bytes = new Uint8Array(4);
    bytes[0] = (length > 0) ? buffer[offset + 0] : fillValue;
    bytes[1] = (length > 1) ? buffer[offset + 1] : fillValue;
    bytes[2] = (length > 2) ? buffer[offset + 2] : fillValue;
    bytes[3] = (length > 3) ? buffer[offset + 3] : fillValue;

    this.bytes.push({
      offset: this.floats.length * 4,
      bytes,
    });
    this.floats.push(0); // place holder
  }

  getFrozenArray() {
    const array = Float32Array.from(this.floats);
    const view = new DataView(array.buffer);
    this.bytes.forEach((entry) => {
      const { offset, bytes } = entry;
      view.setUint8(offset + 0, bytes[0]);
      view.setUint8(offset + 1, bytes[1]);
      view.setUint8(offset + 2, bytes[2]);
      view.setUint8(offset + 3, bytes[3]);
    });
    return array;
  }
}
