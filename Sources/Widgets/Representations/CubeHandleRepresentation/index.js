import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import vtkWidgetRepresentation, {
  getPixelWorldHeightAtCoord,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

// ----------------------------------------------------------------------------
// vtkCubeHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkCubeHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeHandleRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.pipelines = {
    cubes: {
      source: publicAPI,
      glyph: vtkCubeSource.newInstance(),
      mapper: vtkGlyph3DMapper.newInstance({
        scaleArray: 'scale',
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      }),
      actor: vtkActor.newInstance({ parentProp: publicAPI }),
    },
  };
  vtkWidgetRepresentation.connectPipeline(model.pipelines.cubes);
  publicAPI.addActor(model.pipelines.cubes.actor);

  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );
  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    const points = publicAPI
      .allocateArray('points', 'Float32Array', 3, totalCount)
      .getData();
    const color = publicAPI
      .allocateArray('color', ...publicAPI.computeColorType(list), totalCount)
      .getData();
    const scale = publicAPI
      .allocateArray('scale', 'Float32Array', 1, totalCount)
      .getData();

    for (let i = 0; i < totalCount; i++) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      if (coord) {
        points[i * 3 + 0] = coord[0];
        points[i * 3 + 1] = coord[1];
        points[i * 3 + 2] = coord[2];

        scale[i] =
          scaleFactor *
          (state.getScale1 ? state.getScale1() : model.defaultScale);

        if (publicAPI.getScaleInPixels()) {
          scale[i] *= getPixelWorldHeightAtCoord(
            coord,
            model.displayScaleParams
          );
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = { defaultScale: 1 };

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['defaultScale']);

  // Object specific methods
  vtkCubeHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkCubeHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
