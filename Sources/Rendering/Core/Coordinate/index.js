import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/Core/Coordinate/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { Coordinate } = Constants;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkActor methods
// ----------------------------------------------------------------------------

function vtkCoordinate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCoordinate');

  publicAPI.setValue = (...args) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return false;
    }

    let array = args;
    // allow an array passed as a single arg.
    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }

    if (array.length === 2) {
      publicAPI.setValue(array[0], array[1], 0.0);
      return true;
    }
    if (array.length !== 3) {
      throw new RangeError('Invalid number of values for array setter');
    }
    let changeDetected = false;
    model.value.forEach((item, index) => {
      if (item !== array[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected) {
      model.value = [].concat(array);
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.setCoordinateSystemToDisplay = () => {
    publicAPI.setCoordinateSystem(Coordinate.DISPLAY);
  };

  publicAPI.setCoordinateSystemToNormalizedDisplay = () => {
    publicAPI.setCoordinateSystem(Coordinate.NORMALIZED_DISPLAY);
  };

  publicAPI.setCoordinateSystemToViewport = () => {
    publicAPI.setCoordinateSystem(Coordinate.VIEWPORT);
  };

  publicAPI.setCoordinateSystemToNormalizedViewport = () => {
    publicAPI.setCoordinateSystem(Coordinate.NORMALIZED_VIEWPORT);
  };

  publicAPI.setCoordinateSystemToProjection = () => {
    publicAPI.setCoordinateSystem(Coordinate.PROJECTION);
  };

  publicAPI.setCoordinateSystemToView = () => {
    publicAPI.setCoordinateSystem(Coordinate.VIEW);
  };

  publicAPI.setCoordinateSystemToWorld = () => {
    publicAPI.setCoordinateSystem(Coordinate.WORLD);
  };

  publicAPI.getCoordinateSystemAsString = () =>
    macro.enumToString(Coordinate, model.coordinateSystem);

  publicAPI.getComputedWorldValue = (ren) => {
    let val = model.computedWorldValue;

    if (model.computing) {
      return val;
    }
    model.computing = 1;
    val[0] = model.value[0];
    val[1] = model.value[1];
    val[2] = model.value[2];

    // Use our renderer if is defined
    let renderer = ren;
    if (model.renderer) {
      renderer = model.renderer;
    }
    if (!renderer) {
      if (model.coordinateSystem === Coordinate.WORLD) {
        if (model.referenceCoordinate) {
          const refValue =
            model.referenceCoordinate.getComputedWorldValue(renderer);
          val[0] += refValue[0];
          val[1] += refValue[1];
          val[2] += refValue[2];
        }
        model.computing = 0;
      } else {
        vtkErrorMacro(
          'Attempt to compute world coordinates from another coordinate system without a renderer'
        );
      }
      return val;
    }

    // convert to current coordinate system
    let view = null;
    if (renderer && renderer.getRenderWindow().getViews()) {
      view = renderer.getRenderWindow().getViews()[0];
    } else {
      return model.computedWorldValue;
    }

    const dims = view.getViewportSize(renderer);
    const aspect = dims[0] / dims[1];

    if (
      model.referenceCoordinate &&
      model.coordinateSystem !== Coordinate.WORLD
    ) {
      const fval =
        model.referenceCoordinate.getComputedDoubleDisplayValue(renderer);
      let refValue = [fval[0], fval[1], 0.0];

      switch (model.coordinateSystem) {
        case Coordinate.NORMALIZED_DISPLAY:
          refValue = view.displayToNormalizedDisplay(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          break;
        case Coordinate.VIEWPORT:
          refValue = view.displayToNormalizedDisplay(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          refValue = view.normalizedDisplayToViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          break;
        case Coordinate.NORMALIZED_VIEWPORT:
          refValue = view.displayToNormalizedDisplay(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          refValue = view.normalizedDisplayToViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          refValue = view.viewportToNormalizedViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          break;
        case Coordinate.PROJECTION:
          refValue = view.displayToNormalizedDisplay(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          refValue = view.normalizedDisplayToViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          refValue = view.viewportToNormalizedViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          refValue = renderer.normalizedViewportToProjection(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          break;
        case Coordinate.VIEW:
          refValue = view.displayToNormalizedDisplay(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          refValue = view.normalizedDisplayToViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          refValue = view.viewportToNormalizedViewport(
            refValue[0],
            refValue[1],
            refValue[2],
            renderer
          );
          refValue = renderer.normalizedViewportToProjection(
            refValue[0],
            refValue[1],
            refValue[2]
          );
          refValue = renderer.projectionToView(
            refValue[0],
            refValue[1],
            refValue[2],
            aspect
          );
          break;
        default:
          break;
      }

      val[0] += refValue[0];
      val[1] += refValue[1];
      val[2] += refValue[2];
    }

    switch (model.coordinateSystem) {
      case Coordinate.DISPLAY:
        val = view.displayToNormalizedDisplay(val[0], val[1], val[2]);
        val = view.normalizedDisplayToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.viewportToNormalizedViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = renderer.normalizedViewportToProjection(val[0], val[1], val[2]);
        val = renderer.projectionToView(val[0], val[1], val[2], aspect);
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      case Coordinate.NORMALIZED_DISPLAY:
        val = view.normalizedDisplayToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.viewportToNormalizedViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = renderer.normalizedViewportToProjection(val[0], val[1], val[2]);
        val = renderer.projectionToView(val[0], val[1], val[2], aspect);
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      case Coordinate.VIEWPORT:
        val = view.viewportToNormalizedViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = renderer.normalizedViewportToProjection(val[0], val[1], val[2]);
        val = renderer.projectionToView(val[0], val[1], val[2], aspect);
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      case Coordinate.NORMALIZED_VIEWPORT:
        val = renderer.normalizedViewportToProjection(val[0], val[1], val[2]);
        val = renderer.projectionToView(val[0], val[1], val[2], aspect);
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      case Coordinate.PROJECTION:
        val = renderer.projectionToView(val[0], val[1], val[2], aspect);
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      case Coordinate.VIEW:
        val = renderer.viewToWorld(val[0], val[1], val[2]);
        break;
      default:
        break;
    }

    if (
      model.referenceCoordinate &&
      model.coordinateSystem === Coordinate.WORLD
    ) {
      const refValue = publicAPI.getComputedWorldValue(renderer);
      val[0] += refValue[0];
      val[1] += refValue[1];
      val[2] += refValue[2];
    }

    model.computing = 0;
    model.computedWorldValue = val.slice(0);
    return val;
  };

  publicAPI.getComputedViewportValue = (ren) => {
    const f = publicAPI.getComputedDoubleViewportValue(ren);
    return [vtkMath.round(f[0]), vtkMath.round(f[1])];
  };

  publicAPI.getComputedDisplayValue = (ren) => {
    const val = publicAPI.getComputedDoubleDisplayValue(ren);
    return [vtkMath.floor(val[0]), vtkMath.floor(val[1])];
  };

  publicAPI.getComputedLocalDisplayValue = (ren) => {
    // Use our renderer if it is defined
    let renderer = ren;
    if (model.renderer) {
      renderer = model.renderer;
    }
    let val = publicAPI.getComputedDisplayValue(renderer);

    if (!renderer) {
      vtkErrorMacro(
        'Attempt to convert to local display coordinates without a renderer'
      );
      return val;
    }

    let view = null;
    if (renderer && renderer.getRenderWindow().getViews()) {
      view = renderer.getRenderWindow().getViews()[0];
    } else {
      return val;
    }
    val = view.displayToLocalDisplay(val[0], val[1], val[2]);
    return [vtkMath.round(val[0]), vtkMath.round(val[1])];
  };

  publicAPI.getComputedDoubleViewportValue = (ren) => {
    let renderer = ren;
    if (model.renderer) {
      renderer = model.renderer;
    }
    let val = publicAPI.getComputedDoubleDisplayValue(renderer);

    if (!renderer) {
      return val;
    }
    let view = null;
    if (renderer && renderer.getRenderWindow().getViews()) {
      view = renderer.getRenderWindow().getViews()[0];
    } else {
      return val;
    }

    val = view.displayToNormalizedDisplay(val[0], val[1], val[2]);
    val = view.normalizedDisplayToViewport(val[0], val[1], val[2], renderer);

    return [val[0], val[1]];
  };

  publicAPI.getComputedDoubleDisplayValue = (ren) => {
    if (model.computing) {
      return model.computedDoubleDisplayValue;
    }
    model.computing = 1;

    let val = model.value.slice(0);
    let renderer = ren;
    if (model.renderer) {
      renderer = model.renderer;
    }
    if (!renderer) {
      if (model.coordinateSystem === Coordinate.DISPLAY) {
        model.computedDoubleDisplayValue[0] = val[0];
        model.computedDoubleDisplayValue[1] = val[1];
        if (model.referenceCoordinate) {
          const refValue =
            model.referenceCoordinate.getComputedDoubleDisplayValue();
          model.computedDoubleDisplayValue[0] += refValue[0];
          model.computedDoubleDisplayValue[1] += refValue[1];
        }
      } else {
        model.computedDoubleDisplayValue[0] = Number.MAX_VALUE;
        model.computedDoubleDisplayValue[1] = Number.MAX_VALUE;

        vtkErrorMacro(
          'Request for coordinate transformation without required viewport'
        );
      }
      return model.computedDoubleDisplayValue;
    }

    let view = null;
    if (renderer && renderer.getRenderWindow().getViews()) {
      view = renderer.getRenderWindow().getViews()[0];
    } else {
      return val;
    }

    const dims = view.getViewportSize(renderer);
    const aspect = dims[0] / dims[1];
    switch (model.coordinateSystem) {
      case Coordinate.WORLD: {
        if (model.referenceCoordinate) {
          const refValue =
            model.referenceCoordinate.getComputedWorldValue(renderer);
          val[0] += refValue[0];
          val[1] += refValue[1];
          val[2] += refValue[2];
        }
        val = renderer.worldToView(val[0], val[1], val[2]);
        val = renderer.viewToProjection(val[0], val[1], val[2], aspect);

        val = renderer.projectionToNormalizedViewport(val[0], val[1], val[2]);
        val = view.normalizedViewportToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.viewportToNormalizedDisplay(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;
      }
      case Coordinate.VIEW: {
        val = renderer.viewToProjection(val[0], val[1], val[2], aspect);
        val = renderer.projectionToNormalizedViewport(val[0], val[1], val[2]);
        val = view.normalizedViewportToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.viewportToNormalizedDisplay(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;
      }
      case Coordinate.PROJECTION: {
        val = renderer.projectionToNormalizedViewport(val[0], val[1], val[2]);
        val = view.normalizedViewportToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.viewportToNormalizedDisplay(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;
      }
      case Coordinate.NORMALIZED_VIEWPORT: {
        val = view.normalizedViewportToViewport(
          val[0],
          val[1],
          val[2],
          renderer
        );

        if (model.referenceCoordinate) {
          const refValue =
            model.referenceCoordinate.getComputedDoubleViewportValue(renderer);
          val[0] += refValue[0];
          val[1] += refValue[1];
        }

        val = view.viewportToNormalizedDisplay(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;
      }
      case Coordinate.VIEWPORT: {
        if (model.referenceCoordinate) {
          const refValue =
            model.referenceCoordinate.getComputedDoubleViewportValue(renderer);
          val[0] += refValue[0];
          val[1] += refValue[1];
        }
        val = view.viewportToNormalizedDisplay(
          val[0],
          val[1],
          val[2],
          renderer
        );
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;
      }
      case Coordinate.NORMALIZED_DISPLAY:
        val = view.normalizedDisplayToDisplay(val[0], val[1], val[2]);
        break;

      case Coordinate.USERDEFINED:
        val = model.value.slice(0);
        break;
      default:
        break;
    }

    // if we have a reference coordinate and we haven't handled it yet
    if (
      model.referenceCoordinate &&
      (model.coordinateSystem === Coordinate.DISPLAY ||
        model.coordinateSystem === Coordinate.NORMALIZED_DISPLAY)
    ) {
      const refValue =
        model.referenceCoordinate.getComputedDoubleDisplayValue(renderer);
      val[0] += refValue[0];
      val[1] += refValue[1];
    }

    model.computedDoubleDisplayValue[0] = val[0];
    model.computedDoubleDisplayValue[1] = val[1];

    model.computing = 0;

    return model.computedDoubleDisplayValue;
  };

  publicAPI.getComputedValue = (ren) => {
    let renderer = ren;
    if (model.renderer) {
      renderer = model.renderer;
    }
    switch (model.coordinateSystem) {
      case Coordinate.WORLD:
        return publicAPI.getComputedWorldValue(renderer);
      case Coordinate.VIEW:
      case Coordinate.NORMALIZED_VIEWPORT:
      case Coordinate.VIEWPORT: {
        const val = publicAPI.getComputedViewportValue(renderer);
        model.computedWorldValue[0] = val[0];
        model.computedWorldValue[1] = val[1];
        break;
      }
      case Coordinate.NORMALIZED_DISPLAY:
      case Coordinate.DISPLAY: {
        const val = model.getComputedDisplayValue(renderer);
        model.computedWorldValue[0] = val[0];
        model.computedWorldValue[1] = val[1];
        break;
      }
      default:
        break;
    }
    return model.computedWorldValue;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  coordinateSystem: Coordinate.WORLD,
  value: [0.0, 0.0, 0.0],
  renderer: null,
  referenceCoordinate: null,
  computing: 0,
  computedWorldValue: [0.0, 0.0, 0.0],
  computedDoubleDisplayValue: [0.0, 0.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  // Build VTK API
  macro.set(publicAPI, model, ['property']);
  macro.get(publicAPI, model, ['value']);
  macro.setGet(publicAPI, model, [
    'coordinateSystem',
    'referenceCoordinate',
    'renderer',
  ]);

  macro.getArray(publicAPI, model, ['value'], 3);

  // Object methods
  vtkCoordinate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCoordinate');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
