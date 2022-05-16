import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

// ----------------------------------------------------------------------------
// vtkCubeHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkCubeHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeHandleRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 3,
      empty: true,
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true,
    }),
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkGlyph3DMapper.newInstance({
    scaleArray: 'scale',
    colorByArrayName: 'color',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
  });
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.glyph = vtkCubeSource.newInstance();

  model.mapper.setInputConnection(publicAPI.getOutputPort(), 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);

  publicAPI.addActor(model.actor);

  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );
  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const { points, scale, color } = model.internalArrays;
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount));
      scale.setData(new Float32Array(3 * totalCount));
      color.setData(new Float32Array(totalCount));
    }
    const typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor', 'defaultScale']);

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
