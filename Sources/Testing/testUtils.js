import resemble from 'resemblejs';

let REMOVE_DOM_ELEMENTS = true;

function compareImages(image, baselines, testName, tapeContext, threshold = 0.5, nextCallback = null) {
  const nbBaselines = baselines.length;
  let minDelta = 100;
  let isSameDimensions = false;

  function done() {
    tapeContext.ok(minDelta < threshold, `Matching image - delta ${minDelta}%`);
    tapeContext.ok(isSameDimensions, 'Image match resolution');

    if (minDelta >= threshold) {
      tapeContext.fail(`<img src="${image}" width="100" /> vs <img src="${baselines[0]}" width="100" />`);
    }

    if (nextCallback) {
      nextCallback();
    } else {
      tapeContext.end();
    }
  }

  baselines.forEach((baseline, idx) => {
    resemble(baseline).compareTo(image).onComplete((data) => {
      minDelta = (minDelta < data.misMatchPercentage) ? minDelta : data.misMatchPercentage;
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
    resources.sort((a, b) => (b.priority - a.priority));
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


export default {
  compareImages,
  createGarbageCollector,
  keepDOM,
  removeDOM,
};
