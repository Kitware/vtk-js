import resemble from 'resemblejs';

let REMOVE_DOM_ELEMENTS = true;

function compareImages(
  image,
  baselines,
  testName,
  tapeContext,
  threshold = 0.5,
  nextCallback = null
) {
  const nbBaselines = baselines.length;
  let minDelta = 100;
  let minDiff = '';
  let isSameDimensions = false;

  function done() {
    tapeContext.ok(minDelta < threshold, `Matching image - delta ${minDelta}%`);
    tapeContext.ok(isSameDimensions, 'Image match resolution');

    if (minDelta >= threshold) {
      tapeContext.fail(
        `new image <img src="${image}" /> vs baseline <img src="${
          baselines[0]
        }" /> === <img src="${minDiff}" />`
      );
    }

    if (nextCallback) {
      nextCallback();
    } else {
      tapeContext.end();
    }
  }

  resemble.outputSettings({
    transparency: 0.5,
  });
  baselines.forEach((baseline, idx) => {
    resemble(baseline)
      .compareTo(image)
      .ignoreAntialiasing()
      .onComplete((data) => {
        if (minDelta >= data.misMatchPercentage) {
          minDelta = data.misMatchPercentage;
          minDiff = data.getImageDataUrl();
        }
        isSameDimensions = isSameDimensions || data.isSameDimensions;

        if (idx + 1 === nbBaselines) {
          done();
        }
      });
  });
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
