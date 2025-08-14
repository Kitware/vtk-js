import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkRectangleWidget from '@kitware/vtk.js/Widgets/Widgets3D/RectangleWidget';
import vtkEllipseWidget from '@kitware/vtk.js/Widgets/Widgets3D/EllipseWidget';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';

import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkSphere from '@kitware/vtk.js/Common/DataModel/Sphere';
import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';
import { VTK_SMALL_NUMBER } from '@kitware/vtk.js/Common/Core/Math/Constants';

import vtkInteractorObserver from '@kitware/vtk.js/Rendering/Core/InteractorObserver';
import {
  bindSVGRepresentation,
  multiLineTextCalculator,
  VerticalTextAlignment,
} from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';

import {
  BehaviorCategory,
  ShapeBehavior,
  TextPosition,
} from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/Constants';

import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';

import { vec3, mat3 } from 'gl-matrix';

import GUI from 'lil-gui';

const { computeWorldToDisplay } = vtkInteractorObserver;

let sliceCtrl;

const scene = {};

scene.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  rootContainer: document.body,
  background: [0.1, 0.1, 0.1],
});

scene.renderer = scene.fullScreenRenderer.getRenderer();
scene.renderWindow = scene.fullScreenRenderer.getRenderWindow();
scene.openGLRenderWindow =
  scene.fullScreenRenderer.getApiSpecificRenderWindow();
scene.camera = scene.renderer.getActiveCamera();

scene.widgetManager = vtkWidgetManager.newInstance();
scene.widgetManager.setRenderer(scene.renderer);

scene.rcw = vtkResliceCursorWidget.newInstance({ planes: ['Z'] });
scene.rcw.getWidgetState().getCenterHandle().setVisible(false);
scene.rcwInstance = scene.widgetManager.addWidget(
  scene.rcw,
  ViewTypes.XY_PLANE,
  { keepOrthogonality: true }
);
scene.widgetManager.enablePicking(); // FIXME: really needed ?

scene.reslice = vtkImageReslice.newInstance();
// scene.reslice.setSlabMode(SlabMode.MEAN);
// scene.reslice.setSlabNumberOfSlices(1);
scene.reslice.setTransformInputSampling(false);
scene.reslice.setAutoCropOutput(true);
scene.reslice.setOutputDimensionality(2);
scene.resliceMapper = vtkImageMapper.newInstance();
scene.resliceMapper.setInputConnection(scene.reslice.getOutputPort());
scene.resliceActor = vtkImageSlice.newInstance();
scene.resliceActor.setMapper(scene.resliceMapper);
scene.renderer.addActor(scene.resliceActor);

// setup 2D view
scene.camera.setParallelProjection(true);
scene.iStyle = vtkInteractorStyleImage.newInstance();
scene.iStyle.setInteractionMode('IMAGE_SLICING');
scene.renderWindow.getInteractor().setInteractorStyle(scene.iStyle);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

// Widgets
const widgets = {};
widgets.rectangleWidget = vtkRectangleWidget.newInstance({
  resetAfterPointPlacement: true,
});
widgets.ellipseWidget = vtkEllipseWidget.newInstance({
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
  },
});
widgets.circleWidget = vtkEllipseWidget.newInstance({
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]: ShapeBehavior[BehaviorCategory.POINTS].RADIUS,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
  },
});
// Make a large handle for demo purpose
widgets.circleWidget.getWidgetState().getPoint1Handle().setScale1(20);
widgets.circleWidget
  .getWidgetState()
  .setTextPosition([
    TextPosition.MAX,
    TextPosition.CENTER,
    TextPosition.CENTER,
  ]);

scene.rectangleHandle = scene.widgetManager.addWidget(
  widgets.rectangleWidget,
  ViewTypes.SLICE
);
scene.rectangleHandle.setHandleVisibility(false);
widgets.rectangleWidget
  .getWidgetState()
  .setTextPosition([
    TextPosition.CENTER,
    TextPosition.CENTER,
    TextPosition.CENTER,
  ]);

