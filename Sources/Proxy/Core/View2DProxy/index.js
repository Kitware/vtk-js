import macro from 'vtk.js/Sources/macros';
import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';
import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const DEFAULT_STEP_WIDTH = 512;

function formatAnnotationValue(value) {
  if (Array.isArray(value)) {
    return value.map(formatAnnotationValue).join(', ');
  }
  if (Number.isInteger(value)) {
    return value;
  }
  if (Number.isFinite(value)) {
    if (Math.abs(value) < 0.01) {
      return '0';
    }
    return value.toFixed(2);
  }
  return value;
}

// ----------------------------------------------------------------------------
// vtkView2DProxy methods
// ----------------------------------------------------------------------------

function vtkView2DProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkView2DProxy');

  publicAPI.updateWidthHeightAnnotation = () => {
    const { ijkOrientation, dimensions } = model.cornerAnnotation.getMetadata();
    if (ijkOrientation && dimensions) {
      let realDimensions = dimensions;
      if (dimensions.length > 3) {
        // the dimensions is a string
        realDimensions = dimensions.split(',').map(Number);
      }
      const dop = model.camera.getDirectionOfProjection();
      const viewUp = model.camera.getViewUp();
      const viewRight = [0, 0, 0];
      vtkMath.cross(dop, viewUp, viewRight);
      const wIdx = vtkMath.getMajorAxisIndex(viewRight);
      const hIdx = vtkMath.getMajorAxisIndex(viewUp);
      const sliceWidth = realDimensions['IJK'.indexOf(ijkOrientation[wIdx])];
      const sliceHeight = realDimensions['IJK'.indexOf(ijkOrientation[hIdx])];
      publicAPI.updateCornerAnnotation({ sliceWidth, sliceHeight });
    }
  };

  const superUpdateOrientation = publicAPI.updateOrientation;
  publicAPI.updateOrientation = (axisIndex, orientation, viewUp) => {
    const promise = superUpdateOrientation(axisIndex, orientation, viewUp);

    let count = model.representations.length;
    while (count--) {
      const rep = model.representations[count];
      const slicingMode = 'XYZ'[axisIndex];
      if (rep.setSlicingMode) {
        rep.setSlicingMode(slicingMode);
      }
    }

    publicAPI.updateCornerAnnotation({ axis: 'XYZ'[axisIndex] });
    return promise;
  };

  const superAddRepresentation = publicAPI.addRepresentation;
  publicAPI.addRepresentation = (rep) => {
    superAddRepresentation(rep);
    if (rep.setSlicingMode) {
      rep.setSlicingMode('XYZ'[model.axis]);
      publicAPI.bindRepresentationToManipulator(rep);
    }
  };

  const superRemoveRepresentation = publicAPI.removeRepresentation;
  publicAPI.removeRepresentation = (rep) => {
    superRemoveRepresentation(rep);
    if (rep === model.sliceRepresentation) {
      publicAPI.bindRepresentationToManipulator(null);
      let count = model.representations.length;
      while (count--) {
        if (
          publicAPI.bindRepresentationToManipulator(
            model.representations[count]
          )
        ) {
          count = 0;
        }
      }
    }
  };

  // --------------------------------------------------------------------------
  // Range Manipulator setup
  // -------------------------------------------------------------------------

  model.rangeManipulator = vtkMouseRangeManipulator.newInstance({
    button: 1,
    scrollEnabled: true,
  });
  model.interactorStyle2D.addMouseManipulator(model.rangeManipulator);

  function setWindowWidth(windowWidth) {
    publicAPI.updateCornerAnnotation({ windowWidth });
    if (model.sliceRepresentation && model.sliceRepresentation.setWindowWidth) {
      model.sliceRepresentation.setWindowWidth(windowWidth);
    }
  }

  function setWindowLevel(windowLevel) {
    publicAPI.updateCornerAnnotation({ windowLevel });
    if (model.sliceRepresentation && model.sliceRepresentation.setWindowLevel) {
      model.sliceRepresentation.setWindowLevel(windowLevel);
    }
  }

  function setSlice(sliceRaw) {
    const numberSliceRaw = Number(sliceRaw);
    const slice = Number.isInteger(numberSliceRaw)
      ? sliceRaw
      : numberSliceRaw.toFixed(2);

    // add 'slice' in annotation
    const annotation = { slice };
    if (model.sliceRepresentation && model.sliceRepresentation.setSlice) {
      model.sliceRepresentation.setSlice(numberSliceRaw);
    }

    // extend annotation
    if (model.sliceRepresentation && model.sliceRepresentation.getAnnotations) {
      const addOn = model.sliceRepresentation.getAnnotations();
      Object.keys(addOn).forEach((key) => {
        annotation[key] = formatAnnotationValue(addOn[key]);
      });
    }

    publicAPI.updateCornerAnnotation(annotation);
  }

  publicAPI.bindRepresentationToManipulator = (representation) => {
    let nbListeners = 0;
    model.rangeManipulator.removeAllListeners();
    model.sliceRepresentation = representation;
    while (model.sliceRepresentationSubscriptions.length) {
      model.sliceRepresentationSubscriptions.pop().unsubscribe();
    }
    if (representation) {
      model.sliceRepresentationSubscriptions.push(
        model.camera.onModified(publicAPI.updateWidthHeightAnnotation)
      );
      if (representation.getWindowWidth) {
        const update = () => setWindowWidth(representation.getWindowWidth());
        const windowWidth =
          representation.getPropertyDomainByName('windowWidth');
        const { min, max } = windowWidth;

        let { step } = windowWidth;
        if (!step || step === 'any') {
          step = 1 / DEFAULT_STEP_WIDTH;
        }

        model.rangeManipulator.setVerticalListener(
          min,
          max,
          step,
          representation.getWindowWidth,
          setWindowWidth
        );
        model.sliceRepresentationSubscriptions.push(
          representation.onModified(update)
        );
        update();
        nbListeners++;
      }
      if (representation.getWindowLevel) {
        const update = () => setWindowLevel(representation.getWindowLevel());
        const windowLevel =
          representation.getPropertyDomainByName('windowLevel');
        const { min, max } = windowLevel;

        let { step } = windowLevel;
        if (!step || step === 'any') {
          step = 1 / DEFAULT_STEP_WIDTH;
        }

        model.rangeManipulator.setHorizontalListener(
          min,
          max,
          step,
          representation.getWindowLevel,
          setWindowLevel
        );
        model.sliceRepresentationSubscriptions.push(
          representation.onModified(update)
        );
        update();
        nbListeners++;
      }
      const domain = representation.getPropertyDomainByName('slice');
      if (representation.getSlice && domain) {
        const update = () => setSlice(representation.getSlice());
        model.rangeManipulator.setScrollListener(
          domain.min,
          domain.max,
          domain.step,
          representation.getSlice,
          setSlice
        );
        model.sliceRepresentationSubscriptions.push(
          representation.onModified(update)
        );
        update();
        nbListeners++;
      }
    }
    return nbListeners;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  axis: 2,
  orientation: -1,
  viewUp: [0, 1, 0],
  useParallelRendering: true,
  sliceRepresentationSubscriptions: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkViewProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['axis']);

  // Object specific methods
  vtkView2DProxy(publicAPI, model);
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkView2DProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
