import macro from 'vtk.js/Sources/macro';
import vtkAbstractPicker from 'vtk.js/Sources/Rendering/Core/AbstractPicker';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { mat4, vec4 } from 'gl-matrix';

const { vtkErrorMacro } = macro;
const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPicker methods
// ----------------------------------------------------------------------------

function vtkPicker(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPicker');

  const superClass = Object.assign({}, publicAPI);

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

  // Intersect data with specified ray.
  // Project the center point of the mapper onto the ray and determine its parametric value
  publicAPI.intersectWithLine = (p1, p2, tol, mapper) => {
    if (!mapper) {
      return Number.MAX_VALUE;
    }

    const center = [];
    mapper.getCenter(center);

    const ray = [];
    for (let i = 0; i < 3; i++) {
      ray[i] = p2[i] - p1[i];
    }

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

  // To be overriden in subclasses
  publicAPI.pick = (selection, renderer) => {
    if (selection.length !== 3) {
      vtkWarningMacro('vtkPicker::pick: selectionPt needs three components');
    }
    const selectionX = selection[0];
    const selectionY = selection[1];
    let selectionZ = selection[2];
    let cameraPos = [];
    let cameraFP = [];
    let displayCoords = [];
    let worldCoords = [];
    const ray = [];
    const cameraDOP = [];
    let clipRange = [];
    let tF;
    let tB;
    const p1World = [];
    const p2World = [];
    let viewport = [];
    let winSize = [];
    let x;
    let y;
    let windowLowerLeft = [];
    let windowUpperRight = [];
    let tol = 0.0;
    let props = [];
    let pickable = false;
    const p1Mapper = vec4.create();
    const p2Mapper = vec4.create();
    let bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    const t = [];
    const hitPosition = [];
    const view = renderer.getRenderWindow().getViews()[0];

    initialize();
    model.renderer = renderer;
    model.selectionPoint[0] = selectionX;
    model.selectionPoint[1] = selectionY;
    model.selectionPoint[2] = selectionZ;

    if (!renderer) {
      vtkErrorMacro('Picker::Pick Must specify renderer');
      return;
    }

    // Get camera focal point and position. Convert to display (screen)
    // coordinates. We need a depth value for z-buffer.
    const camera = renderer.getActiveCamera();
    cameraPos = camera.getPosition();
    cameraFP = camera.getFocalPoint();

    displayCoords = renderer.worldToNormalizedDisplay(
      cameraFP[0],
      cameraFP[1],
      cameraFP[2]
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
    const dims = view.getViewportSize(renderer);
    const aspect = dims[0] / dims[1];
    worldCoords = renderer.normalizedDisplayToWorld(
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
    for (let i = 0; i < 3; i++) {
      ray[i] = model.pickPosition[i] - cameraPos[i];
    }
    for (let i = 0; i < 3; i++) {
      cameraDOP[i] = cameraFP[i] - cameraPos[i];
    }

    vtkMath.normalize(cameraDOP);

    const rayLength = vtkMath.dot(cameraDOP, ray);
    if (rayLength === 0.0) {
      vtkWarningMacro('Picker::Pick Cannot process points');
      return;
    }

    clipRange = camera.getClippingRange();

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

    // Compute the tolerance in world coordinates.  Do this by
    // determining the world coordinates of the diagonal points of the
    // window, computing the width of the window in world coordinates, and
    // multiplying by the tolerance.
    viewport = renderer.getViewport();
    if (renderer.getRenderWindow()) {
      winSize = renderer
        .getRenderWindow()
        .getViews()[0]
        .getSize();
    }
    x = winSize[0] * viewport[0];
    y = winSize[1] * viewport[1];
    const normalizedLeftDisplay = view.displayToNormalizedDisplay(
      x,
      y,
      selectionZ
    );
    windowLowerLeft = renderer.normalizedDisplayToWorld(
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
    windowUpperRight = renderer.normalizedDisplayToWorld(
      normalizedRightDisplay[0],
      normalizedRightDisplay[1],
      normalizedRightDisplay[2],
      aspect
    );

    for (let i = 0; i < 3; i++) {
      tol +=
        (windowUpperRight[i] - windowLowerLeft[i]) *
        (windowUpperRight[i] - windowLowerLeft[i]);
    }

    tol = Math.sqrt(tol) * model.tolerance;
    if (model.pickFromList) {
      props = model.pickList;
    } else {
      props = renderer.getActors();
    }
    const scale = [];
    props.forEach((prop) => {
      const mapper = prop.getMapper();
      pickable = prop.getPickable() && prop.getVisibility();
      if (prop.getProperty().getOpacity() <= 0.0) {
        pickable = false;
      }

      if (pickable) {
        model.transformMatrix = prop.getMatrix().slice(0);
        // Webgl need a transpose matrix but we need the untransposed one to project world points
        // into the right referential
        mat4.transpose(model.transformMatrix, model.transformMatrix);
        mat4.invert(model.transformMatrix, model.transformMatrix);
        // Extract scale
        const col1 = [
          model.transformMatrix[0],
          model.transformMatrix[1],
          model.transformMatrix[2],
        ];
        const col2 = [
          model.transformMatrix[4],
          model.transformMatrix[5],
          model.transformMatrix[6],
        ];
        const col3 = [
          model.transformMatrix[8],
          model.transformMatrix[9],
          model.transformMatrix[10],
        ];
        scale[0] = vtkMath.norm(col1);
        scale[1] = vtkMath.norm(col2);
        scale[2] = vtkMath.norm(col3);

        vec4.transformMat4(p1Mapper, p1World, model.transformMatrix);
        vec4.transformMat4(p2Mapper, p2World, model.transformMatrix);

        p1Mapper[0] /= p1Mapper[3];
        p1Mapper[1] /= p1Mapper[3];
        p1Mapper[2] /= p1Mapper[3];

        p2Mapper[0] /= p2Mapper[3];
        p2Mapper[1] /= p2Mapper[3];
        p2Mapper[2] /= p2Mapper[3];

        for (let i = 0; i < 3; i++) {
          ray[i] = p2Mapper[i] - p1Mapper[i];
        }

        if (mapper) {
          bounds = mapper.getBounds();
        }

        if (vtkBox.intersectBox(bounds, p1Mapper, ray, hitPosition, t)) {
          t[0] = publicAPI.intersectWithLine(
            p1Mapper,
            p2Mapper,
            tol * 0.333 * (scale[0] + scale[1] + scale[2]),
            mapper
          );
          if (t[0] < Number.MAX_VALUE) {
            const p = [];
            p[0] = (1.0 - t[0]) * p1World[0] + t[0] * p2World[0];
            p[1] = (1.0 - t[0]) * p1World[1] + t[0] * p2World[1];
            p[2] = (1.0 - t[0]) * p1World[2] + t[0] * p2World[2];

            // Check if the current actor is already in the list
            let actorID = -1;
            for (let i = 0; i < model.actors.length; i++) {
              if (model.actors[i] === prop) {
                actorID = i;
                break;
              }
            }
            if (actorID === -1) {
              model.actors.push(prop);
              model.pickedPositions.push(p);
            } else {
              const oldPoint = model.pickedPositions[actorID];
              const distOld = vtkMath.distance2BetweenPoints(p1World, oldPoint);
              const distCurrent = vtkMath.distance2BetweenPoints(p1World, p);
              if (distCurrent < distOld) {
                model.pickedPositions[actorID] = p;
              }
            }
          }
        }
      }
      publicAPI.invokePickChange(model.pickedPositions);
      return 1;
    });
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
