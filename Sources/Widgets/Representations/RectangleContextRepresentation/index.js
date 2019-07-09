import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

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
  model.actor = vtkActor.newInstance();

  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);
  model.actor.getProperty().setOpacity(0.2);
  model.actor.getProperty().setColor(0, 1, 0);

  model.actors.push(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const list = publicAPI.getRepresentationStates(inData[0]);
    const state = list[0];

    const dataset = vtkPolyData.newInstance();

    if (state.getVisible()) {
      const bounds = state.getBounds();
      const point1 = [bounds[0], bounds[2], bounds[4]];
      const point2 = [bounds[1], bounds[3], bounds[5]];

      const points = new Float32Array(4 * 3);

      points[0] = point1[0];
      points[1] = point1[1];
      points[2] = point1[2];

      points[6] = point2[0];
      points[7] = point2[1];
      points[8] = point2[2];

      const slicingMode = state.getDirection().indexOf(1);

      if (slicingMode === SlicingMode.I) {
        points[3] = point1[0];
        points[4] = point1[1];
        points[5] = point2[2];

        points[9] = point2[0];
        points[10] = point2[1];
        points[11] = point1[2];
      } else if (slicingMode === SlicingMode.J) {
        points[3] = point1[0];
        points[4] = point1[1];
        points[5] = point2[2];

        points[9] = point2[0];
        points[10] = point2[1];
        points[11] = point1[2];
      } else if (slicingMode === SlicingMode.K) {
        points[3] = point1[0];
        points[4] = point2[1];
        points[5] = point1[2];

        points[9] = point2[0];
        points[10] = point1[1];
        points[11] = point2[2];
      }

      // Triangles
      const polys = new Uint32Array([4, 0, 1, 2, 3]);

      dataset.getPoints().setData(points, 3);
      dataset.getPolys().setData(polys, 1);
    } else {
      dataset.getPoints().setData([], 0);
      dataset.getPolys().setData([], 0);
    }

    outData[0] = dataset;
  };

  publicAPI.getSelectedState = (prop, compositeID) => model.state;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
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
