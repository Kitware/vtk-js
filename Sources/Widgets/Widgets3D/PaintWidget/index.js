import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let painting = false;

  publicAPI.handleLeftButtonPress = () => {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }

    painting = true;
    return macro.EVENT_ABORT;
  };
  // if (!model.activeState || !model.activeState.getActive()) {
  //   return macro.VOID;
  // }
  // if (model.type === Type.Drag) {
  //   isDragging = true;
  //   model.interactor.requestAnimation(publicAPI);
  //   return macro.EVENT_ABORT;
  // }
  // return macro.VOID;

  publicAPI.handleMouseMove = (callData) => publicAPI.handleEvent(callData);

  publicAPI.handleLeftButtonRelease = () => {
    painting = false;
    // if (isDragging) {
    //   model.interactor.cancelAnimation(publicAPI);
    // }
    // isDragging = false;
    // model.widgetState.deactivate();
  };

  publicAPI.handleEvent = (callData) => {
    if (
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive()
    ) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (worldCoords.length) {
        model.activeState.setOrigin(...worldCoords);
        model.widgetState.getCircle().setOrigin(...worldCoords);
        model.widgetState.getHandle2D().setOrigin(...worldCoords);
      }

      if (painting) {
        console.log('painting', worldCoords);
      }
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.activeState = model.widgetState.getHandle();
      model.activeState.activate();
      model.interactor.requestAnimation(publicAPI);
    }
    model.hasFocus = true;
  };

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }
    model.widgetState.deactivate();
    model.widgetState.getHandle().deactivate();
    model.activeState = null;
    model.hasFocus = false;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPaintWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPaintWidget');

  let imageMapperSub = null;

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
        return [
          { builder: vtkSphereHandleRepresentation, labels: ['handle2D'] },
          { builder: vtkCircleContextRepresentation, labels: ['circle'] },
        ];
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handle'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: model.radius,
        origin: [0, 0, 0],
      },
    })
    .addStateFromMixin({
      labels: ['circle'],
      mixins: ['origin', 'color', 'scale1', 'direction', 'visible'],
      name: 'circle',
      initialValues: {
        scale1: model.radius / 2,
        origin: [0, 0, 0],
        direction: [0, 0, 1],
        visible: true,
      },
    })
    .addStateFromMixin({
      labels: ['handle2D'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'handle2D',
      initialValues: {
        scale1: model.radius,
        origin: [0, 0, 0],
        visible: true,
      },
    })
    .build();

  const handle = model.widgetState.getHandle();
  const handle2D = model.widgetState.getHandle2D();
  const circle = model.widgetState.getCircle();

  // Default manipulator
  model.manipulator = vtkPlaneManipulator.newInstance();
  handle.setManipulator(model.manipulator);

  function onImageMapperModified() {
    const ds = model.imageMapper.getInputData();
    if (ds) {
      const slicingMode = model.imageMapper.getSlicingMode() % 3;

      if (slicingMode > -1) {
        const ijk = [0, 0, 0];
        const position = [0, 0, 0];
        const normal = [0, 0, 0];

        // position
        ijk[slicingMode] = model.imageMapper.getSlice() + 1; // +1 to be above slice for placing the 2D circle context
        ds.indexToWorldVec3(ijk, position);

        // circle/slice normal
        ijk[slicingMode] = 1;
        ds.indexToWorldVec3(ijk, normal);

        model.manipulator.setOrigin(position);
        model.manipulator.setNormal(normal);
        circle.rotateFromDirections(circle.getDirection(), normal);
      }
    }
  }

  // override
  const superSetImageMapper = publicAPI.setImageMapper;
  publicAPI.setImageMapper = (im) => {
    if (superSetImageMapper(im)) {
      if (imageMapperSub) {
        imageMapperSub.unsubscribe();
        imageMapperSub = null;
      }

      if (im) {
        imageMapperSub = im.onModified(onImageMapperModified);
        onImageMapperModified();
      }
    }
  };

  // override
  const superSetRadius = publicAPI.setRadius;
  publicAPI.setRadius = (r) => {
    if (superSetRadius(r)) {
      handle.setScale1(r);
      handle2D.setScale1(r);
      // b/c there's a factor of 2 multipleid to circle's radius
      circle.setScale1(r / 2);
    }
  };

  // override
  const superSetBrushDesign = publicAPI.setBrushDesign;
  publicAPI.setBrushDesign = (b) => {
    if (superSetBrushDesign(b)) {
      model.widgetState.getCircle().setVisible(b === 0);
      model.widgetState.getHandle2D().setVisible(b === 1);
    }
  };

  publicAPI.delete = macro.chain(() => {
    if (imageMapperSub) {
      imageMapperSub.unsubscribe();
    }
  }, publicAPI.delete);

  // --------------------------------------------------------------------------

  publicAPI.setBrushDesign(1);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
  imageMapper: null,
  radius: 1,
  brushDesign: 0, // 0=circle, 1=sphere
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'manipulator',
    'imageMapper',
    'radius',
    'brushDesign',
  ]);

  vtkPaintWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
