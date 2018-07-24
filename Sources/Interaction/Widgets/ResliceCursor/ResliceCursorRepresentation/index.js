import macro from 'vtk.js/Sources/macro';

import { mat4, vec4 } from 'gl-matrix';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';

const { vtkErrorMacro } = macro;

const VTK_INT_MAX = 2147483647;

// ----------------------------------------------------------------------------
// vtkResliceCursorRepresentation methods
// ----------------------------------------------------------------------------

function vtkResliceCursorRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorRepresentation');

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  publicAPI.getResliceCursor = () => {};

  publicAPI.getCursorAlgorithm = () => {};

  publicAPI.createDefaultResliceAlgorithm = () => {
    if (!model.reslice) {
      model.reslice = vtkImageReslice.newInstance();
      model.reslice.setTransformInputSampling(false);
      model.reslice.setAutoCropOutput(true);
      model.reslice.setOutputDimensionality(2);
    }
  };

  publicAPI.buildRepresentation = () => {
    if (publicAPI.getResliceCursor()) {
      const image = publicAPI.getResliceCursor().getImage();
      if (image) {
        model.reslice.setInputData(image);
        model.imageActor.setVisibility(model.showReslicedImage);

        publicAPI.updateReslicePlane();
      } else {
        model.imageActor.setVisibility(false);
      }
    }
  };

  publicAPI.computeReslicePlaneOrigin = () => {
    const resliceCursor = publicAPI.getResliceCursor();
    const bounds = resliceCursor.getImage().getBounds();

    const center = resliceCursor.getCenter();
    const imageCenter = resliceCursor.getImage().getCenter();

    // Offset based on the center of the image and how far from it the
    // reslice cursor is. This allows us to capture the whole image even
    // if we resliced in awkward places.
    const offset = [];
    for (let i = 0; i < 3; i++) {
      offset[i] = -Math.abs(center[i] - imageCenter[i]);
      offset[i] *= 2; // give us room
    }

    // Now resize the plane based on these offsets.

    const planeOrientation = publicAPI
      .getCursorAlgorithm()
      .getReslicePlaneNormal();

    // Now set the size of the plane based on the location of the cursor so as to
    // at least completely cover the viewed region

    if (planeOrientation === 1) {
      model.planeSource.setOrigin(
        bounds[0] + offset[0],
        center[1],
        bounds[4] + offset[2]
      );
      model.planeSource.setPoint1(
        bounds[1] - offset[0],
        center[1],
        bounds[4] + offset[2]
      );
      model.planeSource.setPoint2(
        bounds[0] + offset[0],
        center[1],
        bounds[5] - offset[2]
      );
    } else if (planeOrientation === 2) {
      model.planeSource.setOrigin(
        bounds[0] + offset[0],
        bounds[2] + offset[1],
        center[2]
      );
      model.planeSource.setPoint1(
        bounds[1] - offset[0],
        bounds[2] + offset[1],
        center[2]
      );
      model.planeSource.setPoint2(
        bounds[0] + offset[0],
        bounds[3] - offset[1],
        center[2]
      );
    } else if (planeOrientation === 0) {
      model.planeSource.setOrigin(
        center[0],
        bounds[2] + offset[1],
        bounds[4] + offset[2]
      );
      model.planeSource.setPoint1(
        center[0],
        bounds[3] - offset[1],
        bounds[4] + offset[2]
      );
      model.planeSource.setPoint2(
        center[0],
        bounds[2] + offset[1],
        bounds[5] - offset[2]
      );
    }
  };

  publicAPI.resetCamera = () => {
    if (model.renderer) {
      const center = publicAPI.getResliceCursor().getCenter();
      model.renderer
        .getActiveCamera()
        .setFocalPoint(center[0], center[1], center[2]);

      const normalAxis = publicAPI.getCursorAlgorithm().getReslicePlaneNormal();
      const normal = publicAPI
        .getResliceCursor()
        .getPlane(normalAxis)
        .getNormal();

      const cameraPosition = [];
      vtkMath.add(center, normal, cameraPosition);
      model.renderer
        .getActiveCamera()
        .setPosition(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

      model.renderer.resetCamera();
      model.renderer.resetCameraClippingRange();
    }
  };

  publicAPI.initializeReslicePlane = () => {
    if (!publicAPI.getResliceCursor().getImage()) {
      return;
    }

    // Initialize the reslice plane origins. Offset should be zero within
    // this function here.

    publicAPI.computeReslicePlaneOrigin();

    // Finally reset the camera to whatever orientation they were staring in
    publicAPI.resetCamera();
  };

  publicAPI.updateReslicePlane = () => {
    if (
      !publicAPI.getResliceCursor().getImage() ||
      !model.imageActor.getVisibility()
    ) {
      return;
    }
    // Reinitialize the reslice plane.. We will recompute everything here.
    if (!model.planeInitialized) {
      publicAPI.initializeReslicePlane();
      model.planeInitialized = true;
    }

    // Calculate appropriate pixel spacing for the reslicing
    const spacing = publicAPI
      .getResliceCursor()
      .getImage()
      .getSpacing();

    const plane = publicAPI
      .getResliceCursor()
      .getPlane(publicAPI.getCursorAlgorithm().getReslicePlaneNormal());

    const planeNormal = plane.getNormal();

    // Compute the origin of the reslice plane prior to transformations.
    publicAPI.computeReslicePlaneOrigin();
    model.planeSource.setNormal(planeNormal[0], planeNormal[1], planeNormal[2]);
    model.planeSource.setCenter(
      plane.getOrigin()[0],
      plane.getOrigin()[1],
      plane.getOrigin()[2]
    );

    let o = model.planeSource.getOrigin();

    let p1 = model.planeSource.getPoint1();
    const planeAxis1 = [];
    vtkMath.subtract(p1, o, planeAxis1);

    let p2 = model.planeSource.getPoint2();
    const planeAxis2 = [];
    vtkMath.subtract(p2, o, planeAxis2);

    // Clip to bounds
    const boundedOrigin = [];
    publicAPI.boundPoint(
      model.planeSource.getOrigin(),
      planeAxis1,
      planeAxis2,
      boundedOrigin
    );

    const boundedP1 = [];
    publicAPI.boundPoint(
      model.planeSource.getPoint1(),
      planeAxis1,
      planeAxis2,
      boundedP1
    );

    const boundedP2 = [];
    publicAPI.boundPoint(
      model.planeSource.getPoint2(),
      planeAxis1,
      planeAxis2,
      boundedP2
    );

    model.planeSource.setOrigin(boundedOrigin);
    model.planeSource.setPoint1(boundedP1[0], boundedP1[1], boundedP1[2]);
    model.planeSource.setPoint2(boundedP2[0], boundedP2[1], boundedP2[2]);

    o = model.planeSource.getOrigin();

    p1 = model.planeSource.getPoint1();
    vtkMath.subtract(p1, o, planeAxis1);

    p2 = model.planeSource.getPoint2();
    vtkMath.subtract(p2, o, planeAxis2);

    // The x,y dimensions of the plane
    const planeSizeX = vtkMath.normalize(planeAxis1);
    const planeSizeY = vtkMath.normalize(planeAxis2);
    const normal = model.planeSource.getNormal();

    mat4.identity(model.newResliceAxes);

    for (let i = 0; i < 3; i++) {
      model.newResliceAxes[4 * i + 0] = planeAxis1[i];
      model.newResliceAxes[4 * i + 1] = planeAxis2[i];
      model.newResliceAxes[4 * i + 2] = normal[i];
    }

    const spacingX =
      Math.abs(planeAxis1[0] * spacing[0]) +
      Math.abs(planeAxis1[1] * spacing[1]) +
      Math.abs(planeAxis1[2] * spacing[2]);

    const spacingY =
      Math.abs(planeAxis2[0] * spacing[0]) +
      Math.abs(planeAxis2[1] * spacing[1]) +
      Math.abs(planeAxis2[2] * spacing[2]);

    const planeOrigin = [...model.planeSource.getOrigin(), 1.0];
    const originXYZW = [];
    const newOriginXYZW = [];

    vec4.transformMat4(originXYZW, planeOrigin, model.newResliceAxes);
    mat4.transpose(model.newResliceAxes, model.newResliceAxes);
    vec4.transformMat4(newOriginXYZW, originXYZW, model.newResliceAxes);

    model.newResliceAxes[4 * 3 + 0] = newOriginXYZW[0];
    model.newResliceAxes[4 * 3 + 1] = newOriginXYZW[1];
    model.newResliceAxes[4 * 3 + 2] = newOriginXYZW[2];

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
      vtkErrorMacro('Invalid X extent: ', realExtentX);
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
      vtkErrorMacro('Invalid Y extent:', realExtentY);
      extentY = 0;
    } else {
      extentY = 1;
      while (extentY < realExtentY) {
        extentY <<= 1; // eslint-disable-line no-bitwise
      }
    }

    const outputSpacingX = extentX === 0 ? 1.0 : planeSizeX / extentX;
    const outputSpacingY = extentY === 0 ? 1.0 : planeSizeY / extentY;

    let modify = false;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const index = 4 * j + i;

        const d = model.newResliceAxes[index];

        if (d !== model.resliceAxes[index]) {
          model.resliceAxes[index] = d;
          modify = true;
        }
      }
    }

    if (modify) {
      publicAPI.modified();

      publicAPI.setResliceParameters(
        outputSpacingX,
        outputSpacingY,
        extentX,
        extentY
      );
    }
  };

  publicAPI.setResliceParameters = (
    outputSpacingX,
    outputSpacingY,
    extentX,
    extentY
  ) => {
    if (model.reslice) {
      model.reslice.setResliceAxes(model.resliceAxes);
      model.reslice.setOutputSpacing([outputSpacingX, outputSpacingY, 1]);
      model.reslice.setOutputOrigin([
        0.5 * outputSpacingX,
        0.5 * outputSpacingY,
        0,
      ]);
      model.reslice.setOutputExtent([0, extentX - 1, 0, extentY - 1, 0, 0]);

      model.imageActor.setUserMatrix(model.resliceAxes);
      model.reslice.update();
    }
  };

  publicAPI.computeOrigin = (matrix) => {
    const center = publicAPI.getResliceCursor().getCenter();

    const centerTransformed = [];
    vec4.transformMat4(centerTransformed, center, matrix);

    for (let i = 0; i < 3; i++) {
      matrix[4 * 3 + i] = matrix[4 * 3 + i] + center[i] - centerTransformed[i];
    }
  };

  publicAPI.getActors = () => model.imageActor;

  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.boundPoint = (inPoint, t1, t2, outPoint) => {
    if (!publicAPI.getResliceCursor()) {
      return;
    }
    const bounds = publicAPI
      .getResliceCursor()
      .getImage()
      .getBounds();

    let o1 = 0.0;
    let o2 = 0.0;

    for (let i = 0; i < 3; i++) {
      let axisOffset = 0;

      const useT1 = Math.abs(t1[i]) > Math.abs(t2[i]);
      const t = useT1 ? t1 : t2;

      if (inPoint[i] < bounds[i * 2]) {
        axisOffset = t[i] !== 0 ? (bounds[2 * i] - inPoint[i]) / t[i] : 0;
      } else if (inPoint[i] > bounds[2 * i + 1]) {
        axisOffset = t[i] !== 0 ? (bounds[2 * i + 1] - inPoint[i]) / t[i] : 0;
      }

      if (useT1) {
        if (Math.abs(axisOffset) > Math.abs(o1)) {
          o1 = axisOffset;
        }
      } else if (Math.abs(axisOffset) > Math.abs(o2)) {
        o2 = axisOffset;
      }
    }

    outPoint[0] = inPoint[0];
    outPoint[1] = inPoint[1];
    outPoint[2] = inPoint[2];

    if (o1 !== 0.0) {
      const translation = [];

      translation[0] = t1[0] * o1;
      translation[1] = t1[1] * o1;
      translation[2] = t1[2] * o1;

      vtkMath.add(outPoint, translation, outPoint);
    }
    if (o2 !== 0) {
      const translation = [];

      translation[0] = t2[0] * o2;
      translation[1] = t2[1] * o2;
      translation[2] = t2[2] * o2;

      vtkMath.add(outPoint, translation, outPoint);
    }
  };

  publicAPI.getBounds = () => model.imageActor.getBounds();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tolerance: 5,
  showReslicedImage: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  model.reslice = null;
  model.planeSource = vtkPlaneSource.newInstance();
  model.resliceAxes = mat4.create();
  model.newResliceAxes = mat4.create();
  model.imageActor = vtkImageSlice.newInstance();
  model.imageMapper = vtkImageMapper.newInstance();

  model.planeInitialized = false;

  macro.setGet(publicAPI, model, [
    'tolerance',
    'planeSource',
    'showReslicedImage',
  ]);

  macro.get(publicAPI, model, ['resliceAxes', 'reslice']);

  // Object methods
  vtkResliceCursorRepresentation(publicAPI, model);

  publicAPI.createDefaultResliceAlgorithm();
  model.imageMapper.setInputConnection(model.reslice.getOutputPort());
  model.imageActor.setMapper(model.imageMapper);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkResliceCursorRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
