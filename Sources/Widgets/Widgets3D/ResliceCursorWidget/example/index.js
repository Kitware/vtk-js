import 'vtk.js/Sources/favicon';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkResliceCursorWidget from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';

import {
  ViewTypes,
  CaptureOn,
} from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import { getViewPlaneNameFromViewType } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

// ----------------------------------------------------------------------------
// Define html structure
// ----------------------------------------------------------------------------

const container = document.querySelector('body');
const table = document.createElement('table');
table.setAttribute('id', 'table');
container.appendChild(table);

const trLine1 = document.createElement('tr');
trLine1.setAttribute('id', 'line1');
table.appendChild(trLine1);

const trLine2 = document.createElement('tr');
trLine2.setAttribute('id', 'line2');
table.appendChild(trLine2);

// ----------------------------------------------------------------------------
// Setup rendering code
// ----------------------------------------------------------------------------

const viewAttributes = [];
const widget = vtkResliceCursorWidget.newInstance();
widget.getWidgetState().setOpacity(0.6);
const sliceTypes = [ViewTypes.YZ_PLANE, ViewTypes.XZ_PLANE, ViewTypes.XY_PLANE];

for (let i = 0; i < 3; i++) {
  const element = document.createElement('td');

  if (i === 2) {
    trLine2.appendChild(element);
  } else {
    trLine1.appendChild(element);
  }

  const obj = {
    renderWindow: vtkRenderWindow.newInstance(),
    renderer: vtkRenderer.newInstance(),
    GLWindow: vtkOpenGLRenderWindow.newInstance(),
    interactor: vtkRenderWindowInteractor.newInstance(),
    widgetManager: vtkWidgetManager.newInstance(),
  };

  obj.renderer.getActiveCamera().setParallelProjection(true);
  obj.renderer.setBackground(1, 1, 0);
  obj.renderWindow.addRenderer(obj.renderer);
  obj.renderWindow.addView(obj.GLWindow);
  obj.renderWindow.setInteractor(obj.interactor);
  obj.GLWindow.setContainer(element);
  obj.interactor.setView(obj.GLWindow);
  obj.interactor.initialize();
  obj.interactor.bindEvents(element);
  obj.interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
  obj.widgetManager.setRenderer(obj.renderer);
  obj.widgetInstance = obj.widgetManager.addWidget(widget, sliceTypes[i]);
  obj.widgetManager.enablePicking();
  // Use to update all renderers buffer when actors are moved
  obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);

  obj.reslice = vtkImageReslice.newInstance();
  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2);
  obj.resliceMapper = vtkImageMapper.newInstance();
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  obj.resliceActor = vtkImageSlice.newInstance();
  obj.resliceActor.setMapper(obj.resliceMapper);

  viewAttributes.push(obj);

  // create axes
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: '+X',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceColor: '#0000ff',
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  // axes.setXPlusFaceProperty({ text: '+X' });
  axes.setXMinusFaceProperty({
    text: '-X',
    faceColor: '#ffff00',
    faceRotation: 90,
    fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: '+Y',
    faceColor: '#00ff00',
    fontSizeScale: (res) => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: '-Y',
    faceColor: '#00ffff',
    fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: '+Z',
    edgeColor: 'yellow',
  });
  axes.setZMinusFaceProperty({
    text: '-Z',
    faceRotation: 45,
    edgeThickness: 0,
  });

  // create orientation widget
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: obj.renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
  );
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);
}

// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------

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
  const modified = widget.updateReslicePlane(
    interactionContext.reslice,
    interactionContext.viewType
  );
  if (modified) {
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
  return modified;
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    widget.setImage(image);

    for (let i = 0; i < viewAttributes.length; i++) {
      const obj = viewAttributes[i];
      obj.reslice.setInputData(image);
      obj.renderer.addActor(obj.resliceActor);
      // const widgetState = widget.getWidgetState();
      const reslice = obj.reslice;
      let viewType = ViewTypes.XY_PLANE;
      if (i === 0) {
        viewType = ViewTypes.YZ_PLANE;
      } else if (i === 1) {
        viewType = ViewTypes.XZ_PLANE;
      }

      viewAttributes
        // No need to update plane nor refresh when interaction
        // is on current view. Plane can't be changed with interaction on current
        // view. Refreshs happen automatically with `animation`.
        // Note: Need to refresh also the current view because of adding the mouse wheel
        // to change slicer
        .forEach((v) => {
          // Interactions in other views may change current plane
          v.widgetInstance.onInteractionEvent(
            // computeFocalPointOffset: Boolean which defines if the offset between focal point and
            // reslice cursor display center has to be recomputed (while translation is applied)
            // canUpdateFocalPoint: Boolean which defines if the focal point can be updated because
            // the current interaction is a rotation
            ({ computeFocalPointOffset, canUpdateFocalPoint }) => {
              const activeViewName = widget
                .getWidgetState()
                .getActiveViewName();
              const currentViewName = getViewPlaneNameFromViewType(viewType);
              updateReslice({
                viewType,
                reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: false,
                keepFocalPointPosition:
                  activeViewName !== currentViewName && canUpdateFocalPoint,
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
    }
  });
});
