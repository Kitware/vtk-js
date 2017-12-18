import macro          from 'vtk.js/Sources/macro';
import vtkActor       from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper      from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkTexture     from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkCubeSource  from 'vtk.js/Sources/Filters/Sources/CubeSource';
import ImageHelper    from 'vtk.js/Sources/Common/Core/ImageHelper';

const FACE_TO_INDEX = {
  xPlus: 0,
  xMinus: 1,
  yPlus: 2,
  yMinus: 3,
  zPlus: 5,
  zMinus: 4,
};

// ----------------------------------------------------------------------------
// vtkAnnotatedCubeActor
// ----------------------------------------------------------------------------

function vtkAnnotatedCubeActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnnotatedCubeActor');

  // Make sure face properties are not references to the default value.
  model.xPlusFaceProperty = Object.assign({}, model.xPlusFaceProperty);
  model.xMinusFaceProperty = Object.assign({}, model.xMinusFaceProperty);
  model.yPlusFaceProperty = Object.assign({}, model.yPlusFaceProperty);
  model.yMinusFaceProperty = Object.assign({}, model.yMinusFaceProperty);
  model.zPlusFaceProperty = Object.assign({}, model.zPlusFaceProperty);
  model.zMinusFaceProperty = Object.assign({}, model.zMinusFaceProperty);

  // private variables

  let cubeSource = null;

  const canvas = document.createElement('canvas');
  const mapper = vtkMapper.newInstance();
  const texture = vtkTexture.newInstance();
  texture.setInterpolate(true);

  // private methods

  function updateFaceTexture(faceName, newProp = null) {
    if (newProp) {
      Object.assign(model[`${faceName}FaceProperty`], newProp);
    }

    const prop = model[`${faceName}FaceProperty`];
    const ctxt = canvas.getContext('2d');

    // set background color
    ctxt.fillStyle = prop.faceColor;
    ctxt.fillRect(0, 0, canvas.width, canvas.height);

    // draw edge
    if (model.edgeThickness > 0) {
      ctxt.strokeStyle = model.edgeColor;
      ctxt.lineWidth = model.edgeThickness * canvas.width;
      ctxt.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // set foreground text
    const textSize = canvas.width / 1.8;
    ctxt.fillStyle = model.fontColor;
    ctxt.textAlign = 'center';
    ctxt.textBaseline = 'middle';
    ctxt.font = `${model.fontStyle} ${textSize}px ${model.fontFamily}`;
    ctxt.fillText(prop.text, canvas.width / 2, canvas.height / 2);

    const vtkImage = ImageHelper.canvasToImageData(canvas);
    texture.setInputData(vtkImage, FACE_TO_INDEX[faceName]);
  }

  function updateAllFaceTextures() {
    updateFaceTexture('xPlus');
    updateFaceTexture('xMinus');
    updateFaceTexture('yPlus');
    updateFaceTexture('yMinus');
    updateFaceTexture('zPlus');
    updateFaceTexture('zMinus');
  }

  // public methods

  /**
   * Sets the cube face resolution.
   */
  publicAPI.setResolution = (resolution) => {
    model.resolution = resolution;

    cubeSource = vtkCubeSource.newInstance({
      xLength: resolution,
      yLength: resolution,
      zLength: resolution,
      generate3DTextureCoordinates: true,
    });

    mapper.setInputConnection(cubeSource.getOutputPort());

    // set canvas dimensions
    canvas.height = resolution;
    canvas.width = resolution;

    // redraw all faces
    updateAllFaceTextures();
  };

  publicAPI.setFontStyle = (style) => {
    model.fontStyle = style;
    updateAllFaceTextures();
  };

  publicAPI.setFontFamily = (family) => {
    model.fontStyle = family;
    updateAllFaceTextures();
  };

  publicAPI.setFontColor = (color) => {
    model.fontColor = color;
    updateAllFaceTextures();
  };

  /**
   * Sets edge thickness.
   *
   * Edge thickness is a value between 0.0 and 1.0, and represents
   * the fraction of the face resolution to cover (for one edge).
   */
  publicAPI.setEdgeThickness = (thickness) => {
    model.edgeThickness = Math.min(1, Math.max(0, thickness));
    updateAllFaceTextures();
  };

  /**
   * Sets the +X face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */
  publicAPI.setXPlusFaceProperty = prop => updateFaceTexture('xPlus', prop);

  /**
   * Sets the -X face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */
  publicAPI.setXMinusFaceProperty = prop => updateFaceTexture('xMinus', prop);

  /**
   * Sets the +Y face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */

  publicAPI.setYPlusFaceProperty = prop => updateFaceTexture('yPlus', prop);

  /**
   * Sets the -Y face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */
  publicAPI.setYMinusFaceProperty = prop => updateFaceTexture('yMinus', prop);

  /**
   * Sets the +Z face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */
  publicAPI.setZPlusFaceProperty = prop => updateFaceTexture('zPlus', prop);

  /**
   * Sets the -Z face property.
   *
   * This takes an object, where you can optionally set the face text
   * or the face color, e.g. { text: 'Text', faceColor: '#0000ff' }.
   */
  publicAPI.setZMinusFaceProperty = prop => updateFaceTexture('zMinus', prop);

  // constructor

  // create cube
  publicAPI.setResolution(model.resolution);

  // set mapper
  mapper.setInputConnection(cubeSource.getOutputPort());
  publicAPI.setMapper(mapper);

  // set texture
  publicAPI.addTexture(texture);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  xPlusFaceProperty: { text: '+X', faceColor: '#fff' },
  xMinusFaceProperty: { text: '-X', faceColor: '#fff' },
  yPlusFaceProperty: { text: '+Y', faceColor: '#fff' },
  yMinusFaceProperty: { text: '-Y', faceColor: '#fff' },
  zPlusFaceProperty: { text: '+Z', faceColor: '#fff' },
  zMinusFaceProperty: { text: '-Z', faceColor: '#fff' },
  fontStyle: 'normal',
  fontFamily: 'Arial',
  fontColor: 'black',
  resolution: 200,
  edgeThickness: 0.1,
  edgeColor: 'black',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'xPlusFaceProperty',
    'xMinusFaceProperty',
    'yPlusFaceProperty',
    'yMinusFaceProperty',
    'zPlusFaceProperty',
    'zMinusFaceProperty',
    'fontStyle',
    'fontFamily',
    'fontColor',
    'resolution',
    'edgeThickness',
    'edgeColor',
  ]);

  // Object methods
  vtkAnnotatedCubeActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnnotatedCubeActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
