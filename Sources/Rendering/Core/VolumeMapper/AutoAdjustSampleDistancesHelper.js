import macro from 'vtk.js/Sources/macros';

function getFrameRate(source) {
  if (!source) {
    return null;
  }
  if (source.getRecentAnimationFrameRate) {
    return source.getRecentAnimationFrameRate();
  }
  if (source.getFrameRate) {
    return source.getFrameRate();
  }
  return null;
}

function getDesiredUpdateRate(source) {
  if (!source?.getDesiredUpdateRate) {
    return null;
  }
  return source.getDesiredUpdateRate();
}

function unsubscribe(subscription) {
  subscription?.unsubscribe?.();
}

export function implementAutoAdjustSampleDistances(publicAPI, model) {
  function getDefaultImageSampleDistanceScale() {
    if (model.autoAdjustSampleDistances) {
      return model.initialInteractionScale || 1.0;
    }
    return model.imageSampleDistance * model.imageSampleDistance;
  }

  function ensureImageSampleDistanceScale() {
    if (model._currentImageSampleDistanceScale == null) {
      model._currentImageSampleDistanceScale =
        getDefaultImageSampleDistanceScale();
    }
    return model._currentImageSampleDistanceScale;
  }

  function updateFromCurrentSource() {
    const frameRate = getFrameRate(model.autoAdjustSampleDistancesSource);
    const desiredUpdateRate = getDesiredUpdateRate(
      model.autoAdjustSampleDistancesSource
    );

    publicAPI.updateAutoAdjustSampleDistances(frameRate, desiredUpdateRate);
  }

  function updateSourceSubscription() {
    unsubscribe(model._autoAdjustSampleDistancesSubscription);
    model._autoAdjustSampleDistancesSubscription = null;

    if (model.autoAdjustSampleDistancesSource?.onAnimationFrameRateUpdate) {
      model._autoAdjustSampleDistancesSubscription =
        model.autoAdjustSampleDistancesSource.onAnimationFrameRateUpdate(
          updateFromCurrentSource
        );
    }
  }

  publicAPI.getAutoAdjustSampleDistancesSource = () =>
    model.autoAdjustSampleDistancesSource;

  publicAPI.setAutoAdjustSampleDistancesSource = (source) => {
    if (model.autoAdjustSampleDistancesSource === source) {
      return false;
    }

    model.autoAdjustSampleDistancesSource = source;
    updateSourceSubscription();
    publicAPI.modified();
    return true;
  };

  publicAPI.isAutoAdjustSampleDistancesSourceAnimating = () =>
    !!model.autoAdjustSampleDistancesSource?.isAnimating?.();

  publicAPI.getCurrentImageSampleDistanceScale = () => {
    if (!model.autoAdjustSampleDistances) {
      return model.imageSampleDistance * model.imageSampleDistance;
    }

    return ensureImageSampleDistanceScale();
  };

  publicAPI.getUseSmallViewport = () =>
    publicAPI.isAutoAdjustSampleDistancesSourceAnimating() &&
    publicAPI.getCurrentImageSampleDistanceScale() > 1.5;

  publicAPI.getCurrentSampleDistance = () => {
    const baseSampleDistance = model.sampleDistance;
    if (publicAPI.isAutoAdjustSampleDistancesSourceAnimating()) {
      return baseSampleDistance * model.interactionSampleDistanceFactor;
    }
    return baseSampleDistance;
  };

  publicAPI.updateAutoAdjustSampleDistances = (
    frameRate,
    desiredUpdateRate
  ) => {
    if (!model.autoAdjustSampleDistances) {
      model._currentImageSampleDistanceScale =
        model.imageSampleDistance * model.imageSampleDistance;
      return model._currentImageSampleDistanceScale;
    }

    const currentScale = ensureImageSampleDistanceScale();
    if (!(frameRate > 0) || !(desiredUpdateRate > 0)) {
      return currentScale;
    }

    const adjustment = desiredUpdateRate / frameRate;

    // Ignore minor noise in measured frame rates.
    if (adjustment > 1.15 || adjustment < 0.85) {
      model._currentImageSampleDistanceScale = currentScale * adjustment;
    }

    if (model._currentImageSampleDistanceScale > 400) {
      model._currentImageSampleDistanceScale = 400;
    }
    if (model._currentImageSampleDistanceScale < 1.5) {
      model._currentImageSampleDistanceScale = 1.5;
    }

    return model._currentImageSampleDistanceScale;
  };

  const superSetAutoAdjustSampleDistances =
    publicAPI.setAutoAdjustSampleDistances;
  publicAPI.setAutoAdjustSampleDistances = (autoAdjustSampleDistances) => {
    const changed = superSetAutoAdjustSampleDistances(
      autoAdjustSampleDistances
    );
    if (changed) {
      model._currentImageSampleDistanceScale =
        getDefaultImageSampleDistanceScale();
    }
    return changed;
  };

  const superSetImageSampleDistance = publicAPI.setImageSampleDistance;
  publicAPI.setImageSampleDistance = (imageSampleDistance) => {
    const changed = superSetImageSampleDistance(imageSampleDistance);
    if (changed && !model.autoAdjustSampleDistances) {
      model._currentImageSampleDistanceScale =
        imageSampleDistance * imageSampleDistance;
    }
    return changed;
  };

  publicAPI.delete = macro.chain(() => {
    unsubscribe(model._autoAdjustSampleDistancesSubscription);
    model._autoAdjustSampleDistancesSubscription = null;
  }, publicAPI.delete);

  model._currentImageSampleDistanceScale = getDefaultImageSampleDistanceScale();
  updateSourceSubscription();
}

export default {
  implementAutoAdjustSampleDistances,
};
