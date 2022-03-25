import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkResliceCursorWidget from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import {
  ViewTypes,
  CaptureOn,
} from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import {
  xyzToViewType,
  viewTypeToXYZ,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

const PRECISION = 4;

/** Create js object that contains all needed parameters to define a vtkjs view
  @param gc Garbage collector used when defined new object
  @param {ViewTypes} viewType : Define the view type
  @param {ResliceCursorWidget} widget: main widget where the new widget instance will be added
*/
function createView(gc, viewType, widget) {
  const obj = {
    container: gc.registerDOMElement(document.createElement('div')),
    renderWindow: gc.registerResource(vtkRenderWindow.newInstance()),
    renderer: gc.registerResource(vtkRenderer.newInstance()),
    GLWindow: gc.registerResource(vtkOpenGLRenderWindow.newInstance()),
    interactor: gc.registerResource(vtkRenderWindowInteractor.newInstance()),
    widgetManager: gc.registerResource(vtkWidgetManager.newInstance()),
    reslice: gc.registerResource(vtkImageReslice.newInstance()),
    resliceMapper: gc.registerResource(vtkImageMapper.newInstance()),
    resliceActor: gc.registerResource(vtkImageSlice.newInstance()),
    origin: [],
    point1: [],
    point2: [],
    viewType,
  };

  obj.renderer.getActiveCamera().setParallelProjection(true);
  obj.renderer.setBackground([1, 1, 0]);
  obj.renderWindow.addRenderer(obj.renderer);
  obj.renderWindow.addView(obj.GLWindow);
  obj.renderWindow.setInteractor(obj.interactor);
  obj.GLWindow.setContainer(obj.container);
  obj.GLWindow.setSize(400, 400);
  obj.interactor.setView(obj.GLWindow);
  obj.interactor.initialize();
  obj.interactor.bindEvents(obj.container);
  obj.widgetManager.setRenderer(obj.renderer);
  obj.interactor.setInteractorStyle(
    gc.registerResource(vtkInteractorStyleImage.newInstance())
  );
  obj.widgetInstance = obj.widgetManager.addWidget(widget, viewType);
  obj.widgetManager.enablePicking();
  // Use to update all renderers buffer when actors are moved
  obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);

  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2);
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  obj.resliceActor.setMapper(obj.resliceMapper);

  return obj;
}

/**
 * This test is to check if, after applying several rotations on several views, the viewUp is not broken.
 * To generate data for this test, I updated the ResliceCursorWidget example in order to add buttons and
 * comboboxes to:
 * - buttons + and - : apply a rotation of +- 5°
 * - comboboxes: choose which plane will rotate and around which plane normal
 * So, with the buttons, I'll be abled to click 9 times to rotate the red plane (X) around green plane normal
 * After that, I displayed in the console the current widget state for each view and report it in the test.
 * Repeat it to have the second rotation.
 * Pay attention! When we already have defined a rotation and then, want to programmatically create a new rotation,
 * if you use a step as here (one click = 5° rotation), you have to be careful and update all views at each new click.
 * If you don't, the viewUp computation will fail because it uses the previous viewUp value.
 * The manipulations I did in the example, have to be exactly reported in the test (one click = one rotation step = update all views)
 */
