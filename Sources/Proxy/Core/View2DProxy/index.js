import macro from 'vtk.js/Sources/macros';
import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';
import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { vec3, mat4 } from 'gl-matrix';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

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

/**
 * Returns an array of points in world coordinates creating a coarse hull
 * around the prop given in argument
 * The returned array is empty if the prop is not visible or doesn't use bounds
 *
 * How it works: if possible, combine the mapper bounds corners with the prop matrix
 * otherwise, returns the prop bounds corners
 */
function getPropCoarseHull(prop) {
  if (!prop.getVisibility() || !prop.getUseBounds()) {
    return [];
  }
  let finestBounds = prop.getBounds();
  let finestMatrix = null;

  // Better bounds using mapper bounds and prop matrix
  const mapper = prop?.getMapper?.();
  const mapperBounds = mapper?.getBounds?.();
  if (vtkBoundingBox.isValid(mapperBounds) && prop.getMatrix) {
    finestBounds = mapperBounds;
    finestMatrix = prop.getMatrix().slice();
    mat4.transpose(finestMatrix, finestMatrix);

    // Better bounds using the image data matrix and prop matrix + imageData matrix
    if (
      mapper.isA('vtkImageMapper') &&
      mapper.getInputData()?.isA('vtkImageData')
    ) {
      prop.computeMatrix();
      const imageData = mapper.getInputData();
      finestBounds = imageData.getSpatialExtent();
      const imageDataMatrix = imageData.getIndexToWorld();
      mat4.mul(finestMatrix, finestMatrix, imageDataMatrix);
    }
  }

  // Compute corners and transform them if needed
  // It gives a more accurate hull than computing the corners of a transformed bounding box
  if (!vtkBoundingBox.isValid(finestBounds)) {
    return [];
  }
  const corners = [];
  vtkBoundingBox.getCorners(finestBounds, corners);
  if (finestMatrix) {
    corners.forEach((pt) => vec3.transformMat4(pt, pt, finestMatrix));
  }

  return corners;
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

  const superInternalResetCamera = model._resetCamera;
  /**
   * If fitProps is true, calling resetCamera will exactly fit the bounds in the view
   * Exact fitting requires useParallelRendering, and an active camera
   * Otherwise, the default renderer.resetCamera is used and it uses a larger bounding box
   */
  model._resetCamera = (bounds = null) => {
    // Always reset camera first to set physicalScale, physicalTranslation and trigger events
    const initialReset = superInternalResetCamera(bounds);
    if (!model.fitProps || !model.useParallelRendering || !initialReset) {
      return initialReset;
    }

    // For each visible prop get the smallest possible convex hull using bounds corners
    const visiblePoints = [];
    if (bounds) {
      // Bounds are given as argument, use their corners
      vtkBoundingBox.getCorners(bounds, visiblePoints);
    } else {
      publicAPI
        .getRepresentations()
        .forEach((representationProxy) =>
          [representationProxy.getActors(), representationProxy.getVolumes()]
            .flat()
            .forEach((prop) => visiblePoints.push(...getPropCoarseHull(prop)))
        );
    }
    if (!visiblePoints) {
      return initialReset;
    }

    // Get the bounds in view coordinates
    const viewBounds = vtkBoundingBox.reset([]);
    const viewMatrix = model.camera.getViewMatrix();
    mat4.transpose(viewMatrix, viewMatrix);

    for (let i = 0; i < visiblePoints.length; ++i) {
      const point = visiblePoints[i];
      vec3.transformMat4(point, point, viewMatrix);
      vtkBoundingBox.addPoint(viewBounds, ...point);
    }

    // Compute parallel scale
    const view = model.renderer.getRenderWindow().getViews()[0];
    const dims = view.getViewportSize(model.renderer);
    const aspect = dims[1] && dims[0] ? dims[0] / dims[1] : 1;
    const xLength = vtkBoundingBox.getLength(viewBounds, 0);
    const yLength = vtkBoundingBox.getLength(viewBounds, 1);
    const parallelScale = 0.5 * Math.max(yLength, xLength / aspect);

    // Compute focal point and position
    const viewFocalPoint = vtkBoundingBox.getCenter(viewBounds);
    // Camera position in view coordinates is the center of the bounds in XY
    // and is (the maximum bound) + (the distance to see the bounds in perspective) in Z
    const perspectiveAngle = vtkMath.radiansFromDegrees(
      model.camera.getViewAngle()
    );
    const distance = parallelScale / Math.tan(perspectiveAngle * 0.5);
    const viewPosition = [
      viewFocalPoint[0],
      viewFocalPoint[1],
      viewBounds[5] + distance,
    ];
    const inverseViewMatrix = new Float64Array(16);
    const worldFocalPoint = new Float64Array(3);
    const worldPosition = new Float64Array(3);
    mat4.invert(inverseViewMatrix, viewMatrix);
    vec3.transformMat4(worldFocalPoint, viewFocalPoint, inverseViewMatrix);
    vec3.transformMat4(worldPosition, viewPosition, inverseViewMatrix);

    if (parallelScale <= 0) {
      return initialReset;
    }

    // Compute bounds in world coordinates
    const worldBounds = vtkBoundingBox.transformBounds(
      viewBounds,
      inverseViewMatrix
    );

    publicAPI.setCameraParameters({
      position: worldPosition,
      focalPoint: worldFocalPoint,
      bounds: worldBounds,
      parallelScale,
    });

    return true;
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
  fitProps: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkViewProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['axis']);
  macro.setGet(publicAPI, model, ['fitProps']);

  // Object specific methods
  vtkView2DProxy(publicAPI, model);
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkView2DProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
