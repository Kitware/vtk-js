export interface Texture {
  _openGLRenderWindow?: null;
  _forceInternalFormat?: false;
  context?: null;
  handle?: 0;
  sendParametersTime?: null;
  textureBuildTime?: null;
  numberOfDimensions?: 0;
  target?: 0;
  format?: 0;
  openGLDataType?: 0;
  components?: 0;
  width?: 0;
  height?: 0;
  depth?: 0;
  autoParameters?: true;
  wrapS?: null;
  wrapT?: null;
  wrapR?: null;
  minificationFilter?: null;
  magnificationFilter?: null;
  minLOD?: -1000.0;
  maxLOD?: 1000.0;
  baseLevel?: 0;
  maxLevel?: 1000;
  generateMipmap?: false;
  // use half float by default, but it will get set
  // to false if the context does not support it or
  // the voxel intensity range is out of the accurate
  // range of half float
  useHalfFloat?: true;
  oglNorm16Ext?: null;
  allocatedGPUMemoryInBytes?: 0;
}
export default Texture;