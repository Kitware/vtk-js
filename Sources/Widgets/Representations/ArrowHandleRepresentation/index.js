import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrow2DSource from 'vtk.js/Sources/Filters/Sources/Arrow2DSource/';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkViewFinderSource from 'vtk.js/Sources/Filters/Sources/ViewFinderSource';

import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import { vec3, mat3, mat4 } from 'gl-matrix';
import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import { OrientationModes } from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper/Constants';
import { allocateArray } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

const { ShapeType, Shapes2D, ShapesOrientable } = Constants;

// ----------------------------------------------------------------------------
// vtkArrowHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkArrowHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArrowHandleRepresentation');

  const superClass = { ...publicAPI };
  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  /**
   * Set the shape for the glyph according to lineWidget state inputs
   */
  function createGlyph(shape) {
    const representationToSource = {
      [ShapeType.STAR]: {
        builder: vtkArrow2DSource,
        initialValues: { shape: 'star', height: 0.6 },
      },
      [ShapeType.ARROWHEAD3]: {
        builder: vtkArrow2DSource,
        initialValues: { shape: 'triangle' },
      },
      [ShapeType.ARROWHEAD4]: {
        builder: vtkArrow2DSource,
        initialValues: { shape: 'arrow4points' },
      },
      [ShapeType.ARROWHEAD6]: {
        builder: vtkArrow2DSource,
        initialValues: { shape: 'arrow6points' },
      },
      [ShapeType.CONE]: {
        builder: vtkConeSource,
        initialValues: {
          direction: [0, 1, 0],
        },
      },
      [ShapeType.SPHERE]: {
        builder: vtkSphereSource,
      },
      [ShapeType.CUBE]: {
        builder: vtkCubeSource,
        initialValues: { xLength: 0.8, yLength: 0.8, zLength: 0.8 },
      },
      [ShapeType.DISK]: {
        builder: vtkCircleSource,
        initialValues: {
          resolution: 30,
          radius: 0.5,
          direction: [0, 0, 1],
          lines: false,
          face: true,
        },
      },
      [ShapeType.CIRCLE]: {
        builder: vtkCircleSource,
        initialValues: {
          resolution: 30,
          radius: 0.5,
          direction: [0, 0, 1],
          lines: true,
          face: false,
        },
      },
      [ShapeType.VIEWFINDER]: {
        builder: vtkViewFinderSource,
        initialValues: { radius: 0.1, spacing: 0.3, width: 1.4 },
      },
      [ShapeType.NONE]: {
        builder: vtkSphereSource,
      },
    };
    const rep = representationToSource[shape];
    return rep.builder.newInstance(rep.initialValues);
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  // displayActors and displayMappers are used to render objects in HTML,
  // allowing objects to be 'rendered' internally in a VTK scene without
  // being visible on the final output.
  model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.displayActor = vtkActor.newInstance({ parentProp: publicAPI });
  // model.displayActor.getProperty().setOpacity(0); // don't show in 3D
  model.displayActor.setMapper(model.displayMapper);
  model.displayMapper.setInputConnection(publicAPI.getOutputPort());
  publicAPI.addActor(model.displayActor);

  model.alwaysVisibleActors = [model.displayActor];

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model._pipeline.glyph.setPhiResolution(r),
    (r) => model._pipeline.glyph.setThetaResolution(r)
  );

  // --------------------------------------------------------------------------

  function callbackProxy(coords) {
    if (model.displayCallback) {
      const filteredList = [];
      const states = publicAPI.getRepresentationStates();
      for (let i = 0; i < states.length; i++) {
        if (states[i].getActive()) {
          filteredList.push(coords[i]);
        }
      }
      if (filteredList.length) {
        model.displayCallback(filteredList);
        return;
      }
    }
    model.displayCallback();
  }

  publicAPI.setDisplayCallback = (callback) => {
    model.displayCallback = callback;
    model.displayMapper.setCallback(callback ? callbackProxy : null);
  };

  // --------------------------------------------------------------------------

  publicAPI.is2DShape = () => Shapes2D.includes(model.shape);
  publicAPI.isOrientableShape = () => ShapesOrientable.includes(model.shape);

  /**
   * Returns the orientation matrix to align glyph on model.orientation.
   * */
  function getOrientationRotation(viewMatrixInv) {
    const displayOrientation = new Float64Array(3);
    const baseDir = [0, 1, 0];

    vec3.transformMat3(displayOrientation, model.orientation, viewMatrixInv);
    displayOrientation[2] = 0;

    const displayMatrix = vtkMatrixBuilder
      .buildFromDegree()
      .rotateFromDirections(baseDir, displayOrientation)
      .getMatrix();
    const displayRotation = new Float64Array(9);
    mat3.fromMat4(displayRotation, displayMatrix);
    return displayRotation;
  }

  function getCameraFacingRotation(scale3, displayRotation, viewMatrix) {
    const rotation = new Float64Array(9);
    mat3.multiply(rotation, viewMatrix, displayRotation);
    vec3.transformMat3(scale3, scale3, rotation);
    return rotation;
  }

  /**
   * Computes the rotation matrix of the glyph. There are 2 rotations:
   *  - a first rotation to be oriented along model.rotation
   *  - an optional second rotation to face the camera
   * @param {vec3} scale3 Scale of the glyph, rotated when glyph is rotated.
   */
  function getGlyphRotation(scale3) {
    const shouldFaceCamera =
      model.faceCamera === true ||
      (model.faceCamera == null && publicAPI.is2DShape());

    const viewMatrix = new Float64Array(9);
    mat3.fromMat4(viewMatrix, model.viewMatrix);
    const viewMatrixInv = mat3.identity(new Float64Array(9));
    if (shouldFaceCamera) {
      mat3.invert(viewMatrixInv, viewMatrix);
    }

    let orientationRotation = null;
    if (publicAPI.isOrientableShape()) {
      orientationRotation = getOrientationRotation(viewMatrixInv);
    } else {
      orientationRotation = mat3.identity(new Float64Array(9));
    }
    if (shouldFaceCamera) {
      orientationRotation = getCameraFacingRotation(
        scale3,
        orientationRotation,
        viewMatrix
      );
    }
    return orientationRotation;
  }

  function applyOrientation(polyData, states) {
    model._pipeline.mapper.setOrientationArray('orientation');
    model._pipeline.mapper.setOrientationMode(OrientationModes.MATRIX);
    const orientation = allocateArray(
      polyData,
      'orientation',
      states.length,
      'Float32Array',
      9
    ).getData();
    const defaultScale3 = [1, 1, 1];
    for (let i = 0; i < states.length; ++i) {
      const scale3 = states[i].getScale3?.() ?? defaultScale3;
      const rotation = getGlyphRotation(scale3);
      orientation.set(rotation, 9 * i);
    }
  }
  publicAPI.setDirection(applyOrientation);
  publicAPI.setNoOrientation(applyOrientation);

  publicAPI.requestData = (inData, outData) => {
    // FIXME: shape should NOT be mixin, but a representation property.
    const shape = publicAPI.getRepresentationStates(inData[0])[0]?.getShape();
    let shouldCreateGlyph = model._pipeline.glyph == null;
    if (model.shape !== shape && Object.values(ShapeType).includes(shape)) {
      model.shape = shape;
      shouldCreateGlyph = true;
    }
    if (shouldCreateGlyph && model.shape) {
      model._pipeline.glyph = createGlyph(model.shape);
      model._pipeline.mapper.setInputConnection(
        model._pipeline.glyph.getOutputPort(),
        1
      );
    }
    return superClass.requestData(inData, outData);
  };

  publicAPI.updateActorVisibility = (
    renderingType = RenderingTypes.FRONT_BUFFER,
    ctxVisible = true,
    handleVisible = true
  ) => {
    const hasValidState = publicAPI.getRepresentationStates().length > 0;
    superClass.updateActorVisibility(
      renderingType,
      ctxVisible,
      handleVisible && hasValidState
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

/**
 *  'shape' default value is used first time 'shape' mixin is invalid.
 *  'faceCamera' controls wether the glyph should face camera or not:
 *    - null or undefined to leave it to shape type (i.e. 2D are facing camera,
 *    3D are not)
 *    - true to face camera
 *    - false to not face camera
 */
function defaultValues(initialValues) {
  return {
    faceCamera: null,
    orientation: [1, 0, 0],
    shape: ShapeType.SPHERE,
    viewMatrix: mat4.identity(new Float64Array(16)),
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  vtkGlyphRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['visibilityFlagArray'], 2);
  macro.setGetArray(publicAPI, model, ['orientation'], 3);
  macro.setGetArray(publicAPI, model, ['viewMatrix'], 16);
  macro.setGet(publicAPI, model, ['faceCamera']);
  // Object specific methods
  vtkArrowHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkArrowHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
