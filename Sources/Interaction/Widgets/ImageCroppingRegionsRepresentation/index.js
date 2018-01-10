import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import Constants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation/Constants';
import WidgetConstants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';

const { vtkErrorMacro } = macro;
const { Events } = Constants;
const { Orientation } = WidgetConstants;

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
  // Format:
  // [xmin, xmax, ymin, ymax, zmin, zmax]
  model.planePositions = [0, 0, 0, 0, 0, 0];
  model.sliceOrientation = Orientation.XY;
  model.slice = 0;

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

  publicAPI.getActors = () => [model.actor, model.centerActor];
  publicAPI.getNestedProps = () => publicAPI.getActors();

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

    // set plane positions
    publicAPI.setPlanePositions(...model.initialBounds);
  };

  publicAPI.setSlice = (slice) => {
    if (slice !== model.slice) {
      model.slice = slice;
      publicAPI.updateGeometry();
    }
  };

  publicAPI.setSliceOrientation = (sliceOrientation) => {
    if (sliceOrientation !== model.sliceOrientation) {
      model.sliceOrientation = sliceOrientation;
      publicAPI.updateGeometry();
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

  publicAPI.setPlanePositions = (...positions) => {
    if (positions.length !== 6) {
      vtkErrorMacro('setPlanePositions() must be given a 3D boundaries array');
      return;
    }

    // swap around plane boundaries if not in order
    reorderBounds(positions);

    // make sure each position is within the bounds
    for (let i = 0; i < 6; i += 2) {
      if (
        positions[i] < model.initialBounds[i] ||
        positions[i] > model.initialBounds[i + 1]
      ) {
        positions[i] = model.initialBounds[i];
      }
      if (
        positions[i + 1] < model.initialBounds[i] ||
        positions[i + 1] > model.initialBounds[i + 1]
      ) {
        positions[i + 1] = model.initialBounds[i + 1];
      }
    }

    // set plane positions
    model.planePositions = positions;
    publicAPI.updateGeometry();
  };

  // Force update the geometry
  publicAPI.updateGeometry = () => {
    const slicePos = model.slice;
    const verts = model.regionPolyData.getPoints().getData();
    const centerVerts = model.centerRegionPolyData.getPoints().getData();
    const [xBMin, xBMax, yBMin, yBMax, zBMin, zBMax] = model.initialBounds;
    const [
      xPLower,
      xPUpper,
      yPLower,
      yPUpper,
      zPLower,
      zPUpper,
    ] = model.planePositions;

    // set vert coordinates depending on slice orientation
    // slicePos offsets are a hack to get polydata edges to render correctly.
    switch (model.sliceOrientation) {
      case Orientation.YZ:
        verts.set([slicePos, yBMin, zBMin], 0);
        verts.set([slicePos, yPLower, zBMin], 3);
        verts.set([slicePos + 0.01, yPLower, zPLower], 6);
        verts.set([slicePos, yBMin, zPLower], 9);
        verts.set([slicePos + 0.01, yPUpper, zBMin], 12);
        verts.set([slicePos, yBMax, zBMin], 15);
        verts.set([slicePos + 0.01, yBMax, zPLower], 18);
        verts.set([slicePos, yPUpper, zPLower], 21);
        verts.set([slicePos + 0.01, yPUpper, zPUpper], 24);
        verts.set([slicePos, yBMax, zPUpper], 27);
        verts.set([slicePos, yBMax, zBMax], 30);
        verts.set([slicePos, yPUpper, zBMax], 33);
        verts.set([slicePos + 0.01, yBMin, zPUpper], 36);
        verts.set([slicePos, yPLower, zPUpper], 39);
        verts.set([slicePos + 0.01, yPLower, zBMax], 42);
        verts.set([slicePos, yBMin, zBMax], 45);

        centerVerts.set([slicePos, yPLower, zPLower], 0);
        centerVerts.set([slicePos, yPUpper, zPLower], 3);
        centerVerts.set([slicePos, yPUpper, zPUpper], 6);
        centerVerts.set([slicePos, yPLower, zPUpper], 9);
        break;
      case Orientation.XZ:
        verts.set([xBMin, slicePos, zBMin], 0);
        verts.set([xPLower, slicePos, zBMin], 3);
        verts.set([xPLower, slicePos + 0.01, zPLower], 6);
        verts.set([xBMin, slicePos, zPLower], 9);
        verts.set([xPUpper, slicePos + 0.01, zBMin], 12);
        verts.set([xBMax, slicePos, zBMin], 15);
        verts.set([xBMax, slicePos + 0.01, zPLower], 18);
        verts.set([xPUpper, slicePos, zPLower], 21);
        verts.set([xPUpper, slicePos + 0.01, zPUpper], 24);
        verts.set([xBMax, slicePos, zPUpper], 27);
        verts.set([xBMax, slicePos, zBMax], 30);
        verts.set([xPUpper, slicePos, zBMax], 33);
        verts.set([xBMin, slicePos, zPUpper], 36);
        verts.set([xPLower, slicePos, zPUpper], 39);
        verts.set([xPLower, slicePos + 0.01, zBMax], 42);
        verts.set([xBMin, slicePos, zBMax], 45);

        centerVerts.set([xPLower, slicePos, zPLower], 0);
        centerVerts.set([xPUpper, slicePos, zPLower], 3);
        centerVerts.set([xPUpper, slicePos, zPUpper], 6);
        centerVerts.set([xPLower, slicePos, zPUpper], 9);
        break;
      case Orientation.XY:
        verts.set([xBMin, yBMin, slicePos], 0);
        verts.set([xPLower, yBMin, slicePos], 3);
        verts.set([xPLower, yPLower, slicePos + 0.01], 6);
        verts.set([xBMin, yPLower, slicePos], 9);
        verts.set([xPUpper, yBMin, slicePos + 0.01], 12);
        verts.set([xBMax, yBMin, slicePos], 15);
        verts.set([xBMax, yPLower, slicePos + 0.01], 18);
        verts.set([xPUpper, yPLower, slicePos], 21);
        verts.set([xPUpper, yPUpper, slicePos + 0.01], 24);
        verts.set([xBMax, yPUpper, slicePos], 27);
        verts.set([xBMax, yBMax, slicePos], 30);
        verts.set([xPUpper, yBMax, slicePos], 33);
        verts.set([xBMin, yPUpper, slicePos + 0.01], 36);
        verts.set([xPLower, yPUpper, slicePos], 39);
        verts.set([xPLower, yBMax, slicePos + 0.01], 42);
        verts.set([xBMin, yBMax, slicePos], 45);

        centerVerts.set([xPLower, yPLower, slicePos], 0);
        centerVerts.set([xPUpper, yPLower, slicePos], 3);
        centerVerts.set([xPUpper, yPUpper, slicePos], 6);
        centerVerts.set([xPLower, yPUpper, slicePos], 9);
        break;
      default:
      // noop
    }

    // This requires updating whenever geometry updates
    updateCenterOpacity();

    model.regionPolyData.modified();
    model.centerRegionPolyData.modified();

    publicAPI.invokePlanesPositionChanged();
    publicAPI.modified();
  };

  publicAPI.getBounds = () => model.initialBounds;

  publicAPI.buildRepresentation = () => {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }

      /*
      15-14-----11-10
      |            |
      12 13-----8  9
      |  |      |  |
      3  2------7  6
      |            |
      0--1------4--5
      */
      // set polys

      // prettier-ignore
      model.regionPolyData
        .getPolys()
        .setData(
          new Uint32Array([
            4, 0, 1, 2, 3,
            4, 1, 4, 7, 2,
            4, 4, 5, 6, 7,
            4, 7, 6, 9, 8,
            4, 8, 9, 10, 11,
            4, 13, 8, 11, 14,
            4, 12, 13, 14, 15,
            4, 3, 2, 13, 12,
          ]),
          1,
        );
      model.centerRegionPolyData
        .getPolys()
        .setData(new Uint32Array([4, 0, 1, 2, 3]), 1);

      model.mapper.setInputData(model.regionPolyData);
      model.actor.setMapper(model.mapper);
      model.actor.getProperty().setEdgeVisibility(true);

      model.centerMapper.setInputData(model.centerRegionPolyData);
      model.centerActor.setMapper(model.centerMapper);

      publicAPI.setEdgeColor(...model.edgeColor);
      publicAPI.setOpacity(model.opacity);

      publicAPI.modified();
    }
  };

  publicAPI.setProperty = (property) => {
    model.actor.setProperty(property);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
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
