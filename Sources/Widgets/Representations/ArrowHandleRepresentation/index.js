import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrow2DSource from 'vtk.js/Sources/Filters/Sources/Arrow2DSource/';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkViewFinderSource from 'vtk.js/Sources/Filters/Sources/ViewFinderSource';

import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import { vec3, mat3, mat4 } from 'gl-matrix';

import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

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

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 1,
      empty: true,
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true,
    }),
    direction: vtkDataArray.newInstance({
      name: 'direction',
      numberOfComponents: 9,
      empty: true,
    }),
  };

  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.internalPolyData
    .getPointData()
    .addArray(model.internalArrays.direction);

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

  model.mapper = vtkGlyph3DMapper.newInstance({
    orientationArray: 'direction',
    scaleArray: 'scale',
    colorByArrayName: 'color',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
  });
  model.mapper.setOrientationModeToMatrix();
  model.mapper.setInputConnection(publicAPI.getOutputPort());

  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.actor.setMapper(model.mapper);
  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.glyph.setPhiResolution(r) && model.glyph.setThetaResolution(r)
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

  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );

  publicAPI.requestDataInternal = (inData, outData) => {
    const { points, scale, color, direction } = model.internalArrays;
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount), 3);
      scale.setData(new Float32Array(totalCount));
      color.setData(new Float32Array(totalCount));
      direction.setData(new Float32Array(9 * totalCount));
    }

    const typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
      direction: direction.getData(),
    };

    for (let i = 0; i < totalCount; i++) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      if (coord) {
        typedArray.points[i * 3 + 0] = coord[0];
        typedArray.points[i * 3 + 1] = coord[1];
        typedArray.points[i * 3 + 2] = coord[2];

        let scale3 = state.getScale3 ? state.getScale3() : [1, 1, 1];
        scale3 = scale3.map((x) => (x === 0 ? 2 * model.defaultScale : 2 * x));

        const rotation = getGlyphRotation(scale3);

        typedArray.direction.set(rotation, 9 * i);
        typedArray.scale[i] =
          scaleFactor *
          (state.getScale1 ? state.getScale1() : model.defaultScale);

        if (publicAPI.getScaleInPixels()) {
          typedArray.scale[i] *= publicAPI.getPixelWorldHeightAtCoord(coord);
        }

        typedArray.color[i] =
          model.useActiveColor && isActive
            ? model.activeColor
            : state.getColor();
      }
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  publicAPI.requestData = (inData, outData) => {
    const shape = publicAPI.getRepresentationStates(inData[0])[0]?.getShape();
    let shouldCreateGlyph = model.glyph == null;
    if (model.shape !== shape && Object.values(ShapeType).includes(shape)) {
      model.shape = shape;
      shouldCreateGlyph = true;
    }
    if (shouldCreateGlyph && model.shape) {
      model.glyph = createGlyph(model.shape);
      model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
    }
    publicAPI.requestDataInternal(inData, outData);
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
    defaultScale: 1,
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

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);
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
