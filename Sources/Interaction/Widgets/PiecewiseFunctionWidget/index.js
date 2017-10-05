import macro from 'vtk.js/Sources/macro';

/* eslint-disable no-continue */

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const MIN_GAUSSIAN_WIDTH = 0.001;

const ACTION_TO_CURSOR = {
  adjustPosition: '-webkit-grab',
  adjustHeight: 'row-resize',
  adjustBias: 'crosshair',
  adjustWidth: 'col-resize',
};

const ACTIONS = {
  adjustPosition(x, y, originalXY, gaussian, originalGaussian) {
    const xOffset = originalGaussian.position - originalXY[0];
    gaussian.position = x + xOffset;
  },
  adjustHeight(x, y, originalXY, gaussian, originalGaussian) {
    gaussian.height = (1 - y);
    gaussian.height = Math.min(1, Math.max(0, gaussian.height));
  },
  adjustBias(x, y, originalXY, gaussian, originalGaussian) {
    gaussian.xBias = originalGaussian.xBias - ((originalXY[0] - x) / gaussian.height);
    gaussian.yBias = originalGaussian.yBias + (4 * (originalXY[1] - y) / gaussian.height);
    // Clamps
    gaussian.xBias = Math.max(-1, Math.min(1, gaussian.xBias));
    gaussian.yBias = Math.max(0, Math.min(2, gaussian.yBias));
  },
  adjustWidth(x, y, originalXY, gaussian, originalGaussian) {
    gaussian.width = originalGaussian.width - (originalXY[0] - x);
    if (gaussian.width < MIN_GAUSSIAN_WIDTH) {
      gaussian.width = MIN_GAUSSIAN_WIDTH;
    }
  },
};

function computeOpacities(gaussians, sampling = 256) {
  const opacities = [];
  while (opacities.length < sampling) {
    opacities.push(0);
  }

  gaussians.forEach(({ position, height, width, xBias, yBias }) => {
    for (let i = 0; i < sampling; i++) {
      const x = i / (sampling - 1);

      // clamp non-zero values to pos +/- width
      if (x > (position + width) || x < (position - width)) {
        if (opacities[i] < 0.0) {
          opacities[i] = 0.0;
        }
        continue;
      }

      // non-zero width
      const correctedWidth = (width < MIN_GAUSSIAN_WIDTH) ? MIN_GAUSSIAN_WIDTH : width;

      // translate the original x to a new x based on the xbias
      let x0 = 0;
      if (xBias === 0 || x === (position + xBias)) {
        x0 = x;
      } else if (x > (position + xBias)) {
        if (correctedWidth === xBias) {
          x0 = position;
        } else {
          x0 = position + ((x - position - xBias) * (correctedWidth / (correctedWidth - xBias)));
        }
      } else if (-correctedWidth === xBias) { // (x < pos+xBias)
        x0 = position;
      } else {
        x0 = position - ((x - position - xBias) * (correctedWidth / (correctedWidth + xBias)));
      }

      // center around 0 and normalize to -1,1
      const x1 = (x0 - position) / correctedWidth;

      // do a linear interpolation between:
      //    a gaussian and a parabola        if 0 < yBias <1
      //    a parabola and a step function   if 1 < yBias <2
      const h0a = Math.exp(-(4 * x1 * x1));
      const h0b = 1.0 - (x1 * x1);
      const h0c = 1.0;
      let h1;
      if (yBias < 1) {
        h1 = (yBias * h0b) + ((1 - yBias) * h0a);
      } else {
        h1 = ((2 - yBias) * h0b) + ((yBias - 1) * h0c);
      }
      const h2 = height * h1;

      // perform the MAX over different gaussians, not the sum
      if (h2 > opacities[i]) {
        opacities[i] = h2;
      }
    }
  });

  return opacities;
}

// ----------------------------------------------------------------------------

function drawChart(ctx, area, values, style = { lineWidth: 1, strokeStyle: '#000' }) {
  const verticalScale = area[3];
  const horizontalScale = area[2] / (values.length - 1);
  const height = ctx.canvas.height;
  const fill = !!style.fillStyle;

  ctx.lineWidth = style.lineWidth;
  ctx.strokeStyle = style.strokeStyle;

  ctx.beginPath();
  ctx.moveTo(area[0], height - area[1]);

  values.forEach((value, index) => {
    ctx.lineTo(area[0] + (index * horizontalScale), Math.max(area[1], height - (area[1] + (value * verticalScale))));
  });

  if (fill) {
    ctx.fillStyle = style.fillStyle;
    ctx.lineTo(area[0] + area[2], area[1] + area[3]);
    ctx.fill();
  }

  ctx.stroke();
}

// ----------------------------------------------------------------------------

