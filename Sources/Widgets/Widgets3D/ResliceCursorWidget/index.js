import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkResliceCursorContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ResliceCursorContextRepresentation';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/state';
import {
  boundPlane,
  updateState,
  transformPlane,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import { vec4, mat4 } from 'gl-matrix';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

const VTK_INT_MAX = 2147483647;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkResliceCursorWidget(publicAPI, model) {
  model.classHierarchy.push('vtkResliceCursorWidget');

  model.methodsToLink = ['scaleInPixels', 'rotationHandlePosition'];

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

    if (viewType === ViewTypes.XZ_PLANE) {
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
    } else if (viewType === ViewTypes.XY_PLANE) {
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
    } else if (viewType === ViewTypes.YZ_PLANE) {
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

  /**
   * Compute the offset between display reslice cursor position and
   * display focal point position
   * This will be used to keep the same offset between reslice cursor
   * center and focal point when needed.
   */
  function computeFocalPointOffsetFromResliceCursorCenter(viewType, renderer) {
    const worldFocalPoint = renderer.getActiveCamera().getFocalPoint();
    const worldResliceCenter = model.widgetState.getCenter();

    const view = renderer.getRenderWindow().getViews()[0];
    const dims = view.getViewportSize(renderer);
    const aspect = dims[0] / dims[1];
    const displayFocalPoint = renderer.worldToNormalizedDisplay(
      ...worldFocalPoint,
      aspect
    );
    const displayResliceCenter = renderer.worldToNormalizedDisplay(
      ...worldResliceCenter,
      aspect
    );

    const newOffset = vtkMath.subtract(
      displayFocalPoint,
      displayResliceCenter,
      [0, 0, 0]
    );

    const cameraOffsets = model.widgetState.getCameraOffsets();
    cameraOffsets[viewType] = newOffset;

    model.widgetState.setCameraOffsets(cameraOffsets);
  }

  function updateCamera(
    renderer,
    normal,
    viewType,
    resetFocalPoint,
    keepCenterFocalDistance
  ) {
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

    let newFocalPoint = focalPoint;
    if (resetFocalPoint) {
      // intersect with the plane to get updated focal point
      const intersection = vtkPlane.intersectWithLine(
        focalPoint,
        estimatedCameraPosition,
        model.widgetState.getCenter(), // reslice cursor center
        normal
      );
      newFocalPoint = intersection.x;
    }

    // Update the estimated focal point so that it will be at the same
    // distance from the reslice center
    if (keepCenterFocalDistance) {
      const worldResliceCenter = model.widgetState.getCenter();

      const view = renderer.getRenderWindow().getViews()[0];
      const dims = view.getViewportSize(renderer);
      const aspect = dims[0] / dims[1];
      const displayResliceCenter = renderer.worldToNormalizedDisplay(
        ...worldResliceCenter,
        aspect
      );

      const realOffset = model.widgetState.getCameraOffsets()[viewType];
      const displayFocal = vtkMath.add(
        displayResliceCenter,
        realOffset,
        [0, 0, 0]
      );

      const worldFocal = renderer.normalizedDisplayToWorld(
        ...displayFocal,
        aspect
      );

      // Reproject focal point on slice in order to keep it on the
      // same plane as the reslice cursor center
      const intersection2 = vtkPlane.intersectWithLine(
        worldFocal,
        estimatedCameraPosition,
        worldResliceCenter,
        normal
      );

      newFocalPoint[0] = intersection2.x[0];
      newFocalPoint[1] = intersection2.x[1];
      newFocalPoint[2] = intersection2.x[2];
    }

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

    // Don't clip away any part of the data.
    // Renderer may not have yet actor bounds
    const bounds = model.widgetState.getImage().getBounds();
    if (resetFocalPoint) {
      renderer.resetCamera(bounds);
    }
    renderer.resetCameraClippingRange(bounds);
  }

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator();

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.XY_PLANE:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisXinZ', 'AxisYinZ'],
            initialValues: {
              axis1Name: 'AxisXinZ',
              axis2Name: 'AxisYinZ',
              viewType: ViewTypes.XY_PLANE,
              rotationEnabled: model.widgetState.getEnableRotation(),
            },
          },
        ];
      case ViewTypes.XZ_PLANE:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisXinY', 'AxisZinY'],
            initialValues: {
              axis1Name: 'AxisXinY',
              axis2Name: 'AxisZinY',
              viewType: ViewTypes.XZ_PLANE,
              rotationEnabled: model.widgetState.getEnableRotation(),
            },
          },
        ];
      case ViewTypes.YZ_PLANE:
        return [
          {
            builder: vtkResliceCursorContextRepresentation,
            labels: ['AxisYinX', 'AxisZinX'],
            initialValues: {
              axis1Name: 'AxisYinX',
              axis2Name: 'AxisZinX',
              viewType: ViewTypes.YZ_PLANE,
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

  publicAPI.updateCameraPoints = (
    renderer,
    viewType,
    resetFocalPoint,
    keepCenterFocalDistance,
    computeFocalPointOffset
  ) => {
    publicAPI.resetCamera(
      renderer,
      viewType,
      resetFocalPoint,
      keepCenterFocalDistance
    );

    if (computeFocalPointOffset) {
      computeFocalPointOffsetFromResliceCursorCenter(viewType, renderer);
    }
  };

  /**
   *
   * @param {*} renderer
   * @param {*} viewType
   * @param {*} resetFocalPoint Defines if the focal point is reset to the image center
   * @param {*} keepCenterFocalDistance Defines if the estimated focal point has to be updated
   * in order to keep the same distance to the center (according to the computed focal point
   * shift)
   */
  publicAPI.resetCamera = (
    renderer,
    viewType,
    resetFocalPoint,
    keepCenterFocalDistance
  ) => {
    const center = model.widgetState.getImage().getCenter();
    const focalPoint = renderer.getActiveCamera().getFocalPoint();
    const position = renderer.getActiveCamera().getPosition();

    // Distance is preserved
    const distance = Math.sqrt(
      vtkMath.distance2BetweenPoints(position, focalPoint)
    );

    const normal = publicAPI.getPlaneNormalFromViewType(viewType);

    // ResetFocalPoint will reset focal point to the center of the image
    const estimatedFocalPoint = resetFocalPoint ? center : focalPoint;

    const estimatedCameraPosition = vtkMath.multiplyAccumulate(
      estimatedFocalPoint,
      normal,
      distance,
      [0, 0, 0]
    );
    renderer.getActiveCamera().setFocalPoint(...estimatedFocalPoint);
    renderer.getActiveCamera().setPosition(...estimatedCameraPosition);
    renderer
      .getActiveCamera()
      .setViewUp(model.widgetState.getPlanes()[viewType].viewUp);

    // Project focalPoint onto image plane and preserve distance
    updateCamera(
      renderer,
      normal,
      viewType,
      resetFocalPoint,
      keepCenterFocalDistance
    );
  };

  publicAPI.updateReslicePlane = (imageReslice, viewType) => {
    // Calculate appropriate pixel spacing for the reslicing
    const spacing = model.widgetState.getImage().getSpacing();

    // Compute original (i.e. before rotation) plane (i.e. origin, p1, p2)
    // centered on cursor center.
    const planeSource = computeReslicePlaneOrigin(viewType);

    const { normal, viewUp } = model.widgetState.getPlanes()[viewType];
    // Adapt plane orientation in order to fit the correct viewUp
    // so that the rotations will be more understandable than now.
    transformPlane(planeSource, model.widgetState.getCenter(), normal, viewUp);

    // Clip to bounds
    const boundedOrigin = [...planeSource.getOrigin()];
    const boundedP1 = [...planeSource.getPoint1()];
    const boundedP2 = [...planeSource.getPoint2()];

    boundPlane(
      model.widgetState.getImage().getBounds(),
      boundedOrigin,
      boundedP1,
      boundedP2
    );

    planeSource.setOrigin(...boundedOrigin);
    planeSource.setPoint1(...boundedP1);
    planeSource.setPoint2(...boundedP2);

    const o = planeSource.getOrigin();

    const p1 = planeSource.getPoint1();
    const planeAxis1 = [];
    vtkMath.subtract(p1, o, planeAxis1);

    const p2 = planeSource.getPoint2();
    const planeAxis2 = [];
    vtkMath.subtract(p2, o, planeAxis2);

    // The x,y dimensions of the plane
    const planeSizeX = vtkMath.normalize(planeAxis1);
    const planeSizeY = vtkMath.normalize(planeAxis2);

    const newResliceAxes = mat4.identity(new Float64Array(16));

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

    return { modified, origin: o, point1: p1, point2: p2 };
  };

  /**
   * Returns a plane source with origin at cursor center and
   * normal from the view.
   * @param {ViewType} type: Axial, Coronal or Sagittal
   */
  publicAPI.getPlaneSourceFromViewType = (type) => {
    const planeSource = vtkPlaneSource.newInstance();
    const origin = publicAPI.getWidgetState().getCenter();
    const planeNormal = publicAPI.getPlaneNormalFromViewType(type);

    planeSource.setNormal(planeNormal);
    planeSource.setOrigin(origin);

    return planeSource;
  };

  publicAPI.getPlaneNormalFromViewType = (viewType) =>
    publicAPI.getWidgetState().getPlanes()[viewType].normal;

  /**
   * Returns the normals of the planes that are not viewType.
   * @param {ViewType} viewType ViewType to extract other normals
   */
  publicAPI.getOtherPlaneNormals = (viewType) =>
    [ViewTypes.YZ_PLANE, ViewTypes.XZ_PLANE, ViewTypes.XY_PLANE]
      .filter((vt) => vt !== viewType)
      .map((vt) => publicAPI.getPlaneNormalFromViewType(vt));

  /**
   * Return the reslice cursor matrix built as such: [YZ, XZ, XY, center]
   */
  publicAPI.getResliceMatrix = () => {
    const resliceMatrix = mat4.identity(new Float64Array(16));

    for (let i = 0; i < 3; i++) {
      resliceMatrix[4 * i + 0] = publicAPI.getPlaneNormalFromViewType(
        ViewTypes.YZ_PLANE
      )[i];
      resliceMatrix[4 * i + 1] = publicAPI.getPlaneNormalFromViewType(
        ViewTypes.XZ_PLANE
      )[i];
      resliceMatrix[4 * i + 2] = publicAPI.getPlaneNormalFromViewType(
        ViewTypes.XY_PLANE
      )[i];
    }

    const origin = publicAPI.getWidgetState().getCenter();

    const m = vtkMatrixBuilder
      .buildFromRadian()
      .translate(...origin)
      .multiply(resliceMatrix)
      .translate(...vtkMath.multiplyScalar([...origin], -1))
      .getMatrix();

    return m;
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
