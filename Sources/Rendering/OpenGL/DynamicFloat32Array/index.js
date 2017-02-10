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
    const data = new DataView(new ArrayBuffer(8));
    data.setUint32(0, this.floats.length * 4);
    data.setUint8(4, r);
    data.setUint8(5, g);
    data.setUint8(6, b);
    data.setUint8(7, a);

    this.floats.push(0); // place holder
    this.bytes.push(data);
  }

  pushBytesFromArray(buffer, offset = 0, length = 4, fillValue = 255) {
    const data = new DataView(new ArrayBuffer(8));
    data.setUint32(0, this.floats.length * 4);
    data.setUint8(4, (length > 0) ? buffer[offset + 0] : fillValue);
    data.setUint8(5, (length > 1) ? buffer[offset + 1] : fillValue);
    data.setUint8(6, (length > 2) ? buffer[offset + 2] : fillValue);
    data.setUint8(7, (length > 3) ? buffer[offset + 3] : fillValue);

    this.floats.push(0); // place holder
    this.bytes.push(data);
  }

  getFrozenArray() {
    const array = Float32Array.from(this.floats);
    const view = new DataView(array.buffer);
    this.bytes.forEach((entry) => {
      view.setFloat32(entry.getUint32(0), entry.getFloat32(4));
    });
    return array;
  }
}
