import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import WebworkerPromise from 'webworker-promise';

import ComputeHistogramWorker from './ComputeHistogram.worker';

/* eslint-disable no-continue */

// ----------------------------------------------------------------------------
// Global structures
// ----------------------------------------------------------------------------

const MIN_GAUSSIAN_WIDTH = 0.001;

const ACTION_TO_CURSOR = {
  adjustPosition: '-webkit-grab',
  adjustHeight: 'row-resize',
  adjustBias: 'crosshair',
  adjustWidth: 'col-resize',
  adjustZoom: 'col-resize',
};

const TOUCH_CLICK = [];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const ACTIONS = {
  adjustPosition(x, y, { originalXY, gaussian, originalGaussian }) {
    const xOffset = originalGaussian.position - originalXY[0];
    gaussian.position = x + xOffset;
    return true;
  },
  adjustHeight(x, y, { model, gaussian }) {
    gaussian.height = 1 - y;
    gaussian.height = Math.min(
      1,
      Math.max(model.gaussianMinimumHeight, gaussian.height)
    );
    return true;
  },
  adjustBias(x, y, { originalXY, gaussian, originalGaussian }) {
    gaussian.xBias =
      originalGaussian.xBias - (originalXY[0] - x) / gaussian.height;
    gaussian.yBias =
      originalGaussian.yBias + (4 * (originalXY[1] - y)) / gaussian.height;
    // Clamps
    gaussian.xBias = Math.max(-1, Math.min(1, gaussian.xBias));
    gaussian.yBias = Math.max(0, Math.min(2, gaussian.yBias));
    return true;
  },
  adjustWidth(x, y, { originalXY, gaussian, originalGaussian, gaussianSide }) {
    gaussian.width =
      gaussianSide < 0
        ? originalGaussian.width - (originalXY[0] - x)
        : originalGaussian.width + (originalXY[0] - x);
    if (gaussian.width < MIN_GAUSSIAN_WIDTH) {
      gaussian.width = MIN_GAUSSIAN_WIDTH;
    }
    return true;
  },
  adjustZoom(x, y, { rangeZoom, publicAPI }) {
    const delta = rangeZoom[1] - rangeZoom[0];
    const absNormX = (x - rangeZoom[0]) / delta;
    const minDelta = Math.abs(absNormX - rangeZoom[0]);
    const maxDelta = Math.abs(absNormX - rangeZoom[1]);
    const meanDelta = Math.abs(absNormX - 0.5 * (rangeZoom[0] + rangeZoom[1]));
    if (meanDelta < Math.min(minDelta, maxDelta)) {
      const halfDelta = delta * 0.5;
      rangeZoom[0] = Math.min(
        Math.max(absNormX - halfDelta, 0),
        rangeZoom[1] - 0.1
      );
      rangeZoom[1] = Math.max(
        Math.min(absNormX + halfDelta, 1),
        rangeZoom[0] + 0.1
      );
    } else if (minDelta < maxDelta) {
      rangeZoom[0] = Math.min(Math.max(absNormX, 0), rangeZoom[1] - 0.1);
    } else {
      rangeZoom[1] = Math.max(Math.min(absNormX, 1), rangeZoom[0] + 0.1);
    }
    publicAPI.invokeZoomChange(rangeZoom);

    // The opacity did not changed
    return false;
  },
};

// ----------------------------------------------------------------------------