function normalizeCoordinates(x, y, subRectangeArea) {
  return [
    (x - subRectangeArea[0]) / subRectangeArea[2],
    (y - subRectangeArea[1]) / subRectangeArea[3],
  ];
}

// ----------------------------------------------------------------------------

function findGaussian(x, gaussians) {
  const distances = gaussians.map(g => Math.abs(g.position - x));
  const min = Math.min(...distances);
  return distances.indexOf(min);
}

// ----------------------------------------------------------------------------

function createListener(callback) {
  return ({ offsetX, offsetY }) => callback(offsetX, offsetY);
}

// ----------------------------------------------------------------------------

function listenerSelector(condition, ok, ko) {
  return e => (condition() ? ok(e) : ko(e));
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeOpacities,
  drawChart,
  normalizeCoordinates,
  findGaussian,
  createListener,
  listenerSelector,
};

// ----------------------------------------------------------------------------
// vtkPiecewiseFunctionWidget methods
// ----------------------------------------------------------------------------

function vtkPiecewiseFunctionWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPiecewiseFunctionWidget');

  if (!model.canvas) {
    model.canvas = document.createElement('canvas');
  }

  publicAPI.setContainer = (el) => {
    if (model.container && model.container !== el) {
      model.container.removeChild(model.canvas);
    }
    if (model.container !== el) {
      model.container = el;
      if (model.container) {
        model.container.appendChild(model.canvas);
      }
      publicAPI.modified();
    }
  };

  publicAPI.addGaussian = (position, height, width, xBias, yBias) => {
    const nextIndex = model.gaussians.length;
    model.gaussians.push({ position, height, width, xBias, yBias });
    model.opacities = computeOpacities(model.gaussians, model.piecewiseSize);
    publicAPI.invokeOpacityChange(publicAPI);
    publicAPI.modified();
    return nextIndex;
  };

  publicAPI.removeGaussian = (index) => {
    model.gaussians.splice(index, 1);
    model.opacities = computeOpacities(model.gaussians, model.piecewiseSize);
    publicAPI.invokeOpacityChange(publicAPI);
    publicAPI.modified();
  };

  publicAPI.setSize = (width, height) => {
    model.canvas.setAttribute('width', width);
    model.canvas.setAttribute('height', height);

    if (model.size[0] !== width || model.size[1] !== height) {
      model.size = [width, height];
      publicAPI.modified();
    }
  };

  publicAPI.updateStyle = (style) => {
    model.style = Object.assign({}, model.style, style);
    publicAPI.modified();
  };

  publicAPI.setDataArray = (array) => {
    model.histogramArray = array;
    const size = array.length;
    let max = array[0];
    let min = array[0];
    for (let i = 1; i < size; i++) {
      max = Math.max(max, array[i]);
      min = Math.min(min, array[i]);
    }

    const delta = (max - min);
    model.dataRange = [min, max];
    model.histogram = [];
    while (model.histogram.length < model.numberOfBins) {
      model.histogram.push(0);
    }
    array.forEach((value) => {
      const idx = Math.floor((model.numberOfBins - 1) * (Number(value) - min) / delta);
      model.histogram[idx] += 1;
    });

    // Smart Rescale Histogram
    const sampleSize = Math.ceil(model.histogram.length / 4);
    const sortedArray = [].concat(model.histogram);
    sortedArray.sort((a, b) => (Number(a) - Number(b)));
    const topQuarterMean = sortedArray.slice(-sampleSize).reduce((a, b) => a + b, 0) / sampleSize;

    model.histogram = model.histogram.map(v => v / topQuarterMean);
    publicAPI.modified();
  };

  publicAPI.onClick = (x, y) => {
    const xNormalized = normalizeCoordinates(x, y, model.graphArea)[0];
    if (xNormalized < 0) {
      // Control buttons
      const delta = model.style.iconSize + model.style.padding;
      let offset = delta;
      let buttonIdx = 0;
      while (y > offset) {
        buttonIdx += 1;
        offset += delta;
      }
      switch (buttonIdx) {
        case 0: {
          const gaussianIdx = publicAPI.addGaussian(0, 1, 0.1, 0, 0);
          const gaussian = model.gaussians[gaussianIdx];
          const originalGaussian = Object.assign({}, gaussian);
          const action = ACTIONS.adjustPosition;
          model.activeGaussian = gaussianIdx;
          model.selectedGaussian = gaussianIdx;

          // Fake active action
          setImmediate(() => {
            model.mouseIsDown = true;
            model.dragAction = { position: [0, 0], action, gaussian, originalGaussian };
          });
          break;
        }
        case 1: {
          if (model.selectedGaussian !== -1) {
            publicAPI.removeGaussian(model.selectedGaussian);
          }
          break;
        }
        default: {
          model.selectedGaussian = -1;
        }
      }
    } else {
      const newSelected = findGaussian(xNormalized, model.gaussians);
      if (newSelected !== model.selectedGaussian) {
        model.selectedGaussian = newSelected;
        publicAPI.modified();
      }
    }
    return true;
  };

  publicAPI.onHover = (x, y) => {
    const [xNormalized, yNormalized] = normalizeCoordinates(x, y, model.graphArea);
    const newActive = (xNormalized < 0) ? model.selectedGaussian : findGaussian(xNormalized, model.gaussians);
    model.canvas.style.cursor = 'default';
    const gaussian = model.gaussians[newActive];
    if (gaussian && xNormalized >= 0) {
      const invY = 1 - yNormalized;
      const tolerance = 10 / model.canvas.height;
      let actionName = null;
      if (invY > gaussian.height + tolerance) {
        actionName = 'adjustPosition';
      } else if (invY > gaussian.height - tolerance) {
        actionName = 'adjustHeight';
      } else if (invY > (gaussian.height * 0.5) + tolerance) {
        actionName = 'adjustPosition';
      } else if (invY > (gaussian.height * 0.5) - tolerance) {
        if (Math.abs(xNormalized - gaussian.position) < tolerance) {
          actionName = 'adjustBias';
        } else {
          actionName = 'adjustPosition';
        }
      } else if (invY > tolerance) {
        actionName = 'adjustPosition';
      } else {
        actionName = 'adjustWidth';
      }
      model.canvas.style.cursor = ACTION_TO_CURSOR[actionName];
      const action = ACTIONS[actionName];
      const originalGaussian = Object.assign({}, gaussian);
      model.dragAction = { position: [xNormalized, yNormalized], action, gaussian, originalGaussian };
    }

    if (newActive !== model.activeGaussian) {
      model.activeGaussian = newActive;
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onDown = (x, y) => {
    model.mouseIsDown = true;
    const xNormalized = normalizeCoordinates(x, y, model.graphArea)[0];
    const newSelected = findGaussian(xNormalized, model.gaussians);
    if (newSelected !== model.selectedGaussian && xNormalized > 0) {
      model.selectedGaussian = newSelected;
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onDrag = (x, y) => {
    if (model.dragAction) {
      const [xNormalized, yNormalized] = normalizeCoordinates(x, y, model.graphArea);
      const { position, gaussian, originalGaussian, action } = model.dragAction;
      action(xNormalized, yNormalized, position, gaussian, originalGaussian);
      model.opacities = computeOpacities(model.gaussians, model.piecewiseSize);
      publicAPI.invokeOpacityChange(publicAPI, true);
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onUp = (x, y) => {
    model.mouseIsDown = false;
    return true;
  };

  publicAPI.bindMouseListeners = () => {
    if (!model.listeners) {
      const isDown = () => !!model.mouseIsDown;
      model.listeners = {
        mousemove: listenerSelector(isDown, createListener(publicAPI.onDrag), createListener(publicAPI.onHover)),
        click: createListener(publicAPI.onClick),
        mouseup: createListener(publicAPI.onUp),
        mousedown: createListener(publicAPI.onDown),
      };
      Object.keys(model.listeners).forEach((eventType) => {
        model.canvas.addEventListener(eventType, model.listeners[eventType]);
      });
    }
  };

  publicAPI.unbindMouseListeners = () => {
    if (model.listeners) {
      Object.keys(model.listeners).forEach((eventType) => {
        model.canvas.removeEventListener(eventType, model.listeners[eventType]);
      });
      delete model.listeners;
    }
  };

  publicAPI.render = () => {
    const ctx = model.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    const [width, height] = model.size;
    const offset = model.style.padding;
    const graphArea = [
      model.style.iconSize + (2 * offset),
      offset,
      width - (3 * offset) - model.style.iconSize,
      height - (2 * offset),
    ];
    model.graphArea = graphArea;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.fillStyle = model.style.backgroundColor;
    ctx.fillRect(...graphArea);

    // Draw icons
    // +
    const halfSize = Math.round((model.style.iconSize / 2) - model.style.strokeWidth);
    const center = Math.round(halfSize + offset + model.style.strokeWidth);
    ctx.beginPath();
    ctx.lineWidth = model.style.strokeWidth;
    ctx.strokeStyle = model.style.strokeColor;
    ctx.arc(center, center, halfSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = model.style.backgroundColor;
    ctx.fill();
    ctx.stroke();
    ctx.moveTo(center - halfSize + model.style.strokeWidth + 2, center);
    ctx.lineTo(center + halfSize - model.style.strokeWidth - 2, center);
    ctx.stroke();
    ctx.moveTo(center, center - halfSize + model.style.strokeWidth + 2);
    ctx.lineTo(center, center + halfSize - model.style.strokeWidth - 2);
    ctx.stroke();

    // -
    ctx.beginPath();
    ctx.arc(center, center + offset + model.style.iconSize, halfSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = (model.selectedGaussian === -1) ? model.style.disableColor : model.style.backgroundColor;
    ctx.fill();
    ctx.lineWidth = model.style.strokeWidth;
    ctx.strokeStyle = model.style.strokeColor;
    ctx.stroke();
    ctx.moveTo(center - halfSize + model.style.strokeWidth + 2, center + offset + model.style.iconSize);
    ctx.lineTo(center + halfSize - model.style.strokeWidth - 2, center + offset + model.style.iconSize);
    ctx.stroke();

    // Draw histogram
    drawChart(ctx, graphArea, model.histogram, { lineWidth: 1, strokeStyle: model.style.histogramColor, fillStyle: model.style.histogramColor });

    // Draw gaussians
    drawChart(ctx, graphArea, model.opacities, { lineWidth: model.style.strokeWidth, strokeStyle: model.style.strokeColor });

    // Draw active guassian
    const activeGaussian = model.gaussians[model.activeGaussian] || model.gaussians[model.selectedGaussian];
    if (activeGaussian) {
      const activeOpacities = computeOpacities([activeGaussian], graphArea[2]);
      drawChart(ctx, graphArea, activeOpacities, { lineWidth: model.style.strokeWidth, strokeStyle: model.style.activeColor });
      // Draw controls
      const xCenter = graphArea[0] + (activeGaussian.position * graphArea[2]);
      const yTop = graphArea[1] + ((1 - activeGaussian.height) * graphArea[3]);
      const yMiddle = graphArea[1] + ((1 - (0.5 * activeGaussian.height)) * graphArea[3]);
      const yBottom = graphArea[1] + graphArea[3];
      const widthInPixel = activeGaussian.width * graphArea[2];
      ctx.lineWidth = model.style.handleWidth;
      ctx.strokeStyle = model.style.handleColor;
      ctx.fillStyle = model.style.backgroundColor;
      ctx.beginPath();
      ctx.moveTo(xCenter, graphArea[1] + ((1 - activeGaussian.height) * graphArea[3]));
      ctx.lineTo(xCenter, graphArea[1] + graphArea[3]);
      ctx.stroke();
      // Height
      ctx.beginPath();
      ctx.arc(
        xCenter,
        yTop,
        6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Bias
      const radius = Math.min(widthInPixel * 0.1, activeGaussian.height * graphArea[3] * 0.2);
      ctx.beginPath();
      ctx.rect(xCenter - radius, yMiddle - radius, radius * 2, radius * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      // Width
      const sliderWidth = widthInPixel * 0.8;
      ctx.rect(xCenter - sliderWidth, yBottom - 5, 2 * sliderWidth, 10);
      ctx.fill();
      ctx.stroke();
    }
  };

  publicAPI.applyOpacity = (piecewiseFunction, dataRange) => {
    const rangeToUse = dataRange || model.dataRange;
    const delta = (rangeToUse[1] - rangeToUse[0]) / (model.opacities.length - 1);
    const nodes = [];
    const midpoint = 0.5;
    const sharpness = 0;
    piecewiseFunction.removeAllPoints();
    model.opacities.forEach((y, index) => {
      const x = rangeToUse[0] + (delta * index);
      nodes.push({ x, y, midpoint, sharpness });
    });
    piecewiseFunction.set({ nodes }, true);
    piecewiseFunction.sortAndUpdateRange();
  };

  // Trigger rendering for any modified event
  publicAPI.onModified(publicAPI.render);
  publicAPI.setSize(...model.size);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  histogram: [],
  numberOfBins: 256,
  histogramArray: null,
  dataRange: [0, 1],
  gaussians: [],
  opacities: [],
  size: [600, 300],
  piecewiseSize: 256,
  style: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    histogramColor: 'rgba(200, 200, 200, 0.5)',
    strokeColor: 'rgb(0, 0, 0)',
    activeColor: 'rgb(0, 0, 150)',
    disableColor: 'rgba(200, 200, 200, 0.5)',
    handleColor: 'rgb(0, 150, 0)',
    strokeWidth: 2,
    handleWidth: 3,
    iconSize: 32,
    padding: 10,
  },
  activeGaussian: -1,
  selectedGaussian: -1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['piecewiseSize', 'numberOfBins']);
  macro.get(publicAPI, model, ['size', 'canvas']);
  macro.event(publicAPI, model, 'opacityChange');

  // Object specific methods
  vtkPiecewiseFunctionWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPiecewiseFunctionWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
