import macro from 'vtk.js/Sources/macros';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkTextProperty from 'vtk.js/Sources/Rendering/Core/TextProperty';
import ImageHelper from 'vtk.js/Sources/Common/Core/ImageHelper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkTextActor methods
// ----------------------------------------------------------------------------

function vtkTextActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTextActor');

  publicAPI.makeProperty = vtkTextProperty.newInstance;

  publicAPI.getProperty = () => {
    if (model.property === null) {
      model.property = publicAPI.makeProperty();
    }
    return model.property;
  };

  const texture = vtkTexture.newInstance({
    resizable: true,
  });
  const canvas = new OffscreenCanvas(1, 1);
  const mapper = vtkMapper2D.newInstance();
  const plane = vtkPlaneSource.newInstance({
    xResolution: 1,
    yResolution: 1,
  });

  function createImageData(text) {
    const fontSizeScale = publicAPI.getProperty().getFontSizeScale();
    const fontStyle = publicAPI.getProperty().getFontStyle();
    const fontFamily = publicAPI.getProperty().getFontFamily();
    const fontColor = publicAPI.getProperty().getFontColor();
    const shadowColor = publicAPI.getProperty().getShadowColor();
    const shadowOffset = publicAPI.getProperty().getShadowOffset();
    const shadowBlur = publicAPI.getProperty().getShadowBlur();
    const resolution = publicAPI.getProperty().getResolution();
    const backgroundColor = publicAPI.getProperty().getBackgroundColor();

    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const ctx = canvas.getContext('2d');

    // Set the text properties to measure
    const textSize = fontSizeScale(resolution) * dpr;

    ctx.font = `${fontStyle} ${textSize}px "${fontFamily}"`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Measure the text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width / dpr;

    const {
      actualBoundingBoxLeft,
      actualBoundingBoxRight,
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    } = metrics;
    const hAdjustment = (actualBoundingBoxLeft - actualBoundingBoxRight) / 2;
    const vAdjustment =
      (actualBoundingBoxAscent - actualBoundingBoxDescent) / 2;

    const textHeight = textSize / dpr - vAdjustment;

    // Update canvas size to fit text
    const [width, height] = [textWidth * dpr, textHeight * dpr];
    canvas.width = width;
    canvas.height = height;

    // Vertical flip
    ctx.translate(0, height);
    ctx.scale(1, -1);

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    if (backgroundColor) {
      ctx.fillStyle = vtkMath.floatRGB2HexCode(backgroundColor);
      ctx.fillRect(0, 0, width, height);
    }

    // Reset context after resize and prepare for rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.font = `${fontStyle} ${textSize}px "${fontFamily}"`;
    ctx.fillStyle = vtkMath.floatRGB2HexCode(fontColor);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Set shadow
    ctx.shadowColor = vtkMath.floatRGB2HexCode(shadowColor);
    ctx.shadowOffsetX = shadowOffset[0];
    ctx.shadowOffsetY = shadowOffset[1];
    ctx.shadowBlur = shadowBlur;

    // Draw the text
    ctx.fillText(text, width / 2 + hAdjustment, height / 2 + vAdjustment);

    // Update plane dimensions to match text size
    plane.set({
      point1: [width, 0, 0],
      point2: [0, height, 0],
    });

    return ImageHelper.canvasToImageData(canvas);
  }

  mapper.setInputConnection(plane.getOutputPort());

  publicAPI.setMapper(mapper);
  publicAPI.addTexture(texture);

  publicAPI.setInput = (input) => {
    if (input !== model.input && input) {
      model.input = input;
      const image = createImageData(model.input);
      texture.setInputData(image, 0);
    }
  };
}

// Default property values
const DEFAULT_VALUES = {
  mapper: null,
  property: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor2D.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, ['input']);

  // Object methods
  vtkTextActor(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkTextActor');

export default { newInstance, extend };
