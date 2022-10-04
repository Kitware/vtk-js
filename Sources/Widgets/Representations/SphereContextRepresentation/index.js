import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import macro from 'vtk.js/Sources/macros';

function vtkSphereContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkSphereContextRepresentation');

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

  model.pipelines = {
    circle: {
      source: publicAPI,
      glyph: vtkSphereSource.newInstance({
        phiResolution: model.glyphResolution,
        thetaResolution: model.glyphResolution,
      }),
      mapper: vtkGlyph3DMapper.newInstance({
        scaleArray: 'scale',
        scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      }),
      actor: vtkActor.newInstance({ pickable: false, parentProp: publicAPI }),
    },
  };

  model.pipelines.circle.actor.getProperty().setOpacity(0.2);

  vtkWidgetRepresentation.connectPipeline(model.pipelines.circle);

  publicAPI.addActor(model.pipelines.circle.actor);
  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.pipelines.circle.glyph.setResolution(r)
  );
  publicAPI.setDrawBorder = (draw) => {
    model.pipelines.circle.glyph.setLines(draw);
  };
  publicAPI.setDrawFace = (draw) => {
    model.pipelines.circle.glyph.setFace(draw);
  };
  publicAPI.setOpacity = (opacity) => {
    model.pipelines.circle.actor.getProperty().setOpacity(opacity);
  };
  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );
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

    for (let i = 0; i < totalCount; i += 1) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];

      typedArray.scale[i] =
        scaleFactor *
        (state.getScale1 ? state.getScale1() : model.defaultScale);

      typedArray.color[i] =
        model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
}

const DEFAULT_VALUES = {
  glyphResolution: 32,
  defaultScale: 1,
  drawBorder: false,
  drawFace: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkContextRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['glyphResolution', 'defaultScale']);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);
  vtkSphereContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereContextRepresentation'
);

export default { newInstance, extend };
