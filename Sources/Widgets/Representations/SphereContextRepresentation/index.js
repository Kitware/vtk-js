import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import vtkContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ContextRepresentation';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import macro from 'vtk.js/Sources/macros';

function vtkSphereContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkSphereContextRepresentation');

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

    for (let i = 0; i < totalCount; i += 1) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      points[i * 3 + 0] = coord[0];
      points[i * 3 + 1] = coord[1];
      points[i * 3 + 2] = coord[2];

      scale[i] =
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

  vtkSphereContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereContextRepresentation'
);

export default { newInstance, extend };
