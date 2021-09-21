import pixelmatch from 'pixelmatch';

let REMOVE_DOM_ELEMENTS = true;

function createCanvasContext() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  return { canvas, context };
}

function getImageDataFromURI(imageDataURI) {
  return new Promise((resolve, reject) => {
    const { context } = createCanvasContext();
    const img = new Image();
    img.addEventListener('load', () => {
      context.drawImage(img, 0, 0);
      resolve(context.getImageData(0, 0, img.width, img.height));
    });
    img.addEventListener('error', reject);
    img.src = imageDataURI;
  });
}

async function compareImages(
  image,
  baselines,
  testName,
  tapeContext,
  threshold = 0.5,
  nextCallback = null
) {
  let minDelta = 100;
  let minDiff = '';
  let isSameDimensions = false;
  let minIndex = 0;

  const imageUnderTest = await getImageDataFromURI(image);
  const baselineImages = await Promise.all(
    baselines.map((baseline) => getImageDataFromURI(baseline))
  );

  baselineImages.forEach((baseline, idx) => {
    const { canvas, context } = createCanvasContext();
    const { width, height } = baseline;
    const diff = context.createImageData(width, height);
    const mismatched = pixelmatch(
      imageUnderTest.data,
      baseline.data,
      diff.data,
      width,
      height,
      {
        alpha: 0.5,
        includeAA: false,
        threshold,
      }
    );
    const percentage = (mismatched / (width * height)) * 100;
    if (minDelta >= percentage) {
      minDelta = percentage;
      minDiff = canvas.toDataURL();
      isSameDimensions =
        width === imageUnderTest.width && height === imageUnderTest.height;
      minIndex = idx;
    }
  });

  tapeContext.ok(
    minDelta < threshold,
    `Matching image - delta ${minDelta.toFixed(2)}%`
  );
  tapeContext.ok(isSameDimensions, 'Image match resolution');
  if (minDelta >= threshold) {
    tapeContext.comment(
      `new image <img src="${image}" /> vs baseline <img src="${baselines[minIndex]}" /> === <img src="${minDiff}" />`
    );
    tapeContext.fail(`for ${testName} the images were different`);
  }

  if (nextCallback) {
    nextCallback();
  } else {
    tapeContext.end();
  }
}

function createGarbageCollector(testContext) {
  const resources = [];
  const domElements = [];

  function registerResource(vtkObj, priority = 0) {
    resources.push({ vtkObj, priority });
    return vtkObj;
  }

  function registerDOMElement(el) {
    domElements.push(el);
    return el;
  }

  function releaseResources() {
    // DOM Element handling
    if (REMOVE_DOM_ELEMENTS) {
      domElements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }
    while (domElements.length) {
      domElements.pop();
    }

    // vtkObject handling
    resources.sort((a, b) => b.priority - a.priority);
    resources.forEach(({ vtkObj }) => {
      if (vtkObj) {
        vtkObj.delete();
      }
    });
    while (resources.length) {
      resources.pop();
    }

    // Test end handling
    if (testContext) {
      testContext.end();
    }
  }

  return {
    registerResource,
    registerDOMElement,
    releaseResources,
  };
}

function keepDOM() {
  REMOVE_DOM_ELEMENTS = false;
}

function removeDOM() {
  REMOVE_DOM_ELEMENTS = true;
}

function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function objEquals(a, b) {
  const k1 = Object.keys(a).sort();
  const k2 = Object.keys(b).sort();
  if (!arrayEquals(k1, k2)) {
    return false;
  }
  for (let i = 0; i < k1.length; ++i) {
    if (a[k1[i]] !== b[k1[i]]) {
      return false;
    }
  }
  return true;
}

export default {
  arrayEquals,
  compareImages,
  createGarbageCollector,
  keepDOM,
  objEquals,
  removeDOM,
};