test('Test rendering when several rotations plane', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.comment('ResliceCursorWidgets rendering');

  // --------------------------------------------------------------------------
  // Create constants
  // --------------------------------------------------------------------------

  const widget = gc.registerResource(vtkResliceCursorWidget.newInstance());
  widget.getWidgetState().setKeepOrthogonality(true);
  const viewAttributes = [];

  /**
   * Update the reslice computation of the input view
   * @param {Object} interactionContext
   */
  function updateReslice(
    interactionContext = {
      viewType: '',
      reslice: null,
      actor: null,
      renderer: null,
      resetFocalPoint: false, // Reset the focal point to the center of the display image
      keepFocalPointPosition: false, // Defines if the focal point position is kepts (same display distance from reslice cursor center)
      computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
      // computed. If so, then this offset will be used to keep the focal point position during rotation.
    }
  ) {
    const obj = widget.updateReslicePlane(
      interactionContext.reslice,
      interactionContext.viewType
    );
    if (obj.modified) {
      // Get returned modified from setter to know if we have to render
      interactionContext.actor.setUserMatrix(
        interactionContext.reslice.getResliceAxes()
      );
    }
    widget.updateCameraPoints(
      interactionContext.renderer,
      interactionContext.viewType,
      interactionContext.resetFocalPoint,
      interactionContext.keepFocalPointPosition,
      interactionContext.computeFocalPointOffset
    );
    return obj;
  }

  // --------------------------------------------------------------------------
  // Create HTML elements
  // --------------------------------------------------------------------------
  const container = document.querySelector('body');

  // ----------------------------------------------------------------------------
  // Setup rendering code
  // ----------------------------------------------------------------------------

  viewAttributes.push(createView(gc, xyzToViewType[0], widget));
  viewAttributes.push(createView(gc, xyzToViewType[1], widget));
  viewAttributes.push(createView(gc, xyzToViewType[2], widget));
  viewAttributes.forEach((view) => {
    container.appendChild(view.container);
  });

  // ----------------------------------------------------------------------------
  // Load image
  // ----------------------------------------------------------------------------
  const reader = gc.registerResource(
    vtkHttpDataSetReader.newInstance({ fetchGzip: true })
  );
  reader.setUrl(`${__BASE_PATH__}/Data/volume/LIDC2.vti`).then(() => {
    reader.loadData().then(() => {
      const image = reader.getOutputData();
      widget.setImage(image);

      viewAttributes.forEach((obj, i) => {
        obj.reslice.setInputData(image);
        obj.renderer.addActor(obj.resliceActor);

        const reslice = obj.reslice;
        const viewType = xyzToViewType[i];

        viewAttributes.forEach((v) => {
          v.widgetInstance.onInteractionEvent(
            ({ computeFocalPointOffset, canUpdateFocalPoint }) => {
              const activeViewType = widget
                .getWidgetState()
                .getActiveViewType();
              const keepFocalPointPosition =
                activeViewType !== viewType && canUpdateFocalPoint;
              updateReslice({
                viewType,
                reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: false,
                keepFocalPointPosition,
                computeFocalPointOffset,
              });
            }
          );
        });

        updateReslice({
          viewType,
          reslice,
          actor: obj.resliceActor,
          renderer: obj.renderer,
          resetFocalPoint: true, // At first initilization, center the focal point to the image center
          keepFocalPointPosition: false, // Don't update the focal point as we already set it to the center of the image
          computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
        });
        obj.renderWindow.render();
      });

      // ----------------------------------------------------------------------
      // Defines methods used for testing

      /**
       * Update all views after being moved axis or center
       */
      function updateViews(keepFocalPointPosition = false) {
        viewAttributes.forEach((obj, i) => {
          updateReslice({
            viewType: xyzToViewType[i],
            reslice: obj.reslice,
            actor: obj.resliceActor,
            renderer: obj.renderer,
            resetFocalPoint: false,
            keepFocalPointPosition,
            computeFocalPointOffset: false,
          });
          obj.renderWindow.render();
        });
      }

      /**
       * Update the reslice view and get correct compared values (camera focal points and view up, origin, point1 and point2)
       * @param {ViewType} viewType Defines view type
       */
      function updateView(viewType) {
        const viewObj = viewAttributes.find((obj) => obj.viewType === viewType);
        const out = updateReslice({
          viewType,
          reslice: viewObj.reslice,
          actor: viewObj.resliceActor,
          renderer: viewObj.renderer,
          resetFocalPoint: false,
          keepFocalPointPosition: true,
          computeFocalpointOffset: false,
        });

        const camera = viewObj.renderer.getActiveCamera();
        return {
          focalPoint: camera.getFocalPoint(),
          viewUp: camera.getViewUp(),
          origin: out.origin,
          point1: out.point1,
          point2: out.point2,
        };
      }

      /**
       * Update the reslice view and compare it to ground truthes values
       * @param {ViewType} viewType Defines the viewType
       * @param {Object} expectedValues Contains ground truthes values that will be compared (focalPoint, viewUp, origin, point1, point2)
       * @returns {Object} Contains compared values extacted from views (focal point, viewup, origin, point1, point2)
       */
      function updateAndCompareView(viewType, expectedValues) {
        const comparedValues = updateView(viewType);

        t.deepEqual(
          vtkMath.roundVector(comparedValues.focalPoint, [], PRECISION),
          vtkMath.roundVector(expectedValues.focalPoint, [], PRECISION),
          `Camera focal point on ${viewType}`
        );
        t.deepEqual(
          vtkMath.roundVector(comparedValues.viewUp, [], PRECISION),
          vtkMath.roundVector(expectedValues.viewUp, [], PRECISION),
          `Camera view up on ${viewType}`
        );
        t.deepEqual(
          vtkMath.roundVector(comparedValues.origin, [], PRECISION),
          vtkMath.roundVector(expectedValues.origin, [], PRECISION),
          `Plane origin on ${viewType}`
        );
        t.deepEqual(
          vtkMath.roundVector(comparedValues.point1, [], PRECISION),
          vtkMath.roundVector(expectedValues.point1, [], PRECISION),
          `Plane point 1 on ${viewType}`
        );
        t.deepEqual(
          vtkMath.roundVector(comparedValues.point2, [], PRECISION),
          vtkMath.roundVector(expectedValues.point2, [], PRECISION),
          `Plane point 2 on ${viewType}`
        );
        return comparedValues;
      }

      // ----------------------------------------------------------------------
      // Check initialization
      // Check X view
      t.comment('Initialization');
      updateAndCompareView(ViewTypes.YZ_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [0, 0, 1],
        origin: [179.296875, -0.703125, -1.25],
        point1: [179.296875, 359.296875, -1.25],
        point2: [179.296875, -0.703125, 331.25],
      });
      // Check Y view
      updateAndCompareView(ViewTypes.XZ_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [0, 0, 1],
        origin: [-0.703125, 179.296875, -1.25],
        point1: [359.296875, 179.296875, -1.25],
        point2: [-0.703125, 179.296875, 331.25],
      });
      // Check Z view
      updateAndCompareView(ViewTypes.XY_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [0, -1, 0],
        origin: [-0.703125, 359.296875, 165],
        point1: [359.296875, 359.296875, 165],
        point2: [-0.703125, -0.703125, 165],
      });

      // ----------------------------------------------------------------------
      t.comment('Rotate Z by 45 degrees around Y');
      const xzWidget = viewAttributes[viewTypeToXYZ[ViewTypes.XZ_PLANE]];
      xzWidget.widgetInstance.rotateLineInView(
        widget.getWidgetState().getAxisXinY(),
        vtkMath.radiansFromDegrees(45)
      );
      // Check X view
      const XView45 = updateAndCompareView(ViewTypes.YZ_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [-0.707106, 0, 0.707106],
        origin: [345.54687, -0.703125, -1.25],
        point1: [345.54687, 359.296875, -1.25],
        point2: [13.04687, -0.703125, 331.25],
      });
      // Check Y view
      const YView45 = updateAndCompareView(ViewTypes.XZ_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [0, 0, 1],
        origin: [-0.703125, 179.296875, -1.25],
        point1: [359.296875, 179.296875, -1.25],
        point2: [-0.703125, 179.296875, 331.25],
      });
      // Check Z view
      const ZView45 = updateAndCompareView(ViewTypes.XY_PLANE, {
        focalPoint: [179.296875, 179.296875, 165],
        viewUp: [0, -1, 0],
        origin: [13.04687, 359.296875, -1.25],
        point1: [345.54687, 359.296875, 331.25],
        point2: [13.04687, -0.703125, -1.25],
      });

      // ----------------------------------------------------------------------
      t.comment('Rotate 7 times Y by 5 degrees around Z (35°)');
      // Simulate increment of 5, seven times to have 35°
      for (let i = 0; i < 7; i++) {
        xzWidget.widgetInstance.rotateLineInView(
          widget.getWidgetState().getAxisYinZ(),
          vtkMath.radiansFromDegrees(5)
        );
        updateViews(true);
      }
      // Check X view
      updateView(ViewTypes.YZ_PLANE);
      // Check Y view
      updateView(ViewTypes.XZ_PLANE);
      // Check Z view
      updateView(ViewTypes.XY_PLANE);

      // ----------------------------------------------------------------------
      t.comment('Rotate Z by -35 degrees around Y');
      xzWidget.widgetInstance.rotateLineInView(
        widget.getWidgetState().getAxisYinZ(),
        vtkMath.radiansFromDegrees(-35)
      );

      // Check X view
      updateAndCompareView(ViewTypes.YZ_PLANE, XView45);
      // Check Y view
      updateAndCompareView(ViewTypes.XZ_PLANE, YView45);
      // Check Z view
      updateAndCompareView(ViewTypes.XY_PLANE, ZView45);

      gc.releaseResources();
    });
  });
});
