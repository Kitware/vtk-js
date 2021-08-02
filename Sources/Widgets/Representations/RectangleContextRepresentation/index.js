import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// vtkRectangleContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkRectangleContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRectangleContextRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });

  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);
  model.actor.getProperty().setOpacity(0.2);
  model.actor.getProperty().setColor(0, 1, 0);

  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.setDrawBorder = (draw) => {
    model.drawBorder = draw;
  };

  // --------------------------------------------------------------------------

  publicAPI.setDrawFace = (draw) => {
    model.drawFace = draw;
  };

  // --------------------------------------------------------------------------

  publicAPI.setOpacity = (opacity) => {
    model.actor.getProperty().setOpacity(opacity);
  };

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const list = publicAPI.getRepresentationStates(inData[0]);
    const state = list[0];

    const dataset = vtkPolyData.newInstance();

    if (state.getVisible() && state.getOrigin()) {
      const point1 = state.getOrigin();
      const point2 = state.getCorner();
      const diagonal = [0, 0, 0];
      vec3.subtract(diagonal, point2, point1);
      const up = state.getUp();
      const upComponent = vec3.dot(diagonal, up);

      const points = new Float32Array(4 * 3);
      points[0] = point1[0];
      points[1] = point1[1];
      points[2] = point1[2];
      points[3] = point1[0] + upComponent * up[0];
      points[4] = point1[1] + upComponent * up[1];
      points[5] = point1[2] + upComponent * up[2];
      points[6] = point2[0];
      points[7] = point2[1];
      points[8] = point2[2];
      points[9] = point2[0] - upComponent * up[0];
      points[10] = point2[1] - upComponent * up[1];
      points[11] = point2[2] - upComponent * up[2];

      dataset.getPoints().setData(points, 3);

      if (model.drawFace) {
        const polys = new Uint32Array([4, 0, 1, 2, 3]);
        dataset.getPolys().setData(polys, 1);
      }
      if (model.drawBorder) {
        const line = new Uint32Array([5, 0, 1, 2, 3, 0]);
        dataset.getLines().setData(line, 1);
      }
    } else {
      dataset.getPoints().setData([], 0);
      dataset.getPolys().setData([], 0);
      dataset.getLines().setData([], 0);
    }

    outData[0] = dataset;
  };

  publicAPI.getSelectedState = (prop, compositeID) => model.state;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  drawBorder: false,
  drawFace: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGetArray(publicAPI, model, ['color'], 1);

  macro.get(publicAPI, model, ['mapper', 'actor']);

  // Object specific methods
  vtkRectangleContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkRectangleContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
