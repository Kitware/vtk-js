import macro from 'vtk.js/Sources/macros';
import vtkAbstractPicker from 'vtk.js/Sources/Rendering/Core/AbstractPicker';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { mat4, vec3, vec4 } from 'gl-matrix';

const { vtkErrorMacro } = macro;
const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPicker methods
// ----------------------------------------------------------------------------

function vtkPicker(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPicker');

  const superClass = { ...publicAPI };

  function initialize() {
    superClass.initialize();

    model.actors = [];
    model.pickedPositions = [];

    model.mapperPosition[0] = 0.0;
    model.mapperPosition[1] = 0.0;
    model.mapperPosition[2] = 0.0;

    model.mapper = null;
    model.dataSet = null;

    model.globalTMin = Number.MAX_VALUE;
  }

  /**
   * Compute the tolerance in world coordinates.
   * Do this by determining the world coordinates of the diagonal points of the
   * window, computing the width of the window in world coordinates, and
   * multiplying by the tolerance.
   * @param {Number} selectionZ
   * @param {Number} aspect
   * @param {vtkRenderer} renderer
   * @returns {Number} the computed tolerance
   */
  function computeTolerance(selectionZ, aspect, renderer) {
    let tolerance = 0.0;

    const view = renderer.getRenderWindow().getViews()[0];
    const viewport = renderer.getViewport();
    const winSize = view.getSize();

    let x = winSize[0] * viewport[0];
    let y = winSize[1] * viewport[1];

    const normalizedLeftDisplay = view.displayToNormalizedDisplay(
      x,
      y,
      selectionZ
    );
    const windowLowerLeft = renderer.normalizedDisplayToWorld(
      normalizedLeftDisplay[0],
      normalizedLeftDisplay[1],
      normalizedLeftDisplay[2],
      aspect
    );

    x = winSize[0] * viewport[2];
    y = winSize[1] * viewport[3];

    const normalizedRightDisplay = view.displayToNormalizedDisplay(
      x,
      y,
      selectionZ
    );
    const windowUpperRight = renderer.normalizedDisplayToWorld(
      normalizedRightDisplay[0],
      normalizedRightDisplay[1],
      normalizedRightDisplay[2],
      aspect
    );

    for (let i = 0; i < 3; i++) {
      tolerance +=
        (windowUpperRight[i] - windowLowerLeft[i]) *
        (windowUpperRight[i] - windowLowerLeft[i]);
    }

    return Math.sqrt(tolerance);
  }

  /**
   * Perform picking on the given renderer, given a ray defined in world coordinates.
   * @param {*} renderer
   * @param {*} tolerance
   * @param {*} p1World
   * @param {*} p2World
   * @returns true if we picked something else false
   */
  function pick3DInternal(renderer, tolerance, p1World, p2World) {
    const p1Mapper = new Float64Array(4);
    const p2Mapper = new Float64Array(4);

    const ray = [];
    const hitPosition = [];

    const props = model.pickFromList ? model.pickList : renderer.getActors();

    // pre-allocate some arrays.
    const transformScale = new Float64Array(3);
    const pickedPosition = new Float64Array(3);

    // Loop over props.
    // Transform ray (defined from position of camera to selection point) into coordinates of mapper (not
    // transformed to actors coordinates!  Reduces overall computation!!!).
    // Note that only vtkProp3D's can be picked by vtkPicker.
    props.forEach((prop) => {
      const mapper = prop.getMapper();

      const propIsFullyTranslucent =
        prop.getProperty?.().getOpacity?.() === 0.0;

      const pickable =
        prop.getNestedPickable() &&
        prop.getNestedVisibility() &&
        !propIsFullyTranslucent;

      if (!pickable) {
        // prop cannot be picked
        return;
      }

      // The prop is candidate for picking:
      // - get its composite matrix and invert it
      // - use the inverted matrix to transform the ray points into mapper coordinates
      model.transformMatrix = prop.getMatrix().slice(0);
      mat4.transpose(model.transformMatrix, model.transformMatrix);

      mat4.invert(model.transformMatrix, model.transformMatrix);

      vec4.transformMat4(p1Mapper, p1World, model.transformMatrix);
      vec4.transformMat4(p2Mapper, p2World, model.transformMatrix);

      vec3.scale(p1Mapper, p1Mapper, 1 / p1Mapper[3]);
      vec3.scale(p2Mapper, p2Mapper, 1 / p2Mapper[3]);

      vtkMath.subtract(p2Mapper, p1Mapper, ray);

      // We now have the ray endpoints in mapper coordinates.
      // Compare it with the mapper bounds to check if intersection is possible.

      // Get the bounding box of the mapper.
      // Note that the tolerance is added to the bounding box to make sure things on the edge of the
      // bounding box are picked correctly.
      const bounds = mapper
        ? vtkBoundingBox.inflate(mapper.getBounds(), tolerance)
        : [...vtkBoundingBox.INIT_BOUNDS];

      if (vtkBoundingBox.intersectBox(bounds, p1Mapper, ray, hitPosition, [])) {
        mat4.getScaling(transformScale, model.transformMatrix);

        const t = model.intersectWithLine(
          p1Mapper,
          p2Mapper,
          tolerance *
            0.333 *
            (transformScale[0] + transformScale[1] + transformScale[2]),
          prop,
          mapper
        );

        if (t < Number.MAX_VALUE) {
          pickedPosition[0] = (1.0 - t) * p1World[0] + t * p2World[0];
          pickedPosition[1] = (1.0 - t) * p1World[1] + t * p2World[1];
          pickedPosition[2] = (1.0 - t) * p1World[2] + t * p2World[2];

          const actorIndex = model.actors.indexOf(prop);

          if (actorIndex !== -1) {
            // If already in list, compare the previous picked position with the new one.
            // Store the new one if it is closer from the ray endpoint.
            const previousPickedPosition = model.pickedPositions[actorIndex];
            if (
              vtkMath.distance2BetweenPoints(p1World, pickedPosition) <
              vtkMath.distance2BetweenPoints(p1World, previousPickedPosition)
            ) {
              model.pickedPositions[actorIndex] = pickedPosition.slice(0);
            }
          } else {
            model.actors.push(prop);
            model.pickedPositions.push(pickedPosition.slice(0));
          }
        }
      }
    });

    // sort array by distance
    const tempArray = [];
    for (let i = 0; i < model.pickedPositions.length; i++) {
      tempArray.push({
        actor: model.actors[i],
        pickedPosition: model.pickedPositions[i],
        distance2: vtkMath.distance2BetweenPoints(
          p1World,
          model.pickedPositions[i]
        ),
      });
    }
    tempArray.sort((a, b) => {
      const keyA = a.distance2;
      const keyB = b.distance2;
      // order the actors based on the distance2 attribute, so the near actors comes
      // first in the list
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    model.pickedPositions = [];
    model.actors = [];
    tempArray.forEach((obj) => {
      model.pickedPositions.push(obj.pickedPosition);
      model.actors.push(obj.actor);
    });
  }

  // Intersect data with specified ray.
  // Project the center point of the mapper onto the ray and determine its parametric value
  model.intersectWithLine = (p1, p2, tolerance, prop, mapper) => {
    if (!mapper) {
      return Number.MAX_VALUE;
    }

    const center = mapper.getCenter();
    const ray = vec3.subtract(new Float64Array(3), p2, p1);

    const rayFactor = vtkMath.dot(ray, ray);
    if (rayFactor === 0.0) {
      return 2.0;
    }

    // Project the center point onto the ray and determine its parametric value
    const t =
      (ray[0] * (center[0] - p1[0]) +
        ray[1] * (center[1] - p1[1]) +
        ray[2] * (center[2] - p1[2])) /
      rayFactor;
    return t;
  };

  // To be overridden in subclasses
  publicAPI.pick = (selection, renderer) => {
    if (selection.length !== 3) {
      vtkWarningMacro('vtkPicker.pick - selection needs three components');
    }

    if (!renderer) {
      vtkErrorMacro('vtkPicker.pick - renderer cannot be null');
      throw new Error('renderer cannot be null');
    }

    initialize();

    const selectionX = selection[0];
    const selectionY = selection[1];
    let selectionZ = selection[2];

    model.renderer = renderer;
    model.selectionPoint[0] = selectionX;
    model.selectionPoint[1] = selectionY;
    model.selectionPoint[2] = selectionZ;

    const p1World = new Float64Array(4);
    const p2World = new Float64Array(4);

    // Get camera focal point and position. Convert to display (screen)
    // coordinates. We need a depth value for z-buffer.
    const camera = renderer.getActiveCamera();
    const cameraPos = camera.getPosition();
    const cameraFP = camera.getFocalPoint();

    const view = renderer.getRenderWindow().getViews()[0];
    const dims = view.getViewportSize(renderer);

    if (dims[1] === 0) {
      vtkWarningMacro('vtkPicker.pick - viewport area is 0');
      return;
    }

    const aspect = dims[0] / dims[1];

    let displayCoords = [];
    displayCoords = renderer.worldToNormalizedDisplay(
      cameraFP[0],
      cameraFP[1],
      cameraFP[2],
      aspect
    );
    displayCoords = view.normalizedDisplayToDisplay(
      displayCoords[0],
      displayCoords[1],
      displayCoords[2]
    );
    selectionZ = displayCoords[2];

    // Convert the selection point into world coordinates.
    const normalizedDisplay = view.displayToNormalizedDisplay(
      selectionX,
      selectionY,
      selectionZ
    );
    const worldCoords = renderer.normalizedDisplayToWorld(
      normalizedDisplay[0],
      normalizedDisplay[1],
      normalizedDisplay[2],
      aspect
    );

    for (let i = 0; i < 3; i++) {
      model.pickPosition[i] = worldCoords[i];
    }

    //  Compute the ray endpoints. The ray is along the line running from
    //  the camera position to the selection point, starting where this line
    //  intersects the front clipping plane, and terminating where this
    //  line intersects the back clipping plane.
    const ray = [];
    for (let i = 0; i < 3; i++) {
      ray[i] = model.pickPosition[i] - cameraPos[i];
    }

    const cameraDOP = [];
    for (let i = 0; i < 3; i++) {
      cameraDOP[i] = cameraFP[i] - cameraPos[i];
    }

    vtkMath.normalize(cameraDOP);

    const rayLength = vtkMath.dot(cameraDOP, ray);

    if (rayLength === 0.0) {
      vtkWarningMacro('Picker::Pick Cannot process points');
      return;
    }

    const clipRange = camera.getClippingRange();

    let tF;
    let tB;
    if (camera.getParallelProjection()) {
      tF = clipRange[0] - rayLength;
      tB = clipRange[1] - rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = model.pickPosition[i] + tF * cameraDOP[i];
        p2World[i] = model.pickPosition[i] + tB * cameraDOP[i];
      }
    } else {
      tF = clipRange[0] / rayLength;
      tB = clipRange[1] / rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = cameraPos[i] + tF * ray[i];
        p2World[i] = cameraPos[i] + tB * ray[i];
      }
    }
    p1World[3] = 1.0;
    p2World[3] = 1.0;

    const tolerance =
      computeTolerance(selectionZ, aspect, renderer) * model.tolerance;

    pick3DInternal(model.renderer, tolerance, p1World, p2World);
  };

  publicAPI.pick3DPoint = (selectionPoint, focalPoint, renderer) => {
    if (!renderer) {
      throw new Error('renderer cannot be null');
    }

    initialize();
    model.renderer = renderer;

    vec3.copy(model.selectionPoint, selectionPoint);

    const view = renderer.getRenderWindow().getViews()[0];
    const dims = view.getViewportSize(renderer);

    if (dims[1] === 0) {
      vtkWarningMacro('vtkPicker.pick3DPoint - viewport area is 0');
      return;
    }

    const aspect = dims[0] / dims[1];

    const tolerance =
      computeTolerance(model.selectionPoint[2], aspect, renderer) *
      model.tolerance;

    pick3DInternal(renderer, tolerance, selectionPoint, focalPoint);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tolerance: 0.025,
  mapperPosition: [0.0, 0.0, 0.0],
  mapper: null,
  dataSet: null,
  actors: [],
  pickedPositions: [],
  transformMatrix: null,
  globalTMin: Number.MAX_VALUE,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractPicker.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['tolerance']);
  macro.setGetArray(publicAPI, model, ['mapperPosition'], 3);
  macro.get(publicAPI, model, [
    'mapper',
    'dataSet',
    'actors',
    'pickedPositions',
  ]);
  macro.event(publicAPI, model, 'pickChange');

  vtkPicker(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPicker');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
