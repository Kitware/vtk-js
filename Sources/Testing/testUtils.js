import resemble from 'resemblejs';

function compareImages(image, baselines, testName, tapeContext, threshold = 5, nextCallback = null) {
  let minDelta = 100;
  let isSameDimensions = false;
  baselines.forEach(baseline => {
    resemble(baseline).compareTo(image).onComplete(data => {
      minDelta = (minDelta < data.misMatchPercentage) ? minDelta : data.misMatchPercentage;
      isSameDimensions = isSameDimensions || data.isSameDimensions;
    });
  });

  tapeContext.ok(minDelta < threshold, `Matching image - delta ${minDelta}%`);
  tapeContext.ok(isSameDimensions, 'Image match resolution');


  if (minDelta >= threshold) {
    console.log(testName, image);
  }

  if (nextCallback) {
    nextCallback();
  } else {
    tapeContext.end();
  }
}

export default {
  compareImages,
};
