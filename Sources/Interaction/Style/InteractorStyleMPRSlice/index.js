import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballRotateManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballPanManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import vtkMouseCameraTrackballZoomManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';
import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function boundsToCorners(bounds) {
  return [
    [bounds[0], bounds[2], bounds[4]],
    [bounds[0], bounds[2], bounds[5]],
    [bounds[0], bounds[3], bounds[4]],
    [bounds[0], bounds[3], bounds[5]],
    [bounds[1], bounds[2], bounds[4]],
    [bounds[1], bounds[2], bounds[5]],
    [bounds[1], bounds[3], bounds[4]],
    [bounds[1], bounds[3], bounds[5]],
  ];
}

// ----------------------------------------------------------------------------

function clamp(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

// ----------------------------------------------------------------------------
// vtkInteractorStyleMPRSlice methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleMPRSlice(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleMPRSlice');

  model.trackballManipulator =
    vtkMouseCameraTrackballRotateManipulator.newInstance({
      button: 1,
    });
  model.panManipulator = vtkMouseCameraTrackballPanManipulator.newInstance({
    button: 1,
    shift: true,
  });
  model.zoomManipulator = vtkMouseCameraTrackballZoomManipulator.newInstance({
    button: 3,
  });
  model.scrollManipulator = vtkMouseRangeManipulator.newInstance({
    scrollEnabled: true,
    dragEnabled: false,
  });

  // cache for sliceRange
  const cache = {
    sliceNormal: [0, 0, 0],
    sliceRange: [0, 0],
  };

  let cameraSub = null;

  function updateScrollManipulator() {
    const range = publicAPI.getSliceRange();
    model.scrollManipulator.removeScrollListener();
    model.scrollManipulator.setScrollListener(
      range[0],
      range[1],
      1,
      publicAPI.getSlice,
      publicAPI.setSlice
    );
  }

  function setManipulators() {
    publicAPI.removeAllMouseManipulators();
    publicAPI.addMouseManipulator(model.trackballManipulator);
    publicAPI.addMouseManipulator(model.panManipulator);
    publicAPI.addMouseManipulator(model.zoomManipulator);
    publicAPI.addMouseManipulator(model.scrollManipulator);
    updateScrollManipulator();
  }

  const superSetInteractor = publicAPI.setInteractor;
  publicAPI.setInteractor = (interactor) => {
    superSetInteractor(interactor);

    if (cameraSub) {
      cameraSub.unsubscribe();
      cameraSub = null;
    }

    if (interactor) {
      const renderer = interactor.getCurrentRenderer();
      const camera = renderer.getActiveCamera();

      cameraSub = camera.onModified(() => {
        updateScrollManipulator();
        publicAPI.modified();
      });
    }
  };

  publicAPI.handleMouseMove = macro.chain(publicAPI.handleMouseMove, () => {
    const renderer = model._interactor.getCurrentRenderer();
    const camera = renderer.getActiveCamera();
    const dist = camera.getDistance();
    camera.setClippingRange(dist, dist + 0.1);
  });

  const superSetVolumeMapper = publicAPI.setVolumeMapper;
  publicAPI.setVolumeMapper = (mapper) => {
    if (superSetVolumeMapper(mapper)) {
      const renderer = model._interactor.getCurrentRenderer();
      const camera = renderer.getActiveCamera();
      if (mapper) {
        // prevent zoom manipulator from messing with our focal point
        camera.setFreezeFocalPoint(true);
        publicAPI.setSliceNormal(...publicAPI.getSliceNormal());
      } else {
        camera.setFreezeFocalPoint(false);
      }
    }
  };

  publicAPI.getSlice = () => {
    const renderer = model._interactor.getCurrentRenderer();
    const camera = renderer.getActiveCamera();
    const sliceNormal = publicAPI.getSliceNormal();

    // Get rotation matrix from normal to +X (since bounds is aligned to XYZ)
    const transform = vtkMatrixBuilder
      .buildFromDegree()
      .identity()
      .rotateFromDirections(sliceNormal, [1, 0, 0]);

    const fp = camera.getFocalPoint();
    transform.apply(fp);
    return fp[0];
  };

  publicAPI.setSlice = (slice) => {
    const renderer = model._interactor.getCurrentRenderer();
    const camera = renderer.getActiveCamera();

    if (model.volumeMapper) {
      const range = publicAPI.getSliceRange();
      const bounds = model.volumeMapper.getBounds();

      const clampedSlice = clamp(slice, ...range);
      const center = [
        (bounds[0] + bounds[1]) / 2.0,
        (bounds[2] + bounds[3]) / 2.0,
        (bounds[4] + bounds[5]) / 2.0,
      ];

      const distance = camera.getDistance();
      const dop = camera.getDirectionOfProjection();
      vtkMath.normalize(dop);

      const midPoint = (range[1] + range[0]) / 2.0;
      const zeroPoint = [
        center[0] - dop[0] * midPoint,
        center[1] - dop[1] * midPoint,
        center[2] - dop[2] * midPoint,
      ];
      const slicePoint = [
        zeroPoint[0] + dop[0] * clampedSlice,
        zeroPoint[1] + dop[1] * clampedSlice,
        zeroPoint[2] + dop[2] * clampedSlice,
      ];

      const newPos = [
        slicePoint[0] - dop[0] * distance,
        slicePoint[1] - dop[1] * distance,
        slicePoint[2] - dop[2] * distance,
      ];

      camera.setPosition(...newPos);
      camera.setFocalPoint(...slicePoint);
    }
  };

  publicAPI.getSliceRange = () => {
    if (model.volumeMapper) {
      const sliceNormal = publicAPI.getSliceNormal();

      if (
        sliceNormal[0] === cache.sliceNormal[0] &&
        sliceNormal[1] === cache.sliceNormal[1] &&
        sliceNormal[2] === cache.sliceNormal[2]
      ) {
        return cache.sliceRange;
      }

      const bounds = model.volumeMapper.getBounds();
      const points = boundsToCorners(bounds);

      // Get rotation matrix from normal to +X (since bounds is aligned to XYZ)
      const transform = vtkMatrixBuilder
        .buildFromDegree()
        .identity()
        .rotateFromDirections(sliceNormal, [1, 0, 0]);

      points.forEach((pt) => transform.apply(pt));

      // range is now maximum X distance
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < 8; i++) {
        const x = points[i][0];
        if (x > maxX) {
          maxX = x;
        }
        if (x < minX) {
          minX = x;
        }
      }

      cache.sliceNormal = sliceNormal;
      cache.sliceRange = [minX, maxX];
      return cache.sliceRange;
    }
    return [0, 0];
  };

  // Slice normal is just camera DOP
  publicAPI.getSliceNormal = () => {
    if (model.volumeMapper) {
      const renderer = model._interactor.getCurrentRenderer();
      const camera = renderer.getActiveCamera();
      return camera.getDirectionOfProjection();
    }
    return [0, 0, 0];
  };

  // in world space
  publicAPI.setSliceNormal = (...normal) => {
    const renderer = model._interactor.getCurrentRenderer();
    const camera = renderer.getActiveCamera();

    vtkMath.normalize(normal);

    if (model.volumeMapper) {
      const bounds = model.volumeMapper.getBounds();

      // diagonal will be used as "width" of camera scene
      const diagonal = Math.sqrt(
        vtkMath.distance2BetweenPoints(
          [bounds[0], bounds[2], bounds[4]],
          [bounds[1], bounds[3], bounds[5]]
        )
      );

      // center will be used as initial focal point
      const center = [
        (bounds[0] + bounds[1]) / 2.0,
        (bounds[2] + bounds[3]) / 2.0,
        (bounds[4] + bounds[5]) / 2.0,
      ];

      const angle = 90;
      // distance from camera to focal point
      const dist = diagonal / (2 * Math.tan((angle / 360) * Math.PI));

      const cameraPos = [
        center[0] - normal[0] * dist,
        center[1] - normal[1] * dist,
        center[2] - normal[2] * dist,
      ];

      // set viewUp based on DOP rotation
      const oldDop = camera.getDirectionOfProjection();
      const transform = vtkMatrixBuilder
        .buildFromDegree()
        .identity()
        .rotateFromDirections(oldDop, normal);

      const viewUp = [0, 1, 0];
      transform.apply(viewUp);

      camera.setPosition(...cameraPos);
      camera.setDistance(dist);
      // should be set after pos and distance
      camera.setDirectionOfProjection(...normal);
      camera.setViewUp(...viewUp);
      camera.setViewAngle(angle);
      camera.setClippingRange(dist, dist + 0.1);

      publicAPI.setCenterOfRotation(center);
    }
  };

  setManipulators();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleManipulator.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['volumeMapper']);

  // Object specific methods
  vtkInteractorStyleMPRSlice(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleMPRSlice'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
