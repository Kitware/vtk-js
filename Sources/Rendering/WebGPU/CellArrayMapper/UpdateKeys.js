// A key is a list of values that one update reads. Each frame writes the
// values again in the same order. The key tells if a value changed since
// the previous frame, with no allocation.
export function newKey() {
  return { values: [], index: 0, changed: true };
}

function beginKey(key) {
  key.index = 0;
  key.changed = false;
}

function addToKey(key, value) {
  if (key.values[key.index] !== value) {
    key.values[key.index] = value;
    key.changed = true;
  }
  key.index++;
}

// Returns true when a value changed, or when the number of values changed.
function endKey(key) {
  if (key.values.length !== key.index) {
    key.values.length = key.index;
    key.changed = true;
  }
  return key.changed;
}

// The values that updateTextures() reads. A new texture on the property or
// the actor changes the mtime of the property or the actor. The source
// textures of the previous update give their mtime and load state.
export function texturesChanged(publicAPI, model) {
  const key = model.texturesKey;
  const actor = model.WebGPUActor.getRenderable();
  const property = actor.getProperty();
  const environment =
    model.WebGPURenderer.getRenderable().getEnvironmentTexture?.();
  const idata = model.renderable.getColorTextureMap?.();
  const opaqueView = model.WebGPURenderer?.getOpaqueColorTextureView?.();
  beginKey(key);
  addToKey(key, model.device);
  addToKey(key, actor);
  addToKey(key, actor.getMTime());
  addToKey(key, property);
  addToKey(key, property.getMTime());
  addToKey(key, environment);
  addToKey(key, environment?.getMTime());
  addToKey(key, environment?.getImageLoaded?.());
  addToKey(key, idata);
  addToKey(key, idata?.getMTime());
  // The transmission background is the color texture of the opaque pass,
  // which changes when the window size changes.
  addToKey(key, opaqueView);
  addToKey(key, opaqueView?.getTexture());
  for (let i = 0; i < model.sourceTextures.length; i++) {
    const tex = model.sourceTextures[i];
    addToKey(key, tex.getMTime());
    addToKey(key, tex.getImageLoaded?.());
  }
  return endKey(key);
}

// The values that buildVertexInput() and updateCellScalarSSBO() read. When
// they do not change, the vertex input and the cell color SSBO from the
// previous build are still correct.
export function vertexInputChanged(publicAPI, model) {
  const key = model.vertexInputKey;
  const pd = model.currentInput;
  const pointData = pd.getPointData();
  const actor = model.WebGPUActor.getRenderable();
  const selector = model.WebGPURenderer?.getSelector?.();
  const colors = model.renderable.getColorMapColors?.();
  const colorCoordinates = model.renderable.getColorCoordinates();
  const lookupTable = model.renderable.getLookupTable?.();
  const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
  const tangents =
    pointData.getArrayByName?.('Tangents') ?? pointData.getTangents?.();
  beginKey(key);
  addToKey(key, model.WebGPURenderWindow.getDevice());
  addToKey(key, pd);
  addToKey(key, pd.getMTime());
  addToKey(key, pointData.getMTime());
  addToKey(key, pd.getPoints()?.getMTime());
  addToKey(key, pointData.getNormals()?.getMTime());
  addToKey(key, pointData.getTCoords()?.getMTime());
  addToKey(key, pointData.getArrayByName('TEXCOORD_1')?.getMTime());
  addToKey(key, tangents?.getMTime());
  addToKey(key, pointData.getArrayByName('JOINTS_0')?.getMTime());
  addToKey(key, pointData.getArrayByName('WEIGHTS_0')?.getMTime());
  addToKey(key, pointData.getScalars());
  addToKey(key, model.cellArray);
  addToKey(key, model.cellArray?.getMTime());
  addToKey(key, model.primitiveType);
  addToKey(key, model.cellOffset);
  addToKey(key, model.is2D);
  addToKey(key, model.renderable.getMTime());
  addToKey(key, lookupTable);
  addToKey(key, lookupTable?.getMTime());
  addToKey(key, colors);
  addToKey(key, colors?.getMTime());
  addToKey(key, colorCoordinates);
  addToKey(key, colorCoordinates?.getMTime());
  addToKey(key, actor.getProperty().getRepresentation());
  addToKey(key, shift[0]);
  addToKey(key, shift[1]);
  addToKey(key, shift[2]);
  addToKey(key, selector);
  addToKey(key, selector?.getFieldAssociation());
  return endKey(key);
}
