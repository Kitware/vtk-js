import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import ImageHelper from 'vtk.js/Sources/Common/Core/ImageHelper';

const FACE_TO_INDEX = {
  xPlus: 0,
  xMinus: 1,
  yPlus: 2,
  yMinus: 3,
  zPlus: 4,
  zMinus: 5,
};

// ----------------------------------------------------------------------------
// vtkAnnotatedCubeActor
// ----------------------------------------------------------------------------

function vtkAnnotatedCubeActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnnotatedCubeActor');

  // Make sure face properties are not references to the default value
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

    const prop = Object.assign(
      {},
      model.defaultStyle,
      model[`${faceName}FaceProperty`]
    );

    // set canvas resolution
    canvas.width = prop.resolution;
    canvas.height = prop.resolution;

    const ctxt = canvas.getContext('2d');

    // set background color
    ctxt.fillStyle = prop.faceColor;
    ctxt.fillRect(0, 0, canvas.width, canvas.height);

    // draw edge
    if (prop.edgeThickness > 0) {
      ctxt.strokeStyle = prop.edgeColor;
      ctxt.lineWidth = prop.edgeThickness * canvas.width;
      ctxt.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // set face rotation
    ctxt.save();

    // vertical flip
    ctxt.translate(0, canvas.height);
    ctxt.scale(1, -1);

    ctxt.translate(canvas.width / 2, canvas.height / 2);
    ctxt.rotate(-Math.PI * (prop.faceRotation / 180.0));

    // set foreground text
    const textSize = prop.fontSizeScale(prop.resolution);
    ctxt.fillStyle = prop.fontColor;
    ctxt.textAlign = 'center';
    ctxt.textBaseline = 'middle';
    ctxt.font = `${prop.fontStyle} ${textSize}px "${prop.fontFamily}"`;
    ctxt.fillText(prop.text, 0, 0);

    ctxt.restore();

    const vtkImage = ImageHelper.canvasToImageData(canvas);
    texture.setInputData(vtkImage, FACE_TO_INDEX[faceName]);
    publicAPI.modified();
  }

  function updateAllFaceTextures() {
    cubeSource = vtkCubeSource.newInstance({
      generate3DTextureCoordinates: true,
    });

    mapper.setInputConnection(cubeSource.getOutputPort());

    updateFaceTexture('xPlus');
    updateFaceTexture('xMinus');
    updateFaceTexture('yPlus');
    updateFaceTexture('yMinus');
    updateFaceTexture('zPlus');
    updateFaceTexture('zMinus');
  }

  // public methods

  publicAPI.setDefaultStyle = (style) => {
    model.defaultStyle = Object.assign({}, model.defaultStyle, style);
    updateAllFaceTextures();
  };

  publicAPI.setXPlusFaceProperty = (prop) => updateFaceTexture('xPlus', prop);
  publicAPI.setXMinusFaceProperty = (prop) => updateFaceTexture('xMinus', prop);
  publicAPI.setYPlusFaceProperty = (prop) => updateFaceTexture('yPlus', prop);
  publicAPI.setYMinusFaceProperty = (prop) => updateFaceTexture('yMinus', prop);
  publicAPI.setZPlusFaceProperty = (prop) => updateFaceTexture('zPlus', prop);
  publicAPI.setZMinusFaceProperty = (prop) => updateFaceTexture('zMinus', prop);

  // constructor

  updateAllFaceTextures();

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
  defaultStyle: {
    text: '',
    faceColor: 'white',
    faceRotation: 0,
    fontFamily: 'Arial',
    fontColor: 'black',
    fontStyle: 'normal',
    fontSizeScale: (resolution) => resolution / 1.8,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 200,
  },
  // xPlusFaceProperty: null,
  // xMinusFaceProperty: null,
  // yPlusFaceProperty: null,
  // yMinusFaceProperty: null,
  // zPlusFaceProperty: null,
  // zMinusFaceProperty: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'defaultStyle',
    'xPlusFaceProperty',
    'xMinusFaceProperty',
    'yPlusFaceProperty',
    'yMinusFaceProperty',
    'zPlusFaceProperty',
    'zMinusFaceProperty',
  ]);

  // Object methods
  vtkAnnotatedCubeActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnnotatedCubeActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