function computeOpacities(gaussians, sampling = 256) {
  const opacities = [];
  while (opacities.length < sampling) {
    opacities.push(0);
  }

  let count = gaussians.length;
  while (count--) {
    const { position, height, width, xBias, yBias } = gaussians[count];
    for (let i = 0; i < sampling; i++) {
      const x = i / (sampling - 1);

      // clamp non-zero values to pos +/- width
      if (x > position + width || x < position - width) {
        if (opacities[i] < 0.0) {
          opacities[i] = 0.0;
        }
        continue;
      }

      // non-zero width
      const correctedWidth =
        width < MIN_GAUSSIAN_WIDTH ? MIN_GAUSSIAN_WIDTH : width;

      // translate the original x to a new x based on the xbias
      let x0 = 0;
      if (xBias === 0 || x === position + xBias) {
        x0 = x;
      } else if (x > position + xBias) {
        if (correctedWidth === xBias) {
          x0 = position;
        } else {
          x0 =
            position +
            (x - position - xBias) *
              (correctedWidth / (correctedWidth - xBias));
        }
      } else if (-correctedWidth === xBias) {
        // (x < pos+xBias)
        x0 = position;
      } else {
        x0 =
          position -
          (x - position - xBias) * (correctedWidth / (correctedWidth + xBias));
      }

      // center around 0 and normalize to -1,1
      const x1 = (x0 - position) / correctedWidth;

      // do a linear interpolation between:
      //    a gaussian and a parabola        if 0 < yBias <1
      //    a parabola and a step function   if 1 < yBias <2
      const h0a = Math.exp(-(4 * x1 * x1));
      const h0b = 1.0 - x1 * x1;
      const h0c = 1.0;
      let h1;
      if (yBias < 1) {
        h1 = yBias * h0b + (1 - yBias) * h0a;
      } else {
        h1 = (2 - yBias) * h0b + (yBias - 1) * h0c;
      }
      const h2 = height * h1;

      // perform the MAX over different gaussians, not the sum
      if (h2 > opacities[i]) {
        opacities[i] = h2;
      }
    }
  }

  return opacities;
}

// ----------------------------------------------------------------------------

function applyGaussianToPiecewiseFunction(
  gaussians,
  sampling,
  rangeToUse,
  piecewiseFunction
) {
  const opacities = computeOpacities(gaussians, sampling);
  const nodes = [];
  const delta = (rangeToUse[1] - rangeToUse[0]) / (opacities.length - 1);
  const midpoint = 0.5;
  const sharpness = 0;
  for (let index = 0; index < opacities.length; index++) {
    const x = rangeToUse[0] + delta * index;
    const y = opacities[index];
    nodes.push({ x, y, midpoint, sharpness });
  }

  piecewiseFunction.setNodes(nodes);
}

// ----------------------------------------------------------------------------

function drawChart(
  ctx,
  area,
  values,
  style = { lineWidth: 1, strokeStyle: '#000' }
) {
  const verticalScale = area[3];
  const horizontalScale = area[2] / (values.length - 1);
  const fill = !!style.fillStyle;
  const offset = verticalScale + area[1];

  ctx.lineWidth = style.lineWidth;
  ctx.strokeStyle = style.strokeStyle;

  ctx.beginPath();
  ctx.moveTo(area[0], area[1] + area[3]);

  for (let index = 0; index < values.length; index++) {
    ctx.lineTo(
      area[0] + index * horizontalScale,
      Math.max(area[1], offset - values[index] * verticalScale)
    );
  }

  if (fill) {
    ctx.fillStyle = style.fillStyle;
    ctx.lineTo(area[0] + area[2], area[1] + area[3]);

    if (style.clip) {
      ctx.clip();
      return;
    }

    ctx.fill();
  }
  ctx.stroke();
}

// ----------------------------------------------------------------------------

function updateColorCanvas(colorTransferFunction, width, rangeToUse, canvas) {
  const workCanvas = canvas || document.createElement('canvas');
  workCanvas.setAttribute('width', width);
  workCanvas.setAttribute('height', 256);
  const ctx = workCanvas.getContext('2d');

  const rgba = colorTransferFunction.getUint8Table(
    rangeToUse[0],
    rangeToUse[1],
    width,
    4
  );
  const pixelsArea = ctx.getImageData(0, 0, width, 256);
  for (let lineIdx = 0; lineIdx < 256; lineIdx++) {
    pixelsArea.data.set(rgba, lineIdx * 4 * width);
  }

  const nbValues = 256 * width * 4;
  const lineSize = width * 4;
  for (let i = 3; i < nbValues; i += 4) {
    pixelsArea.data[i] = 255 - Math.floor(i / lineSize);
  }

  ctx.putImageData(pixelsArea, 0, 0);
  return workCanvas;
}

// ----------------------------------------------------------------------------

function updateColorCanvasFromImage(img, width, canvas) {
  const workCanvas = canvas || document.createElement('canvas');
  workCanvas.setAttribute('width', width);
  workCanvas.setAttribute('height', 256);
  const ctx = workCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, 256);
  return workCanvas;
}

// ----------------------------------------------------------------------------

function normalizeCoordinates(x, y, subRectangeArea, zoomRange = [0, 1]) {
  return [
    zoomRange[0] +
      ((x - subRectangeArea[0]) / subRectangeArea[2]) *
        (zoomRange[1] - zoomRange[0]),
    (y - subRectangeArea[1]) / subRectangeArea[3],
  ];
}

