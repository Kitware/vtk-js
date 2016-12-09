export default class DynamicTypedArray {
  constructor({ chunkSize = 65536, arrayType = 'Int32Array' } = {}) {
    this.ArrayConstructor = window[arrayType];
    this.chunkSize = chunkSize;
    this.reset();
  }

  reset() {
    this.chunkContainer = [];
    this.chunkContainer.push(new this.ArrayConstructor(this.chunkSize));
    this.lastChunkItemCount = 0;
  }

  push(value) {
    if (this.lastChunkItemCount === this.chunkSize) {
      this.chunkContainer.push(new this.ArrayConstructor(this.chunkSize));
      this.lastChunkItemCount = 0;
    }
    this.chunkContainer[this.chunkContainer.length - 1][this.lastChunkItemCount] = value;
    this.lastChunkItemCount += 1;
  }

  getNumberOfElements() {
    return ((this.chunkContainer.length - 1) * this.chunkSize) + this.lastChunkItemCount;
  }

  getFrozenArray() {
    const fullArray = new this.ArrayConstructor(this.getNumberOfElements());
    for (let i = 0; i < this.chunkContainer.length - 1; ++i) {
      fullArray.set(this.chunkContainer[i], i * this.chunkSize);
    }

    const indexOfLastChunk = this.chunkContainer.length - 1;

    if (this.lastChunkItemCount < this.chunkSize) {
      const buf = this.chunkContainer[indexOfLastChunk].buffer;
      const bufLen = this.lastChunkItemCount;  // mult by 4 in case it needs number of bytes
      const partialChunkView = new this.ArrayConstructor(buf, 0, bufLen);
      fullArray.set(partialChunkView, indexOfLastChunk * this.chunkSize);
    } else {
      // If the last chunk is completely full
      fullArray.set(this.chunkContainer[indexOfLastChunk], indexOfLastChunk * this.chunkSize);
    }

    return fullArray;
  }
}
