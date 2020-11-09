import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkResliceCursorContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ResliceCursorContextRepresentation';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/state';

import {
  boundPoint,
  updateState,
  getViewPlaneNameFromViewType,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import { vec4, mat4 } from 'gl-matrix';

const VTK_INT_MAX = 2147483647;
const { vtkErrorMacro } = macro;
const viewUpFromViewType = {};

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkResliceCursorWidget(publicAPI, model) {
  model.classHierarchy.push('vtkResliceCursorWidget');

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  /**
   * Compute the origin of the reslice plane prior to transformations
   * It does not take into account the current view normal. (always axis aligned)
   * @param {*} viewType axial, coronal or sagittal
   */
  function computeReslicePlaneOrigin(viewType) {
    const bounds = model.widgetState.getImage().getBounds();

    const center = publicAPI.getWidgetState().getCenter();
    const imageCenter = model.widgetState.getImage().getCenter();

    // Offset based on the center of the image and how far from it the
    // reslice cursor is. This allows us to capture the whole image even
    // if we resliced in awkward places.
    const offset = [];
    for (let i = 0; i < 3; i++) {
      offset[i] = -Math.abs(center[i] - imageCenter[i]);
      offset[i] *= 2; // give us room
    }

    // Now set the size of the plane based on the location of the cursor so as to
    // at least completely cover the viewed region
    const planeSource = vtkPlaneSource.newInstance();

    if (viewType === ViewTypes.CORONAL) {
      planeSource.setOrigin(
        bounds[0] + offset[0],
        center[1],
        bounds[4] + offset[2]
      );
      planeSource.setPoint1(
        bounds[1] - offset[0],
        center[1],
        bounds[4] + offset[2]
      );
      planeSource.setPoint2(
        bounds[0] + offset[0],
        center[1],
        bounds[5] - offset[2]
      );
    } else if (viewType === ViewTypes.AXIAL) {
      planeSource.setOrigin(
        bounds[0] + offset[0],
        bounds[2] + offset[1],
        center[2]
      );
      planeSource.setPoint1(
        bounds[1] - offset[0],
        bounds[2] + offset[1],
        center[2]
      );
      planeSource.setPoint2(
        bounds[0] + offset[0],
        bounds[3] - offset[1],
        center[2]
      );
    } else if (viewType === ViewTypes.SAGITTAL) {
      planeSource.setOrigin(
        center[0],
        bounds[2] + offset[1],
        bounds[4] + offset[2]
      );
      planeSource.setPoint1(
        center[0],
        bounds[3] - offset[1],
        bounds[4] + offset[2]
      );
      planeSource.setPoint2(
        center[0],
        bounds[2] + offset[1],
        bounds[5] - offset[2]
      );
    }
    return planeSource;
  }

  function updateCamera(renderer, normal) {
    // When the reslice plane is changed, update the camera to look at the
    // normal to the reslice plane.

    const focalPoint = renderer.getActiveCamera().getFocalPoint();

    const distance = renderer.getActiveCamera().getDistance();

    const estimatedCameraPosition = vtkMath.multiplyAccumulate(
      focalPoint,
      normal,
      distance,
      [0, 0, 0]
    );

    // intersect with the plane to get updated focal point
    const intersection = vtkPlane.intersectWithLine(
      focalPoint,
      estimatedCameraPosition,
      model.widgetState.getCenter(),
      normal
    );
    const newFocalPoint = intersection.x;

    renderer
      .getActiveCamera()
      .setFocalPoint(newFocalPoint[0], newFocalPoint[1], newFocalPoint[2]);

    const newCameraPosition = vtkMath.multiplyAccumulate(
      newFocalPoint,
      normal,
      distance,
      [0, 0, 0]
    );

    renderer
      .getActiveCamera()
      .setPosition(
        newCameraPosition[0],
        newCameraPosition[1],
        newCameraPosition[2]
      );

    // Renderer may not have yet actor bounds
    const bounds = model.widgetState.getImage().getBounds();

    // Don't clip away any part of the data.
    renderer.resetCamera(bounds);
    renderer.resetCameraClippingRange(bounds);
  }

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator();

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.AXIAL:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisXinZ', 'AxisYinZ'],
            initialValues: {
              axis1Name: 'AxisXinZ',
              axis2Name: 'AxisYinZ',
              viewName: 'Z',
              rotationEnabled: model.widgetState.getEnableRotation(),
            },
          },
        ];
      case ViewTypes.CORONAL:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisXinY', 'AxisZinY'],
            initialValues: {
              axis1Name: 'AxisXinY',
              axis2Name: 'AxisZinY',
              viewName: 'Y',
              rotationEnabled: model.widgetState.getEnableRotation(),
            },
          },
        ];
      case ViewTypes.SAGITTAL:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisYinX', 'AxisZinX'],
            initialValues: {
              axis1Name: 'AxisYinX',
              axis2Name: 'AxisZinX',
              viewName: 'X',
              rotationEnabled: model.widgetState.getEnableRotation(),
            },
          },
        ];
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [];
    }
  };

  publicAPI.setImage = (image) => {
    model.widgetState.setImage(image);
    const center = image.getCenter();
    model.widgetState.setCenter(center);
    updateState(model.widgetState);
  };

  publicAPI.setCenter = (center) => {
    model.widgetState.setCenter(center);
    updateState(model.widgetState);
    publicAPI.modified();
  };

  // --------------------------------------------------------------------------
  // Methods
  // --------------------------------------------------------------------------

  publicAPI.resetCamera = (renderer, viewType) => {
    const viewName = getViewPlaneNameFromViewType(viewType);

    const center = model.widgetState.getImage().getCenter();
    const focalPoint = renderer.getActiveCamera().getFocalPoint();
    const position = renderer.getActiveCamera().getPosition();

    // Distance is preserved
    const distance = Math.sqrt(
      vtkMath.distance2BetweenPoints(position, focalPoint)
    );

    const normal = model.widgetState[`get${viewName}PlaneNormal`]();

    const estimatedFocalPoint = center;
    const estimatedCameraPosition = vtkMath.multiplyAccumulate(
      estimatedFocalPoint,
      normal,
      distance,
      [0, 0, 0]
    );

    renderer.getActiveCamera().setFocalPoint(...estimatedFocalPoint);
    renderer.getActiveCamera().setPosition(...estimatedCameraPosition);
    renderer.getActiveCamera().setViewUp(viewUpFromViewType[viewType]);

    // Project focalPoint onto image plane and preserve distance
    updateCamera(renderer, normal);
  };

  publicAPI.updateReslicePlane = (imageReslice, viewType) => {
    const plane = publicAPI.getPlaneSourceFromViewType(viewType);

    // Calculate appropriate pixel spacing for the reslicing
    const spacing = model.widgetState.getImage().getSpacing();

    const planeSource = computeReslicePlaneOrigin(viewType);
    planeSource.setNormal(...plane.getNormal());
    planeSource.setCenter(...plane.getOrigin());

    const bottomLeftPoint = planeSource.getOrigin();
    const topLeftPoint = planeSource.getPoint2();
    const viewUp = vtkMath.subtract(topLeftPoint, bottomLeftPoint, [0, 0, 0]);
    vtkMath.normalize(viewUp);
    viewUpFromViewType[viewType] = viewUp;
    let o = planeSource.getOrigin();

    let p1 = planeSource.getPoint1();
    const planeAxis1 = [];
    vtkMath.subtract(p1, o, planeAxis1);

    let p2 = planeSource.getPoint2();
    const planeAxis2 = [];
    vtkMath.subtract(p2, o, planeAxis2);

    // Clip to bounds
    const boundedOrigin = boundPoint(
      planeSource.getOrigin(),
      planeAxis1,
      planeAxis2,
      model.widgetState.getImage().getBounds()
    );

    const boundedP1 = boundPoint(
      planeSource.getPoint1(),
      planeAxis1,
      planeAxis2,
      model.widgetState.getImage().getBounds()
    );

    const boundedP2 = boundPoint(
      planeSource.getPoint2(),
      planeAxis1,
      planeAxis2,
      model.widgetState.getImage().getBounds()
    );

    planeSource.setOrigin(boundedOrigin);
    planeSource.setPoint1(boundedP1[0], boundedP1[1], boundedP1[2]);
    planeSource.setPoint2(boundedP2[0], boundedP2[1], boundedP2[2]);

    o = planeSource.getOrigin();

    p1 = planeSource.getPoint1();
    vtkMath.subtract(p1, o, planeAxis1);

    p2 = planeSource.getPoint2();
    vtkMath.subtract(p2, o, planeAxis2);

    // The x,y dimensions of the plane
    const planeSizeX = vtkMath.normalize(planeAxis1);
    const planeSizeY = vtkMath.normalize(planeAxis2);
    const normal = planeSource.getNormal();

    const newResliceAxes = mat4.create();
    mat4.identity(newResliceAxes);

    for (let i = 0; i < 3; i++) {
      newResliceAxes[4 * i + 0] = planeAxis1[i];
      newResliceAxes[4 * i + 1] = planeAxis2[i];
      newResliceAxes[4 * i + 2] = normal[i];
    }

    const spacingX =
      Math.abs(planeAxis1[0] * spacing[0]) +
      Math.abs(planeAxis1[1] * spacing[1]) +
      Math.abs(planeAxis1[2] * spacing[2]);

    const spacingY =
      Math.abs(planeAxis2[0] * spacing[0]) +
      Math.abs(planeAxis2[1] * spacing[1]) +
      Math.abs(planeAxis2[2] * spacing[2]);

    const planeOrigin = [...planeSource.getOrigin(), 1.0];
    const originXYZW = [];
    const newOriginXYZW = [];

    vec4.transformMat4(originXYZW, planeOrigin, newResliceAxes);
    mat4.transpose(newResliceAxes, newResliceAxes);
    vec4.transformMat4(newOriginXYZW, originXYZW, newResliceAxes);

    newResliceAxes[4 * 3 + 0] = newOriginXYZW[0];
    newResliceAxes[4 * 3 + 1] = newOriginXYZW[1];
    newResliceAxes[4 * 3 + 2] = newOriginXYZW[2];

    // Compute a new set of resliced extents
    let extentX = 0;
    let extentY = 0;

    // Pad extent up to a power of two for efficient texture mapping
    // make sure we're working with valid values
    const realExtentX =
      spacingX === 0 ? Number.MAX_SAFE_INTEGER : planeSizeX / spacingX;

    // Sanity check the input data:
    // * if realExtentX is too large, extentX will wrap
    // * if spacingX is 0, things will blow up.

    const value = VTK_INT_MAX >> 1; // eslint-disable-line no-bitwise

    if (realExtentX > value) {
      vtkErrorMacro(
        'Invalid X extent: ',
        realExtentX,
        ' on view type : ',
        viewType
      );
      extentX = 0;
    } else {
      extentX = 1;
      while (extentX < realExtentX) {
        extentX <<= 1; // eslint-disable-line no-bitwise
      }
    }

    // make sure extentY doesn't wrap during padding
    const realExtentY =
      spacingY === 0 ? Number.MAX_SAFE_INTEGER : planeSizeY / spacingY;

    if (realExtentY > value) {
      vtkErrorMacro(
        'Invalid Y extent:',
        realExtentY,
        ' on view type : ',
        viewType
      );
      extentY = 0;
    } else {
      extentY = 1;
      while (extentY < realExtentY) {
        extentY <<= 1; // eslint-disable-line no-bitwise
      }
    }

    const outputSpacingX = extentX === 0 ? 1.0 : planeSizeX / extentX;
    const outputSpacingY = extentY === 0 ? 1.0 : planeSizeY / extentY;

    let modified = imageReslice.setResliceAxes(newResliceAxes);
    modified =
      imageReslice.setOutputSpacing([outputSpacingX, outputSpacingY, 1]) ||
      modified;
    modified =
      imageReslice.setOutputOrigin([
        0.5 * outputSpacingX,
        0.5 * outputSpacingY,
        0,
      ]) || modified;
    modified =
      imageReslice.setOutputExtent([0, extentX - 1, 0, extentY - 1, 0, 0]) ||
      modified;

    return modified;
  };

  /**
   * Returns a plane source with origin at cursor center and
   * normal from the view.
   * @param {ViewType} type: Axial, Coronal or Sagittal
   */
  publicAPI.getPlaneSourceFromViewType = (type) => {
    const planeSource = vtkPlaneSource.newInstance();
    const widgetState = publicAPI.getWidgetState();
    const origin = widgetState.getCenter();
    planeSource.setOrigin(origin);
    let normal = [];
    switch (type) {
      case ViewTypes.AXIAL: {
        normal = widgetState.getZPlaneNormal();
        break;
      }
      case ViewTypes.CORONAL: {
        normal = widgetState.getYPlaneNormal();
        break;
      }
      case ViewTypes.SAGITTAL: {
        normal = widgetState.getXPlaneNormal();
        break;
      }
      default:
        break;
    }

    planeSource.setNormal(normal);
    planeSource.setOrigin(origin);

    return planeSource;
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  vtkResliceCursorWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkResliceCursorWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