scene.ellipseHandle = scene.widgetManager.addWidget(
  widgets.ellipseWidget,
  ViewTypes.SLICE
);

scene.circleHandle = scene.widgetManager.addWidget(
  widgets.circleWidget,
  ViewTypes.SLICE
);
scene.circleHandle.setGlyphResolution(64);

let activeWidget = 'ellipseWidget';

// ----------------------------------------------------------------------------
// Ready logic
// ----------------------------------------------------------------------------

function ready(scope, picking = false) {
  scope.renderer.resetCamera();
  scope.fullScreenRenderer.resize();
  if (picking) {
    scope.widgetManager.enablePicking();
  } else {
    scope.widgetManager.disablePicking();
  }
}

function readyAll() {
  ready(scene, true);
}

function updateControlPanel(slicingMode, ds) {
  const bounds = ds.getBounds();
  if (sliceCtrl) {
    sliceCtrl.min(bounds[slicingMode * 2]);
    sliceCtrl.max(bounds[slicingMode * 2 + 1]);
    sliceCtrl.updateDisplay();
  }
}

function updateWidgetVisibility(widget, slicePos, i, handle) {
  /* testing if the widget is on the slice and has been placed to modify visibility */
  const widgetVisibility =
    !handle.getPoint1() ||
    widget.getWidgetState().getPoint1Handle().getOrigin()[i] === slicePos[i];
  return widget.setVisibility(widgetVisibility);
}

function updateWidgetsVisibility(slicePos, slicingMode) {
  updateWidgetVisibility(
    widgets.rectangleWidget,
    slicePos,
    slicingMode,
    scene.rectangleHandle
  );
  updateWidgetVisibility(
    widgets.ellipseWidget,
    slicePos,
    slicingMode,
    scene.ellipseHandle
  );
  updateWidgetVisibility(
    widgets.circleWidget,
    slicePos,
    slicingMode,
    scene.circleHandle
  );
}

// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------

let imageData = null;
let slicingMode = 2;

function updateReslice(
  interactionContext = {
    viewType: '',
    reslice: null, // vtkImageReslice
    actor: null,
    renderer: null,
    resetFocalPoint: false, // Reset the focal point to the center of the display image
    computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
    // computed. If so, then this offset will be used to keep the focal point position during rotation.
  }
) {
  const modified = scene.rcw.updateReslicePlane(
    interactionContext.reslice,
    interactionContext.viewType
  );
  if (modified) {
    const resliceAxes = interactionContext.reslice.getResliceAxes();
    // Get returned modified from setter to know if we have to render
    interactionContext.actor.setUserMatrix(resliceAxes);
  }
  scene.rcw.updateCameraPoints(
    interactionContext.renderer,
    interactionContext.viewType,
    interactionContext.resetFocalPoint,
    interactionContext.computeFocalPointOffset
  );

  if (sliceCtrl) {
    sliceCtrl.setValue(scene.rcw.getWidgetState().getCenter()[slicingMode]);
  }

  scene.renderWindow.render();
  return modified;
}

