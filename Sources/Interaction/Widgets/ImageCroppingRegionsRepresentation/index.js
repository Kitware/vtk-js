import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import Constants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation/Constants';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import WidgetConstants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';

const { Events } = Constants;
const { Orientation } = WidgetConstants;

// prettier-ignore
const LINE_ARRAY = [
  2, 0, 1,
  2, 2, 3,
  2, 4, 5,
  2, 6, 7,
  2, 0, 2,
  2, 1, 3,
  2, 4, 6,
  2, 5, 7,
  2, 0, 4,
  2, 1, 5,
  2, 2, 6,
  2, 3, 7,
];

// ----------------------------------------------------------------------------
// vtkImageCroppingRegionsRepresentation methods
// ----------------------------------------------------------------------------

// Reorders a bounds array such that each (a,b) pairing is a
// (min,max) pairing.
function reorderBounds(bounds) {
  for (let i = 0; i < 6; i += 2) {
    if (bounds[i] > bounds[i + 1]) {
      const tmp = bounds[i + 1];
      bounds[i + 1] = bounds[i];
      bounds[i] = tmp;
    }
  }
}

function vtkImageCroppingRegionsRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsRepresentation');

  // set fields from parent classes
  model.placeFactor = 1;

  model.initialBounds = [0, 1, 0, 1, 0, 1];
  model.planePositions = [0, 0, 0, 0, 0, 0];
  model.sliceOrientation = Orientation.XY;
  model.slice = 0;

  model.picker = vtkCellPicker.newInstance();
  model.picker.setPickFromList(1);
  model.picker.initializePickList();

  // order: xmin, xmax, ymin, ymax, zmin, zmax
  model.handles = Array(6)
    .fill(null)
    .map(() => {
      const source = vtkSphereSource.newInstance();
      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();

      mapper.setInputConnection(source.getOutputPort());
      actor.setMapper(mapper);

      model.picker.addPickList(actor);

      return { source, mapper, actor };
    });

  model.handlePositions = Array(6)
    .fill([])
    .map(() => [0, 0, 0]);

  model.outline = {
    polydata: vtkPolyData.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };
  // 8 corners for a box
  model.outline.polydata.getPoints().setData(new Float32Array(8 * 3), 3);
  model.outline.polydata.getLines().setData(Uint16Array.from(LINE_ARRAY));
  model.outline.mapper.setInputData(model.outline.polydata);
  model.outline.actor.setMapper(model.outline.mapper);

  model.regionPolyData = vtkPolyData.newInstance();
  model.regionPolyData.getPoints().setData(new Float32Array(16 * 3), 3);

  // This is a separate vtkPolyData for the center region
  model.centerRegionPolyData = vtkPolyData.newInstance();
  model.centerRegionPolyData.getPoints().setData(new Float32Array(4 * 3), 3);

  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance();
  model.centerMapper = vtkMapper.newInstance();
  model.centerActor = vtkActor.newInstance();

  // methods

  function updateCenterOpacity() {
    const slicePos = model.slice;
    const [
      xPLower,
      xPUpper,
      yPLower,
      yPUpper,
      zPLower,
      zPUpper,
    ] = model.planePositions;

    let centerInvisible = true;
    switch (model.sliceOrientation) {
      case Orientation.YZ:
        centerInvisible = xPLower < slicePos && slicePos < xPUpper;
        break;
      case Orientation.XZ:
        centerInvisible = yPLower < slicePos && slicePos < yPUpper;
        break;
      case Orientation.XY:
        centerInvisible = zPLower < slicePos && slicePos < zPUpper;
        break;
      default:
      // noop
    }

    model.centerActor
      .getProperty()
      .setOpacity(centerInvisible ? 0 : model.opacity);
  }

  // publicAPI.getActors = () => [model.actor, model.centerActor];
  publicAPI.getActors = () =>
    [model.outline.actor].concat(model.handles.map(({ actor }) => actor));
  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.getEventIntersection = (callData) => {
    const { x, y, z } = callData.position;
    model.picker.pick([x, y, z], callData.pokedRenderer);
    const actors = model.picker.getActors();
    if (actors.length) {
      let actorIndex = 0;

      // get actor closest to camera
      if (actors.length > 1) {
        const dists = model.picker.getPickedPositions().map((pt) => {
          const camPos = callData.pokedRenderer.getActiveCamera().getPosition();
          return vtkMath.distance2BetweenPoints(camPos, pt);
        });

        let minDist = Infinity;
        dists.forEach((d, i) => {
          if (minDist > d) {
            actorIndex = i;
            minDist = d;
          }
        });
      }

      const actor = actors[actorIndex];
      return model.handles.findIndex((h) => h.actor === actor);
    }
    return -1;
  };

  publicAPI.placeWidget = (...bounds) => {
    const boundsArray = [];

    for (let i = 0; i < bounds.length; i++) {
      boundsArray.push(bounds[i]);
    }

    if (boundsArray.length !== 6) {
      return;
    }

    // make sure each bounds pairing is monotonic
    reorderBounds(boundsArray);

    const newBounds = [];
    const center = [];
    publicAPI.adjustBounds(boundsArray, newBounds, center);

    for (let i = 0; i < 6; i++) {
      model.initialBounds[i] = newBounds[i];
    }

    model.initialLength = Math.sqrt(
      (newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0]) +
        (newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2]) +
        (newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])
    );

    publicAPI.modified();
  };

  publicAPI.setSlice = (slice) => {
    if (slice !== model.slice) {
      model.slice = slice;
    }
  };

  publicAPI.setSliceOrientation = (sliceOrientation) => {
    if (sliceOrientation !== model.sliceOrientation) {
      model.sliceOrientation = sliceOrientation;
    }
  };

  publicAPI.setOpacity = (opacityValue) => {
    const opacity = Math.max(0, Math.min(1, opacityValue));
    if (opacity !== model.opacity) {
      model.opacity = opacity;
      model.actor.getProperty().setOpacity(opacity);
      updateCenterOpacity();
      publicAPI.modified();
    }
  };

  publicAPI.setEdgeColor = (...edgeColor) => {
    if (
      model.edgeColor[0] !== edgeColor[0] ||
      model.edgeColor[1] !== edgeColor[1] ||
      model.edgeColor[2] !== edgeColor[2]
    ) {
      model.edgeColor = edgeColor;
      model.actor.getProperty().setEdgeColor(...model.edgeColor);
      publicAPI.modified();
    }
  };

  // Force update the geometry
  publicAPI.updateGeometry = () => {
    const outlinePoints = model.outline.polydata.getPoints().getData();

    for (let i = 0; i < model.handles.length; ++i) {
      const { actor, source } = model.handles[i];
      source.setRadius(5);
      source.setCenter(model.handlePositions[i]);

      if (model.activeHandleIndex === i) {
        actor.getProperty().setColor(0, 1, 0);
      } else {
        actor.getProperty().setColor(1, 1, 1);
      }
    }

    for (let i = 0; i < model.bboxCorners.length; ++i) {
      outlinePoints.set(model.bboxCorners[i], i * 3);
    }

    model.outline.polydata.getPoints().setData(outlinePoints);

    model.outline.polydata.modified();
  };

  publicAPI.getBounds = () => model.initialBounds;

  publicAPI.buildRepresentation = () => {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }

      publicAPI.updateGeometry();
    }
  };

  publicAPI.setProperty = (property) => {
    model.actor.setProperty(property);
  };

  // modifications will result in geometry updates
  publicAPI.onModified(publicAPI.updateGeometry);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeHandleIndex: -1,
  handlePositions: Array(6).fill([0, 0, 0]),
  bboxCorners: Array(8).fill([0, 0, 0]),
  opacity: 0.5,
  edgeColor: [1.0, 1.0, 1.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  Events.forEach((eventName) => macro.event(publicAPI, model, eventName));

  macro.get(publicAPI, model, [
    'initialBounds',
    'planePositions',
    'sliceOrientation',
    'slice',
    'opacity',
    'edgeColor',
  ]);

  macro.setGet(publicAPI, model, ['activeHandleIndex']);
  macro.setGetArray(publicAPI, model, ['handlePositions'], 6);
  macro.setGetArray(publicAPI, model, ['bboxCorners'], 8);

  // Object methods
  vtkImageCroppingRegionsRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageCroppingRegionsRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