// ----------------------------------------------------------------------------

function findGaussian(x, gaussians) {
  const distances = gaussians.map((g) => Math.abs(g.position - x));
  const min = Math.min(...distances);
  return distances.indexOf(min);
}

// ----------------------------------------------------------------------------

function createListener(callback, preventDefault = true) {
  return (e) => {
    const { offsetX, offsetY } = e;
    if (preventDefault) {
      e.preventDefault();
    }
    callback(offsetX, offsetY);
  };
}

// ----------------------------------------------------------------------------

function createTouchClickListener(...callbacks) {
  const id = TOUCH_CLICK.length;
  TOUCH_CLICK.push({
    callbacks,
    timeout: 0,
    deltaT: 200,
    count: 0,
    ready: false,
  });
  return id;
}

// ----------------------------------------------------------------------------

function processTouchClicks() {
  TOUCH_CLICK.filter((t) => t.ready).forEach((touchHandle) => {
    touchHandle.callbacks.forEach((callback) => {
      if (
        callback.touches === touchHandle.touches &&
        callback.clicks === touchHandle.count
      ) {
        callback.action(...touchHandle.singleTouche);
      }
    });

    // Clear state
    touchHandle.ts = 0;
    touchHandle.count = 0;
    touchHandle.touches = 0;
    touchHandle.ready = false;
  });
}

// ----------------------------------------------------------------------------

function createTouchListener(
  id,
  callback,
  nbTouches = 1,
  preventDefault = true
) {
  return (e) => {
    const targetBounds = e.target.getBoundingClientRect();
    const relativeTouches = Array.prototype.map.call(e.touches, (t) => [
      t.pageX - targetBounds.left,
      t.pageY - targetBounds.top,
    ]);
    const singleTouche = relativeTouches
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
      .map((v) => v / e.touches.length);

    if (e.type === 'touchstart') {
      clearTimeout(TOUCH_CLICK[id].timeout);
      TOUCH_CLICK[id].ts = e.timeStamp;
      TOUCH_CLICK[id].singleTouche = singleTouche;
      TOUCH_CLICK[id].touches = e.touches.length;
    } else if (e.type === 'touchmove') {
      TOUCH_CLICK[id].ts = 0;
      TOUCH_CLICK[id].count = 0;
      TOUCH_CLICK[id].ready = false;
    } else if (e.type === 'touchend') {
      if (e.timeStamp - TOUCH_CLICK[id].ts < TOUCH_CLICK[id].deltaT) {
        TOUCH_CLICK[id].count += 1;
        TOUCH_CLICK[id].ready = true;
        if (preventDefault) {
          e.preventDefault();
        }
        TOUCH_CLICK[id].timeout = setTimeout(
          processTouchClicks,
          TOUCH_CLICK[id].deltaT
        );
      } else {
        TOUCH_CLICK[id].ready = false;
      }
    }

    if (e.touches.length === nbTouches) {
      callback(...singleTouche);
      if (preventDefault) {
        e.preventDefault();
      }
    }
  };
}

// ----------------------------------------------------------------------------

function listenerSelector(condition, ok, ko) {
  return (e) => (condition() ? ok(e) : ko(e));
}

// ----------------------------------------------------------------------------

function rescaleArray(array, focusArea) {
  if (!focusArea) {
    return array;
  }
  const maxIdx = array.length - 1;
  const idxRange = focusArea.map((v) => Math.round(v * maxIdx));
  return array.slice(idxRange[0], idxRange[1] + 1);
}

// ----------------------------------------------------------------------------

function rescaleValue(value, focusArea) {
  if (!focusArea) {
    return value;
  }
  return (value - focusArea[0]) / (focusArea[1] - focusArea[0]);
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  applyGaussianToPiecewiseFunction,
  computeOpacities,
  createListener,
  drawChart,
  findGaussian,
  listenerSelector,
  normalizeCoordinates,
};

// ----------------------------------------------------------------------------
// vtkPiecewiseGaussianWidget methods
// ----------------------------------------------------------------------------

function vtkPiecewiseGaussianWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPiecewiseGaussianWidget');

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

  publicAPI.setGaussians = (gaussians) => {
    if (model.gaussians === gaussians) {
      return;
    }
    model.gaussians = gaussians;
    model.opacities = computeOpacities(model.gaussians, model.piecewiseSize);
    publicAPI.invokeOpacityChange(publicAPI);
    publicAPI.modified();
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
      model.colorCanvasMTime = 0;
      publicAPI.modified();
    }
  };

  publicAPI.updateStyle = (style) => {
    model.style = { ...model.style, ...style };
    publicAPI.modified();
  };

  // Method used to compute and show data distribution in the background.
  // When an array with many components is used, you can provide additional
  // information to choose which component you want to extract the histogram
  // from.

  publicAPI.setDataArray = (
    array,
    {
      numberOfBinToConsiders = 1,
      numberOfBinsToSkip = 1,
      numberOfComponents = 1,
      component = 0,
    } = {}
  ) => {
    model.histogram = null;
    model.histogramArray = array;
    model.dataRange = vtkMath.arrayRange(array, component, numberOfComponents);
    const [min, max] = model.dataRange;

    const maxNumberOfWorkers = 4;
    let arrayStride = Math.floor(array.length / maxNumberOfWorkers) || 1;
    arrayStride += arrayStride % numberOfComponents;
    let arrayIndex = 0;
    const workerChunks = [];
    const workers = [];
    while (arrayIndex < array.length) {
      const worker = new ComputeHistogramWorker();
      workers.push(worker);
      const workerPromise = new WebworkerPromise(worker);
      const arrayStart = arrayIndex;
      const arrayEnd = Math.min(arrayIndex + arrayStride, array.length - 1);
      const subArray = new array.constructor(
        array.slice(arrayStart, arrayEnd + 1)
      );
      workerChunks.push(
        workerPromise.postMessage(
          {
            array: subArray,
            component,
            numberOfComponents,
            min,
            max,
            numberOfBins: model.numberOfBins,
          },
          [subArray.buffer]
        )
      );
      arrayIndex += arrayStride;
    }
    Promise.all(workerChunks).then((subHistograms) => {
      workers.forEach((worker) => worker.terminate());
      model.histogram = new Float32Array(model.numberOfBins);
      model.histogram.fill(0);
      subHistograms.forEach((subHistogram) => {
        for (let i = 0, len = subHistogram.length; i < len; ++i) {
          model.histogram[i] += subHistogram[i];
        }
      });

      // Smart Rescale Histogram
      const sampleSize = Math.min(
        numberOfBinToConsiders,
        model.histogram.length - numberOfBinsToSkip
      );
      const sortedArray = Array.from(model.histogram);
      sortedArray.sort((a, b) => Number(a) - Number(b));
      for (let i = 0; i < numberOfBinsToSkip; i++) {
        sortedArray.pop();
      }
      while (sortedArray.length > sampleSize) {
        sortedArray.shift();
      }
      const mean = sortedArray.reduce((a, b) => a + b, 0) / sampleSize;

      for (let i = 0, len = model.histogram.length; i < len; ++i) {
        model.histogram[i] /= mean;
      }
      publicAPI.modified();
      setTimeout(publicAPI.render, 0);
    });

    publicAPI.modified();
  };

  publicAPI.onClick = (x, y) => {
    const [xNormalized, yNormalized] = normalizeCoordinates(
      x,
      y,
      model.graphArea,
      model.enableRangeZoom ? model.rangeZoom : null
    );
    if (xNormalized < 0 && model.style.iconSize > 1) {
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
          const originalGaussian = { ...gaussian };
          const action = ACTIONS.adjustPosition;
          model.activeGaussian = gaussianIdx;
          model.selectedGaussian = gaussianIdx;

          // Fake active action
          macro.setImmediate(() => {
            publicAPI.onDown(x, y);
            model.dragAction = {
              originalXY: [0, 0],
              action,
              gaussian,
              originalGaussian,
            };
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
          model.dragAction = null;
        }
      }
    } else if (
      xNormalized < 0 ||
      xNormalized > 1 ||
      yNormalized < 0 ||
      yNormalized > 1
    ) {
      model.selectedGaussian = -1;
      model.dragAction = null;
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
    // Determines the interaction region size for adjusting the Gaussian's
    // height.
    const tolerance = 20 / model.canvas.height;
    const [xNormalized, yNormalized] = normalizeCoordinates(
      x,
      y,
      model.graphArea,
      model.enableRangeZoom ? model.rangeZoom : null
    );
    const [xNormalizedAbs] = normalizeCoordinates(x, y, model.graphArea);
    const newActive =
      xNormalized < 0
        ? model.selectedGaussian
        : findGaussian(xNormalized, model.gaussians);
    model.canvas.style.cursor = 'default';
    const gaussian = model.gaussians[newActive];

    if (
      model.enableRangeZoom &&
      xNormalizedAbs >= 0 &&
      y < model.graphArea[1] - 6 // circle radius
    ) {
      const thirdDelta = (model.rangeZoom[1] - model.rangeZoom[0]) / 3;
      if (
        xNormalizedAbs < model.rangeZoom[0] + thirdDelta ||
        xNormalizedAbs > model.rangeZoom[1] - thirdDelta
      ) {
        model.canvas.style.cursor = ACTION_TO_CURSOR.adjustZoom;
      } else {
        model.canvas.style.cursor = ACTION_TO_CURSOR.adjustPosition;
      }

      model.dragAction = {
        rangeZoom: model.rangeZoom,
        action: ACTIONS.adjustZoom,
      };
    } else if (gaussian && xNormalizedAbs >= 0) {
      const invY = 1 - yNormalized;
      let actionName = null;
      if (invY > gaussian.height + tolerance) {
        actionName = 'adjustPosition';
      } else if (invY > gaussian.height - tolerance) {
        if (Math.abs(xNormalized - gaussian.position) < tolerance) {
          actionName = 'adjustHeight';
        } else {
          actionName = 'adjustPosition';
        }
      } else if (invY > gaussian.height * 0.5 + tolerance) {
        actionName = 'adjustPosition';
      } else if (invY > gaussian.height * 0.5 - tolerance) {
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
      const originalGaussian = { ...gaussian };
      model.dragAction = {
        originalXY: [xNormalized, yNormalized],
        action,
        gaussian,
        originalGaussian,
      };
    }

    if (newActive !== model.activeGaussian) {
      model.activeGaussian = newActive;
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onDown = (x, y) => {
    if (!model.mouseIsDown) {
      publicAPI.invokeAnimation(true);
    }
    model.mouseIsDown = true;
    const xNormalized = normalizeCoordinates(
      x,
      y,
      model.graphArea,
      model.enableRangeZoom ? model.rangeZoom : null
    )[0];
    const newSelected = findGaussian(xNormalized, model.gaussians);
    model.gaussianSide = 0;
    const gaussian = model.gaussians[newSelected];
    if (gaussian) {
      model.gaussianSide = gaussian.position - xNormalized;
    }

    if (newSelected !== model.selectedGaussian && xNormalized > 0) {
      model.selectedGaussian = newSelected;
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onDrag = (x, y) => {
    if (model.dragAction) {
      const [xNormalized, yNormalized] = normalizeCoordinates(
        x,
        y,
        model.graphArea,
        model.enableRangeZoom ? model.rangeZoom : null
      );
      const { action } = model.dragAction;
      if (
        action(xNormalized, yNormalized, {
          gaussianSide: model.gaussianSide,
          model,
          publicAPI,
          ...model.dragAction,
        })
      ) {
        model.opacities = computeOpacities(
          model.gaussians,
          model.piecewiseSize
        );
        publicAPI.invokeOpacityChange(publicAPI, true);
      }

      publicAPI.modified();
    }
    return true;
  };

  publicAPI.onUp = (x, y) => {
    if (model.mouseIsDown) {
      publicAPI.invokeAnimation(false);
    }
    model.mouseIsDown = false;
    return true;
  };

  publicAPI.onLeave = (x, y) => {
    publicAPI.onUp(x, y);
    model.canvas.style.cursor = 'default';
    model.activeGaussian = -1;
    publicAPI.modified();
    return true;
  };

  publicAPI.onAddGaussian = (x, y) => {
    const [xNormalized, yNormalized] = normalizeCoordinates(
      x,
      y,
      model.graphArea,
      model.enableRangeZoom ? model.rangeZoom : null
    );
    if (xNormalized >= 0) {
      publicAPI.addGaussian(xNormalized, 1 - yNormalized, 0.1, 0, 0);
    }
    return true;
  };

  publicAPI.onRemoveGaussian = (x, y) => {
    const xNormalized = normalizeCoordinates(
      x,
      y,
      model.graphArea,
      model.enableRangeZoom ? model.rangeZoom : null
    )[0];
    const newSelected = findGaussian(xNormalized, model.gaussians);
    if (xNormalized >= 0 && newSelected !== -1) {
      publicAPI.removeGaussian(newSelected);
    }
    return true;
  };

  publicAPI.bindMouseListeners = () => {
    if (!model.listeners) {
      const isDown = () => !!model.mouseIsDown;
      const touchId = createTouchClickListener(
        {
          clicks: 1,
          touches: 1,
          action: publicAPI.onClick,
        },
        {
          clicks: 2,
          touches: 1,
          action: publicAPI.onAddGaussian,
        },
        {
          clicks: 2,
          touches: 2,
          action: publicAPI.onRemoveGaussian,
        }
      );

      model.listeners = {
        mousemove: listenerSelector(
          isDown,
          createListener(publicAPI.onDrag),
          createListener(publicAPI.onHover)
        ),
        dblclick: createListener(publicAPI.onAddGaussian),
        contextmenu: createListener(publicAPI.onRemoveGaussian),
        click: createListener(publicAPI.onClick),
        mouseup: createListener(publicAPI.onUp),
        mousedown: createListener(publicAPI.onDown),
        mouseout: createListener(publicAPI.onLeave),

        touchstart: createTouchListener(
          touchId,
          macro.chain(publicAPI.onHover, publicAPI.onDown)
        ),
        touchmove: listenerSelector(
          isDown,
          createTouchListener(touchId, publicAPI.onDrag),
          createTouchListener(touchId, publicAPI.onHover)
        ),
        touchend: createTouchListener(touchId, publicAPI.onUp, 0), // touchend have 0 touch event...
      };
      Object.keys(model.listeners).forEach((eventType) => {
        model.canvas.addEventListener(
          eventType,
          model.listeners[eventType],
          false
        );
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
      Math.floor(model.style.iconSize + offset),
      Math.floor(offset),
      Math.ceil(width - 2 * offset - model.style.iconSize),
      Math.ceil(height - 2 * offset),
    ];

    const zoomControlHeight = model.style.zoomControlHeight;
    if (model.enableRangeZoom) {
      graphArea[1] += Math.floor(zoomControlHeight);
      graphArea[3] -= Math.floor(zoomControlHeight);
    }

    model.graphArea = graphArea;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.fillStyle = model.style.backgroundColor;
    ctx.fillRect(...graphArea);

    if (model.style.iconSize > 1) {
      // Draw icons
      // +
      const halfSize = Math.round(
        model.style.iconSize / 2 - model.style.strokeWidth
      );
      const center = Math.round(halfSize + offset + model.style.strokeWidth);
      ctx.beginPath();
      ctx.lineWidth = model.style.buttonStrokeWidth;
      ctx.strokeStyle = model.style.buttonStrokeColor;
      ctx.arc(center - offset / 2, center, halfSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = model.style.buttonFillColor;
      ctx.fill();
      ctx.stroke();
      ctx.moveTo(
        center - halfSize + model.style.strokeWidth + 2 - offset / 2,
        center
      );
      ctx.lineTo(
        center + halfSize - model.style.strokeWidth - 2 - offset / 2,
        center
      );
      ctx.stroke();
      ctx.moveTo(
        center - offset / 2,
        center - halfSize + model.style.strokeWidth + 2
      );
      ctx.lineTo(
        center - offset / 2,
        center + halfSize - model.style.strokeWidth - 2
      );
      ctx.stroke();

      // -
      if (model.selectedGaussian === -1) {
        ctx.fillStyle = model.style.buttonDisableFillColor;
        ctx.lineWidth = model.style.buttonDisableStrokeWidth;
        ctx.strokeStyle = model.style.buttonDisableStrokeColor;
      } else {
        ctx.fillStyle = model.style.buttonFillColor;
        ctx.lineWidth = model.style.buttonStrokeWidth;
        ctx.strokeStyle = model.style.buttonStrokeColor;
      }
      ctx.beginPath();
      ctx.arc(
        center - offset / 2,
        center + offset / 2 + model.style.iconSize,
        halfSize,
        0,
        2 * Math.PI,
        false
      );
      ctx.fill();
      ctx.stroke();
      ctx.moveTo(
        center - halfSize + model.style.strokeWidth + 2 - offset / 2,
        center + offset / 2 + model.style.iconSize
      );
      ctx.lineTo(
        center + halfSize - model.style.strokeWidth - 2 - offset / 2,
        center + offset / 2 + model.style.iconSize
      );
      ctx.stroke();
    }

    // Draw histogram
    if (model.histogram) {
      drawChart(
        ctx,
        graphArea,
        rescaleArray(model.histogram, model.rangeZoom),
        {
          lineWidth: 1,
          strokeStyle: model.style.histogramColor,
          fillStyle: model.style.histogramColor,
        }
      );
    }

    // Draw gaussians
    drawChart(
      ctx,
      graphArea,
      rescaleArray(model.opacities, model.enableRangeZoom && model.rangeZoom),
      {
        lineWidth: model.style.strokeWidth,
        strokeStyle: model.style.strokeColor,
      }
    );

    // Draw color function if any
    if (model.colorTransferFunction && model.colorTransferFunction.getSize()) {
      const rangeToUse =
        model.dataRange || model.colorTransferFunction.getMappingRange();
      if (
        !model.colorCanvas ||
        model.colorCanvasMTime !== model.colorTransferFunction.getMTime()
      ) {
        model.colorCanvasMTime = model.colorTransferFunction.getMTime();
        model.colorCanvas = updateColorCanvas(
          model.colorTransferFunction,
          graphArea[2],
          rangeToUse,
          model.colorCanvas
        );
      }
      ctx.save();
      drawChart(
        ctx,
        graphArea,
        rescaleArray(model.opacities, model.enableRangeZoom && model.rangeZoom),
        {
          lineWidth: 1,
          strokeStyle: 'rgba(0,0,0,0)',
          fillStyle: 'rgba(0,0,0,1)',
          clip: true,
        }
      );

      // Draw the correct portion of the color BG image
      if (model.enableRangeZoom) {
        ctx.drawImage(
          model.colorCanvas,
          model.rangeZoom[0] * graphArea[2],
          0,
          graphArea[2],
          graphArea[3],
          graphArea[0],
          graphArea[1],
          graphArea[2] / (model.rangeZoom[1] - model.rangeZoom[0]),
          graphArea[3]
        );
      } else {
        ctx.drawImage(model.colorCanvas, graphArea[0], graphArea[1]);
      }

      ctx.restore();
    } else if (model.backgroundImage) {
      model.colorCanvas = updateColorCanvasFromImage(
        model.backgroundImage,
        graphArea[2],
        model.colorCanvas
      );
      ctx.save();
      drawChart(
        ctx,
        graphArea,
        rescaleArray(model.opacities, model.enableRangeZoom && model.rangeZoom),
        {
          lineWidth: 1,
          strokeStyle: 'rgba(0,0,0,0)',
          fillStyle: 'rgba(0,0,0,1)',
          clip: true,
        }
      );
      ctx.drawImage(model.colorCanvas, graphArea[0], graphArea[1]);
      ctx.restore();
    }

    // Draw zoomed area
    if (model.enableRangeZoom) {
      ctx.fillStyle = model.style.zoomControlColor;

      ctx.beginPath();
      ctx.rect(
        graphArea[0] + model.rangeZoom[0] * graphArea[2],
        0,
        (model.rangeZoom[1] - model.rangeZoom[0]) * graphArea[2],
        zoomControlHeight
      );
      ctx.fill();
    }

    // Draw active gaussian
    const activeGaussian =
      model.gaussians[model.activeGaussian] ||
      model.gaussians[model.selectedGaussian];
    if (activeGaussian) {
      const activeOpacities = computeOpacities([activeGaussian], graphArea[2]);
      drawChart(
        ctx,
        graphArea,
        rescaleArray(activeOpacities, model.enableRangeZoom && model.rangeZoom),
        {
          lineWidth: model.style.activeStrokeWidth,
          strokeStyle: model.style.activeColor,
        }
      );
      // Draw controls
      const xCenter =
        graphArea[0] +
        rescaleValue(
          activeGaussian.position,
          model.enableRangeZoom && model.rangeZoom
        ) *
          graphArea[2];
      const yTop = graphArea[1] + (1 - activeGaussian.height) * graphArea[3];
      const yMiddle =
        graphArea[1] + (1 - 0.5 * activeGaussian.height) * graphArea[3];
      const yBottom = graphArea[1] + graphArea[3];
      let widthInPixel = activeGaussian.width * graphArea[2];
      if (model.enableRangeZoom) {
        widthInPixel /= model.rangeZoom[1] - model.rangeZoom[0];
      }

      ctx.lineWidth = model.style.handleWidth;
      ctx.strokeStyle = model.style.handleColor;
      ctx.fillStyle = model.style.backgroundColor;
      ctx.beginPath();
      ctx.moveTo(
        xCenter,
        graphArea[1] + (1 - activeGaussian.height) * graphArea[3]
      );
      ctx.lineTo(xCenter, graphArea[1] + graphArea[3]);
      ctx.stroke();
      // Height
      ctx.beginPath();
      ctx.arc(xCenter, yTop, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Bias
      const radius = Math.min(
        widthInPixel * 0.1,
        activeGaussian.height * graphArea[3] * 0.2
      );
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

  publicAPI.getOpacityNodes = (dataRange) => {
    const rangeToUse = dataRange || model.dataRange;
    const delta =
      (rangeToUse[1] - rangeToUse[0]) / (model.opacities.length - 1);
    const nodes = [];
    const midpoint = 0.5;
    const sharpness = 0;
    for (let index = 0; index < model.opacities.length; index++) {
      const x = rangeToUse[0] + delta * index;
      const y = model.opacities[index];
      nodes.push({ x, y, midpoint, sharpness });
    }
    return nodes;
  };

  publicAPI.applyOpacity = (piecewiseFunction, dataRange) => {
    const nodes = publicAPI.getOpacityNodes(dataRange);
    piecewiseFunction.setNodes(nodes);
  };

  publicAPI.getOpacityRange = (dataRange) => {
    const rangeToUse = dataRange || model.dataRange;
    const delta =
      (rangeToUse[1] - rangeToUse[0]) / (model.opacities.length - 1);
    let minIndex = model.opacities.length - 1;
    let maxIndex = 0;
    for (let index = 0; index < model.opacities.length; index++) {
      if (model.opacities[index] > 0) {
        minIndex = Math.min(minIndex, index);
      }
      if (model.opacities[index] > 0) {
        maxIndex = Math.max(maxIndex, index);
      }
    }
    return [rangeToUse[0] + minIndex * delta, rangeToUse[0] + maxIndex * delta];
  };

  const enableZoom = publicAPI.setEnableRangeZoom;
  publicAPI.setEnableRangeZoom = (v) => {
    const change = enableZoom(v);
    if (change) {
      model.colorCanvasMTime = 0;
      model.rangeZoom = [0, 1];
    }
    return change;
  };

  const rangeZoom = publicAPI.setRangeZoom;
  publicAPI.setRangeZoom = (...v) => {
    const change = rangeZoom(...v);
    if (change) {
      model.colorCanvasMTime = 0;
    }
    return change;
  };

  // Trigger rendering for any modified event
  publicAPI.onModified(() => publicAPI.render());
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
  colorCanvasMTime: 0,
  gaussianMinimumHeight: 0.05,
  style: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    histogramColor: 'rgba(200, 200, 200, 0.5)',
    strokeColor: 'rgb(0, 0, 0)',
    activeColor: 'rgb(0, 0, 150)',
    buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
    buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
    buttonStrokeColor: 'rgba(0, 0, 0, 1)',
    buttonFillColor: 'rgba(255, 255, 255, 1)',
    handleColor: 'rgb(0, 150, 0)',
    strokeWidth: 2,
    activeStrokeWidth: 3,
    buttonStrokeWidth: 1.5,
    handleWidth: 3,
    iconSize: 20,
    padding: 10,
    zoomControlHeight: 10,
    zoomControlColor: '#999',
  },
  activeGaussian: -1,
  selectedGaussian: -1,
  enableRangeZoom: true,
  rangeZoom: [0, 1], // normalized value
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'piecewiseSize',
    'numberOfBins',
    'colorTransferFunction',
    'backgroundImage',
    'enableRangeZoom',
    'gaussianMinimumHeight',
  ]);
  macro.setGetArray(publicAPI, model, ['rangeZoom'], 2);
  macro.get(publicAPI, model, ['size', 'canvas', 'gaussians']);
  macro.event(publicAPI, model, 'opacityChange');
  macro.event(publicAPI, model, 'animation');
  macro.event(publicAPI, model, 'zoomChange');

  // Object specific methods
  vtkPiecewiseGaussianWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPiecewiseGaussianWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
