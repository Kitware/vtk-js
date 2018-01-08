import macro                   from 'vtk.js/Sources/macro';
import vtkActor                from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCellPicker           from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';
import vtkMapper               from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData             from 'vtk.js/Sources/Common/DataModel/PolyData';
import Constants               from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation/Constants';

const { vtkErrorMacro } = macro;
const { Orientation } = Constants;

// ----------------------------------------------------------------------------
// vtkImageCroppingRegionsRepresentation methods
// ----------------------------------------------------------------------------

function vtkImageCroppingRegionsRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsRepresentation');

  // this is called at the end of the enclosing function.
  function constructor() {
    // set fields from parent classes
    model.placeFactor = 1;

    model.initialBounds = [0, 1, 0, 1, 0, 1];
    // Format:
    // [xmin, xmax, ymin, ymax, zmin, zmax]
    model.planePositions = [0, 0, 0, 0, 0, 0];
    model.sliceOrientation = Orientation.XY;
    model.slice = 0;

    // construct region polydata
    model.regionPolyData = vtkPolyData.newInstance();
    model.regionPolyData.getPoints().setData(new Float32Array(16 * 3), 3);
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
    model.regionPolyData.getPolys().setData(new Uint32Array([
      4, 0, 1, 2, 3,
      4, 1, 4, 7, 2,
      4, 4, 5, 6, 7,
      4, 7, 6, 9, 8,
      4, 8, 9, 10, 11,
      4, 13, 8, 11, 14,
      4, 12, 13, 14, 15,
      4, 3, 2, 13, 12,
    ]), 1);

    model.mapper = vtkMapper.newInstance();
    model.actor = vtkActor.newInstance();

    model.mapper.setInputData(model.regionPolyData);
    model.actor.setMapper(model.mapper);
    model.actor.getProperty().setEdgeColor(1.0, 0, 0);
    model.actor.getProperty().setEdgeVisibility(true);
    publicAPI.setOpacity(model.opacity);

    // set picker
    model.cursorPicker = vtkCellPicker.newInstance();
  }

  publicAPI.getActors = () => model.actor;
  publicAPI.getNestedProps = () => publicAPI.getActors();

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
        ((newBounds[1] - newBounds[0]) * (newBounds[1] - newBounds[0])) +
        ((newBounds[3] - newBounds[2]) * (newBounds[3] - newBounds[2])) +
        ((newBounds[5] - newBounds[4]) * (newBounds[5] - newBounds[4])));

    // set plane positions
    publicAPI.setPlanePositions(...model.initialBounds);
  };

  publicAPI.setSlice = (slice, sliceOrientation) => {
    model.slice = slice;
    model.sliceOrientation = sliceOrientation;
    publicAPI.updateGeometry();
  };

  publicAPI.setOpacity = (opacityValue) => {
    const opacity = Math.max(0, Math.min(1, opacityValue));
    model.actor.getProperty().setOpacity(opacity);
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
      if (positions[i] < model.initialBounds[i] || positions[i] > model.initialBounds[i + 1]) {
        positions[i] = model.initialBounds[i];
      }
      if (positions[i + 1] < model.initialBounds[i] || positions[i + 1] > model.initialBounds[i + 1]) {
        positions[i + 1] = model.initialBounds[i + 1];
      }
    }

    // set plane positions
    model.planePositions = positions;
    publicAPI.updateGeometry();
  };

  publicAPI.updateGeometry = () => {
    const slicePos = model.slice;
    const verts = model.regionPolyData.getPoints().getData();
    const [xBMin, xBMax, yBMin, yBMax, zBMin, zBMax] = model.initialBounds;
    const [xPLower, xPUpper, yPLower, yPUpper, zPLower, zPUpper] = model.planePositions;

    // set vert coordinates depending on slice orientation
    switch (model.sliceOrientation) {
      case Orientation.YZ:
        verts.set([slicePos, yBMin, zBMin], 0);
        verts.set([slicePos, yPLower, zBMin], 3);
        verts.set([slicePos, yPLower, zPLower], 6);
        verts.set([slicePos, yBMin, zPLower], 9);
        verts.set([slicePos, yPUpper, zBMin], 12);
        verts.set([slicePos, yBMax, zBMin], 15);
        verts.set([slicePos, yBMax, zPLower], 18);
        verts.set([slicePos, yPUpper, zPLower], 21);
        verts.set([slicePos, yPUpper, zPUpper], 24);
        verts.set([slicePos, yBMax, zPUpper], 27);
        verts.set([slicePos, yBMax, zBMax], 30);
        verts.set([slicePos, yPUpper, zBMax], 33);
        verts.set([slicePos, yBMin, zPUpper], 36);
        verts.set([slicePos, yPLower, zPUpper], 39);
        verts.set([slicePos, yPLower, zBMax], 42);
        verts.set([slicePos, yBMin, zBMax], 45);
        break;
      case Orientation.XZ:
        verts.set([xBMin, slicePos, zBMin], 0);
        verts.set([xPLower, slicePos, zBMin], 3);
        verts.set([xPLower, slicePos, zPLower], 6);
        verts.set([xBMin, slicePos, zPLower], 9);
        verts.set([xPUpper, slicePos, zBMin], 12);
        verts.set([xBMax, slicePos, zBMin], 15);
        verts.set([xBMax, slicePos, zPLower], 18);
        verts.set([xPUpper, slicePos, zPLower], 21);
        verts.set([xPUpper, slicePos, zPUpper], 24);
        verts.set([xBMax, slicePos, zPUpper], 27);
        verts.set([xBMax, slicePos, zBMax], 30);
        verts.set([xPUpper, slicePos, zBMax], 33);
        verts.set([xBMin, slicePos, zPUpper], 36);
        verts.set([xPLower, slicePos, zPUpper], 39);
        verts.set([xPLower, slicePos, zBMax], 42);
        verts.set([xBMin, slicePos, zBMax], 45);
        break;
      case Orientation.XY:
        verts.set([xBMin, yBMin, slicePos], 0);
        verts.set([xPLower, yBMin, slicePos], 3);
        verts.set([xPLower, yPLower, slicePos], 6);
        verts.set([xBMin, yPLower, slicePos], 9);
        verts.set([xPUpper, yBMin, slicePos], 12);
        verts.set([xBMax, yBMin, slicePos], 15);
        verts.set([xBMax, yPLower, slicePos], 18);
        verts.set([xPUpper, yPLower, slicePos], 21);
        verts.set([xPUpper, yPUpper, slicePos], 24);
        verts.set([xBMax, yPUpper, slicePos], 27);
        verts.set([xBMax, yBMax, slicePos], 30);
        verts.set([xPUpper, yBMax, slicePos], 33);
        verts.set([xBMin, yPUpper, slicePos], 36);
        verts.set([xPLower, yPUpper, slicePos], 39);
        verts.set([xPLower, yBMax, slicePos], 42);
        verts.set([xBMin, yBMax, slicePos], 45);
        break;
      default:
        // noop
    }
    model.regionPolyData.modified();
  };

  publicAPI.getBounds = () => model.initialBounds;

  publicAPI.buildRepresentation = () => {
    if (model.renderer) {
      if (!model.placed) {
        model.validPick = 1;
        model.placed = 1;
      }
      publicAPI.modified();
    }
  };

  publicAPI.setProperty = (property) => {
    model.actor.setProperty(property);
  };

  // invoke the constructor after setting up public methods
  constructor();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  opacity: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'initialBounds',
    'planePositions',
    'sliceOrientation',
    'slice',
    'opacity',
  ]);

  // Object methods
  vtkImageCroppingRegionsRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCroppingRegionsRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
