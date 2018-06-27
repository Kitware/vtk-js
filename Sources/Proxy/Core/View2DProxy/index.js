import macro from 'vtk.js/Sources/macro';
import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';
import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy';

// ----------------------------------------------------------------------------
// vtkView2DProxy methods
// ----------------------------------------------------------------------------

function vtkView2DProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkView2DProxy');

  const superUpdateOrientation = publicAPI.updateOrientation;
  publicAPI.updateOrientation = (axisIndex, orientation, viewUp) => {
    superUpdateOrientation(axisIndex, orientation, viewUp);

    let count = model.representations.length;
    while (count--) {
      const rep = model.representations[count];
      const slicingMode = 'XYZ'[axisIndex];
      if (rep.setSlicingMode) {
        rep.setSlicingMode(slicingMode);
      }
    }

    publicAPI.updateCornerAnnotation({ axis: 'XYZ'[axisIndex] });
  };

  // Setup default corner annotation
  /* eslint-disable no-template-curly-in-string */
  publicAPI.setCornerAnnotation('nw', 'Orientation ${axis}<br>Slice ${slice}');
  publicAPI.setCornerAnnotation('se', 'WW ${windowWidth}<br>WL ${windowLevel}');
  publicAPI.updateCornerAnnotation({
    axis: 'N/A',
    slice: 'N/A',
    windowWidth: 'N/A',
    windowLevel: 'N/A',
  });
  /* eslint-enable no-template-curly-in-string */

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
    const slice = Number.isInteger(sliceRaw) ? sliceRaw : sliceRaw.toFixed(2);
    const annotation = { slice };
    if (model.sliceRepresentation && model.sliceRepresentation.setSlice) {
      model.sliceRepresentation.setSlice(sliceRaw);
    }
    if (model.sliceRepresentation && model.sliceRepresentation.getSliceIndex) {
      annotation.sliceIndex = model.sliceRepresentation.getSliceIndex();
    }
    if (
      model.sliceRepresentation &&
      model.sliceRepresentation.getSliceThickness
    ) {
      annotation.sliceThickness = model.sliceRepresentation
        .getSliceThickness()
        .toFixed(2);
    }
    if (
      model.sliceRepresentation &&
      model.sliceRepresentation.getSliceLocation
    ) {
      annotation.sliceLocation = model.sliceRepresentation
        .getSliceLocation()
        .toFixed(2);
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
      if (representation.getWindowWidth) {
        const update = () => setWindowWidth(representation.getWindowWidth());
        const { min, max } = representation.getPropertyDomainByName(
          'windowWidth'
        );
        model.rangeManipulator.setVerticalListener(
          min,
          max,
          1,
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
        const { min, max } = representation.getPropertyDomainByName(
          'windowLevel'
        );
        model.rangeManipulator.setHorizontalListener(
          min,
          max,
          1,
          representation.getWindowLevel,
          setWindowLevel
        );
        model.sliceRepresentationSubscriptions.push(
          representation.onModified(update)
        );
        update();
        nbListeners++;
      }
      if (representation.getSlice && representation.getSliceValues) {
        const update = () => setSlice(representation.getSlice());
        const values = representation.getSliceValues();
        model.rangeManipulator.setScrollListener(
          values[0],
          values[values.length - 1],
          values[1] - values[0],
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