scene.rcwInstance.onInteractionEvent((interactionMethodName) => {
  const computeFocalPointOffset = true;
  updateReslice({
    viewType: ViewTypes.XY_PLANE,
    reslice: scene.reslice,
    actor: scene.resliceActor,
    renderer: scene.renderer,
    resetFocalPoint: true,
    computeFocalPointOffset,
  });
});

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`, { loadData: true })
  .then(() => {
    imageData = reader.getOutputData();
    // set input data
    scene.reslice.setInputData(imageData);
    scene.rcw.setImage(imageData);

    updateReslice({
      viewType: ViewTypes.XY_PLANE,
      reslice: scene.reslice,
      actor: scene.resliceActor,
      renderer: scene.renderer,
      resetFocalPoint: true, // At first initilization, center the focal point to the image center
      computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
    });
    scene.renderWindow.getInteractor().render();

    updateControlPanel(slicingMode, imageData);

    scene.rectangleHandle.getRepresentations()[1].setDrawBorder(true);
    scene.rectangleHandle.getRepresentations()[1].setDrawFace(false);
    scene.rectangleHandle.getRepresentations()[1].setOpacity(1);
    scene.circleHandle.getRepresentations()[1].setDrawBorder(true);
    scene.circleHandle.getRepresentations()[1].setDrawFace(false);
    scene.circleHandle.getRepresentations()[1].setOpacity(1);
    scene.ellipseHandle.getRepresentations()[1].setDrawBorder(true);
    scene.ellipseHandle.getRepresentations()[1].setDrawFace(false);
    scene.ellipseHandle.getRepresentations()[1].setOpacity(1);

    const isPointInPlane = vtkPlane.newInstance();
    const currentEllipse = vtkSphere.newInstance();
    const transform = vtkTransform.newInstance();
    currentEllipse.setTransform(transform);

    // set text display callback
    scene.ellipseHandle.onInteractionEvent(() => {
      const worldBounds = scene.ellipseHandle.getBounds();
      const plane = scene.rcw.getWidgetState().getPlanes()[ViewTypes.XY_PLANE];
      const planeNormal = [...plane.normal];

      const planeOrigin = scene.rcw.getWidgetState().getCenter();
      isPointInPlane.setOrigin(planeOrigin);
      isPointInPlane.setNormal(planeNormal);
      const corner1 = widgets.ellipseWidget
        .getWidgetState()
        .getPoint1Handle()
        .getOrigin();
      const corner2 = widgets.ellipseWidget
        .getWidgetState()
        .getPoint2Handle()
        .getOrigin();
      const center = [
        (corner1[0] + corner2[0]) / 2,
        (corner1[1] + corner2[1]) / 2,
        (corner1[2] + corner2[2]) / 2,
      ];
      const wcvc = mat3.fromMat4(mat3.create(), scene.camera.getViewMatrix());
      mat3.invert(wcvc, wcvc);

      const rotationMatrix = vtkMatrixBuilder
        .buildFromRadian()
        .translate(...center)
        .multiply3x3(wcvc)
        .translate(-center[0], -center[1], -center[2]);
      rotationMatrix.apply(corner1);
      rotationMatrix.apply(corner2);
      transform.setMatrix(rotationMatrix.getMatrix());
      const spacing = scene.rcw.getWidgetState().getImage().getSpacing();
      const ijkRadius = [
        Math.max(
          Math.abs(corner2[0] - corner1[0]) / 2,
          spacing[0] + VTK_SMALL_NUMBER
        ),
        Math.max(
          Math.abs(corner2[1] - corner1[1]) / 2,
          spacing[1] + VTK_SMALL_NUMBER
        ),
        10, // thick enough to cover 1 pixel high
      ];
      currentEllipse.setRadius(ijkRadius);

      mat3.invert(wcvc, wcvc);
      const ijkToWorldMatrix = vtkMatrixBuilder
        .buildFromRadian()
        .translate(...center)
        .multiply3x3(wcvc);
      const maxRadius = Math.ceil(Math.max(ijkRadius[0], ijkRadius[1]));
      const ellipseBounds = [
        -maxRadius,
        -maxRadius,
        0,
        maxRadius,
        maxRadius,
        0,
        -maxRadius,
        maxRadius,
        0,
        maxRadius,
        -maxRadius,
        0,
      ];
      ijkToWorldMatrix.apply(ellipseBounds);
      vtkBoundingBox.addPoints(worldBounds, ellipseBounds);

      currentEllipse.setCenter(center);
      const halfSpacingAlongNormal =
        vtkMath.norm([
          planeNormal[0] * spacing[0],
          planeNormal[1] * spacing[1],
          planeNormal[2] * spacing[2],
        ]) / 2;

      const w = [];
      const { average, minimum, maximum } = imageData.computeHistogram(
        worldBounds,
        (coord, _) => {
          imageData.indexToWorld(coord, w);
          return (
            Math.abs(isPointInPlane.functionValue(w)) <=
              halfSpacingAlongNormal && currentEllipse.functionValue(w) < 0
          );
        }
      );

      const text = `average: ${average.toFixed(
        0
      )} \nmin: ${minimum} \nmax: ${maximum} `;

      widgets.ellipseWidget.getWidgetState().getText().setText(text);
    });

    scene.circleHandle.onInteractionEvent(() => {
      const worldBounds = scene.circleHandle.getBounds();

      const text = `radius: ${(
        vec3.distance(
          [worldBounds[0], worldBounds[2], worldBounds[4]],
          [worldBounds[1], worldBounds[3], worldBounds[5]]
        ) / 2
      ).toFixed(2)}`;
      widgets.circleWidget.getWidgetState().getText().setText(text);
    });

    scene.rectangleHandle.onInteractionEvent(() => {
      const worldBounds = scene.rectangleHandle.getBounds();

      const dx = Math.abs(worldBounds[0] - worldBounds[1]);
      const dy = Math.abs(worldBounds[2] - worldBounds[3]);
      const dz = Math.abs(worldBounds[4] - worldBounds[5]);

      const perimeter = 2 * (dx + dy + dz);
      const area = dx * dy + dy * dz + dz * dx;

      const text = `perimeter: ${perimeter.toFixed(1)}mm\narea: ${area.toFixed(
        1
      )}mm²`;
      widgets.rectangleWidget.getWidgetState().getText().setText(text);
    });

    const update = () => {
      if (slicingMode > -1) {
        const slicePos = scene.rcw.getWidgetState().getCenter();

        widgets.rectangleWidget.getManipulator().setUserOrigin(slicePos);
        widgets.ellipseWidget.getManipulator().setUserOrigin(slicePos);
        widgets.circleWidget.getManipulator().setUserOrigin(slicePos);

        updateWidgetsVisibility(slicePos, slicingMode);

        scene.renderWindow.render();

        // update UI
        if (sliceCtrl) {
          sliceCtrl.max(imageData.getDimensions()[slicingMode] - 1);
          sliceCtrl.updateDisplay();
        }
      }
    };

    scene.rcw.getWidgetState().onModified(update);
    // trigger initial update
    update();

    scene.widgetManager.grabFocus(widgets[activeWidget]);
    readyAll();
  });

// register readyAll to resize event
window.addEventListener('resize', readyAll);
readyAll();

// ----------------------------------------------------------------------------
// UI logic (lil-gui)
// ----------------------------------------------------------------------------

function resetWidgets() {
  scene.rectangleHandle.reset();
  scene.ellipseHandle.reset();
  scene.circleHandle.reset();
  updateWidgetsVisibility(null, slicingMode);
  scene.widgetManager.grabFocus(widgets[activeWidget]);
}

const gui = new GUI();
const guiParams = {
  Slice: 0,
  Axis: 'K',
  Widget: 'ellipseWidget',
};

sliceCtrl = gui
  .add(guiParams, 'Slice', 0, 0, 1)
  .name('Slice #')
  .onChange((value) => {
    const pos = [...scene.rcw.getWidgetState().getCenter()];
    pos[slicingMode] = Number(value);
    scene.rcw.setCenter(pos);
    updateReslice({
      viewType: ViewTypes.XY_PLANE,
      reslice: scene.reslice,
      actor: scene.resliceActor,
      renderer: scene.renderer,
      resetFocalPoint: true,
      computeFocalPointOffset: true,
    });
    scene.renderWindow.render();
  });

gui
  .add(guiParams, 'Axis', ['I', 'J', 'K', 'O'])
  .name('Slice Axis')
  .onChange((axis) => {
    const sliceMode = 'IJKO'.indexOf(axis);
    const normal = [0, 0, 0];
    if (sliceMode === 3) {
      // Oblique mode
      slicingMode = 2;
      normal[0] = Math.sqrt(3);
      normal[1] = Math.sqrt(3);
      normal[2] = Math.sqrt(3);
    } else {
      slicingMode = sliceMode;
      normal[sliceMode] = 1;
    }
    scene.rcwInstance.setViewPlane(ViewTypes.XY_PLANE, normal);

    guiParams.Slice = scene.rcw.getWidgetState().getCenter()[slicingMode];
    sliceCtrl.updateDisplay();

    resetWidgets();
    updateReslice({
      viewType: ViewTypes.XY_PLANE,
      reslice: scene.reslice,
      actor: scene.resliceActor,
      renderer: scene.renderer,
      resetFocalPoint: true,
      computeFocalPointOffset: true,
    });
    scene.renderWindow.render();
  });

gui
  .add(guiParams, 'Widget', [
    'rectangleWidget',
    'ellipseWidget',
    'circleWidget',
  ])
  .name('Widget')
  .onChange((value) => {
    // For demo purpose, hide ellipse handles when the widget loses focus
    if (activeWidget === 'ellipseWidget') {
      widgets.ellipseWidget.setHandleVisibility(false);
    }
    scene.widgetManager.grabFocus(widgets[value]);
    activeWidget = value;
    if (activeWidget === 'ellipseWidget') {
      widgets.ellipseWidget.setHandleVisibility(true);
      scene.ellipseHandle.updateRepresentationForRender();
    }
  });

gui
  .add(
    {
      place: () => {
        if (activeWidget !== 'rectangleWidget') {
          const widget = widgets[activeWidget];
          const widgetIndex = activeWidget === 'ellipseWidget' ? 1 : 2;
          const handle =
            activeWidget === 'ellipseWidget'
              ? scene.ellipseHandle
              : scene.circleHandle;
          const coord1 = [0, 0, 0];
          const coord2 = [100, 100, 100];
          const center = scene.rcw.getWidgetState().getCenter();
          coord1[slicingMode] = center[slicingMode];
          coord2[slicingMode] = center[slicingMode];
          handle.grabFocus();
          handle.placePoint1(coord1);
          handle.placePoint2(coord2);
          // Place circle
          handle.setCorners(coord1, coord2);
          // Recompute text position
          handle.invokeInteractionEvent();
          handle.loseFocus();
          updateWidgetVisibility(widget, coord1, slicingMode, widgetIndex);
          scene.renderWindow.render();
        }
      },
    },
    'place'
  )
  .name('Place');

gui
  .add(
    {
      reset: () => {
        resetWidgets();
        scene.renderWindow.render();
      },
    },
    'reset'
  )
  .name('Reset');

// ----------------------------------------------------------------------------
// SVG
// ----------------------------------------------------------------------------

function setupSVG(widget, options) {
  bindSVGRepresentation(scene.renderer, widget.getWidgetState(), {
    mapState(widgetState, { size }) {
      const textState = widgetState.getText();
      const text = textState.getText();
      const origin = textState.getOrigin();
      if (origin && textState.getVisible()) {
        const coords = computeWorldToDisplay(scene.renderer, ...origin);
        const position = [coords[0], size[1] - coords[1]];
        return {
          text,
          position,
        };
      }
      return null;
    },
    render(data, h) {
      if (data) {
        const lines = data.text.split('\n');
        const fontSize = 32;
        const dys = multiLineTextCalculator(
          lines.length,
          fontSize,
          VerticalTextAlignment.MIDDLE
        );
        return lines.map((line, index) =>
          h(
            'text',
            {
              key: index,
              attrs: {
                x: data.position[0],
                y: data.position[1],
                dx: 12,
                dy: dys[index],
                fill: 'white',
                'font-size': fontSize,
                ...options?.textProps,
              },
            },
            line
          )
        );
      }
      return [];
    },
  });
}

setupSVG(widgets.rectangleWidget, {
  textProps: {
    'text-anchor': 'middle',
  },
});
setupSVG(widgets.ellipseWidget, {
  textProps: {
    'text-anchor': 'middle',
  },
});
setupSVG(widgets.circleWidget);

global.scene = scene;
global.widgets = widgets;
