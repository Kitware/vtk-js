export default class DynamicFloat32Array {
  constructor(size = 2048) {
    this.reset(size);
  }

  reset(size = 2048) {
    this.farray = new Float32Array(size);
    this.view = new DataView(
      this.farray.buffer, 0, this.farray.buffer.byteLength);
    this.numberOfElements = 0;
  }

  getNumberOfElements() {
    return this.numberOfElements;
  }

  push(value) {
    if (this.farray.length === this.numberOfElements) {
      // always double
      const newf = new Float32Array(this.farray.length * 2);
      newf.set(this.farray);
      this.farray = newf;
      this.view = new DataView(
        this.farray.buffer, 0, this.farray.buffer.byteLength);
    }
    this.farray[this.numberOfElements] = value;
    this.numberOfElements++;
  }

  pushBytes(r, g, b, a = 255) {
    if (this.farray.length === this.numberOfElements) {
      // always double
      const newf = new Float32Array(this.farray.length * 2);
      newf.set(this.farray);
      this.farray = newf;
      this.view = new DataView(
        this.farray.buffer, 0, this.farray.buffer.byteLength);
    }

    this.view.setUint8((this.numberOfElements * 4), r);
    this.view.setUint8((this.numberOfElements * 4) + 1, g);
    this.view.setUint8((this.numberOfElements * 4) + 2, b);
    this.view.setUint8((this.numberOfElements * 4) + 3, a);
    this.numberOfElements++;
  }

  pushBytesFromArray(buffer, offset = 0, length = 4, fillValue = 255) {
    this.pushBytes(
      (length > 0) ? buffer[offset + 0] : fillValue,
      (length > 1) ? buffer[offset + 1] : fillValue,
      (length > 2) ? buffer[offset + 2] : fillValue,
      (length > 3) ? buffer[offset + 3] : fillValue);
  }

  getFrozenArray() {
    // shrink if needed
    if (this.numberOfElements !== this.farray.length) {
      const newf = new Float32Array(this.farray.buffer.slice(0, this.numberOfElements * 4));
      this.farray = newf;
      this.view = new DataView(
        this.farray.buffer, 0, this.farray.buffer.byteLength);
    }
    return this.farray;
  }
}
