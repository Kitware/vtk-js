import macro from 'vtk.js/Sources/macros';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkResliceCursorPolyDataAlgorithm from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorPolyDataAlgorithm';

// ----------------------------------------------------------------------------
// vtkResliceCursorActor methods
// ----------------------------------------------------------------------------

function vtkResliceCursorActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorActor');

  const superClass = { ...publicAPI };

  publicAPI.getActors = () => {
    if (model.cursorAlgorithm.getResliceCursor()) {
      publicAPI.updateViewProps();
    }
    return [...model.cursorCenterlineActor];
  };

  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.updateViewProps = () => {
    if (!model.cursorAlgorithm.getResliceCursor()) {
      return;
    }
    model.cursorAlgorithm.update();

    const axisNormal = model.cursorAlgorithm.getReslicePlaneNormal();
    const axis1 = model.cursorAlgorithm.getPlaneAxis1();
    const axis2 = model.cursorAlgorithm.getPlaneAxis2();

    model.cursorCenterlineMapper[axis1].setInputData(
      model.cursorAlgorithm.getOutputData(0)
    );
    model.cursorCenterlineMapper[axis2].setInputData(
      model.cursorAlgorithm.getOutputData(1)
    );

    model.cursorCenterlineActor[axis1].setVisibility(model.visibility);
    model.cursorCenterlineActor[axis2].setVisibility(model.visibility);
    model.cursorCenterlineActor[axisNormal].setVisibility(0);
  };

  publicAPI.getBounds = () => {
    vtkMath.uninitializeBounds(model.bounds);
    publicAPI.updateViewProps();

    const boundingBox = [...vtkBoundingBox.INIT_BOUNDS];

    let bounds = [];
    for (let i = 0; i < 3; i++) {
      if (
        model.cursorCenterlineActor[i].getVisibility() &&
        model.cursorCenterlineActor[i].getUseBounds()
      ) {
        bounds = model.cursorCenterlineActor[i].getBounds();
        vtkBoundingBox.addBounds(
          boundingBox,
          bounds[0],
          bounds[1],
          bounds[2],
          bounds[3],
          bounds[4],
          bounds[5]
        );
      }
    }

    model.bounds = boundingBox;

    return model.bounds;
  };

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();

    if (model.cursorAlgorithm) {
      const time = model.cursorAlgorithm.getMTime();

      if (time > mTime) {
        mTime = time;
      }
    }

    return mTime;
  };

  publicAPI.getCenterlineProperty = (i) => model.centerlineProperty[i];
  publicAPI.getCenterlineActor = (i) => model.cursorCenterlineActor[i];

  publicAPI.setUserMatrix = (matrix) => {
    model.cursorCenterlineActor[0].setUserMatrix(matrix);
    model.cursorCenterlineActor[1].setUserMatrix(matrix);
    model.cursorCenterlineActor[2].setUserMatrix(matrix);

    superClass.setUserMatrix(matrix);
  };

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp3D.extend(publicAPI, model, initialValues);

  model.cursorAlgorithm = vtkResliceCursorPolyDataAlgorithm.newInstance();
  model.cursorCenterlineMapper = [];
  model.cursorCenterlineActor = [];
  model.centerlineProperty = [];

  for (let i = 0; i < 3; i++) {
    model.cursorCenterlineMapper[i] = vtkMapper.newInstance();
    model.cursorCenterlineMapper[i].setScalarVisibility(false);
    model.cursorCenterlineMapper[
      i
    ].setResolveCoincidentTopologyToPolygonOffset();
    model.cursorCenterlineMapper[
      i
    ].setResolveCoincidentTopologyLineOffsetParameters(-1.0, -1.0);

    model.cursorCenterlineActor[i] = vtkActor.newInstance({
      parentProp: publicAPI,
    });
    model.cursorCenterlineActor[i].setMapper(model.cursorCenterlineMapper[i]);

    model.centerlineProperty[i] = vtkProperty.newInstance();
    model.cursorCenterlineActor[i].setProperty(model.centerlineProperty[i]);
  }

  model.centerlineProperty[0].setColor(1, 0, 0);
  model.centerlineProperty[1].setColor(0, 1, 0);
  model.centerlineProperty[2].setColor(0, 0, 1);

  macro.get(publicAPI, model, ['cursorAlgorithm']);

  // Object methods
  vtkResliceCursorActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkResliceCursorActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
