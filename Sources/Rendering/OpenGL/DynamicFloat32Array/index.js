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
    this.bytes.push(this.floats.length * 4);
    this.bytes.push(r);
    this.bytes.push(g);
    this.bytes.push(b);
    this.bytes.push(a);
    this.floats.push(0); // place holder
  }

  pushBytesFromArray(buffer, offset = 0, length = 4, fillValue = 255) {
    this.bytes.push(this.floats.length * 4);
    this.bytes.push((length > 0) ? buffer[offset + 0] : fillValue);
    this.bytes.push((length > 1) ? buffer[offset + 1] : fillValue);
    this.bytes.push((length > 2) ? buffer[offset + 2] : fillValue);
    this.bytes.push((length > 3) ? buffer[offset + 3] : fillValue);
    this.floats.push(0); // place holder
  }

  getFrozenArray() {
    const array = Float32Array.from(this.floats);
    const view = new DataView(array.buffer);
    for (let i = 0; i < this.bytes.length; i += 5) {
      view.setUint8(this.bytes[i], this.bytes[i + 1]);
      view.setUint8(this.bytes[i] + 1, this.bytes[i + 2]);
      view.setUint8(this.bytes[i] + 2, this.bytes[i + 3]);
      view.setUint8(this.bytes[i] + 3, this.bytes[i + 4]);
    }
    return array;
  }
}
