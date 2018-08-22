import macro from 'vtk.js/Sources/macro';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/HandleRepresentation';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

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
  model.actor = vtkActor.newInstance();
  model.glyph = vtkSphereSource.newInstance({
    phiResolution: model.glyphResolution,
    thetaResolution: model.glyphResolution,
  });

  model.mapper.setInputConnection(publicAPI.getOutputPort(), 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);

  model.actors.push(model.actor);

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.glyph.setPhiResolution(r) && model.glyph.setThetaResolution(r)
  );

  // --------------------------------------------------------------------------
  // Expose mapper methods
  // --------------------------------------------------------------------------

  publicAPI.setLookupTable = model.mapper.setLookupTable;
  publicAPI.getLookupTable = model.mapper.getLookupTable;

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const rootState = inData[0];
    const { points, scale, color } = model.internalArrays;

    if (points.getNumberOfValues() !== model.sphereStates.length) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * model.sphereStates.length));
      scale.setData(new Float32Array(model.sphereStates.length));
      color.setData(new Float32Array(model.sphereStates.length));
    }
    const pointsTypedArray = points.getData();
    const scaleTypedArray = scale.getData();
    const colorTypedArray = color.getData();

    for (let i = 0; i < model.sphereStates.length; i++) {
      const sphereState = rootState.getReferenceByName(model.sphereStates[i]);
      const isActive = sphereState.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = sphereState.getPosition();
      pointsTypedArray[i * 3 + 0] = coord[0];
      pointsTypedArray[i * 3 + 1] = coord[1];
      pointsTypedArray[i * 3 + 2] = coord[2];

      scaleTypedArray[i] = sphereState.getRadius() * scaleFactor;

      colorTypedArray[i] =
        model.useActiveColor && isActive
          ? model.activeColor
          : sphereState.getColor();
    }
    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  sphereStates: [],
  activeScaleFactor: 1.2,
  activeColor: 1,
  useActiveColor: true,
  glyphResolution: 8,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'sphereStates',
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
  ]);

  // Object specific methods
  vtkSphereHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
