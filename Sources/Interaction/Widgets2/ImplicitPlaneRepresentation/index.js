import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets2/WidgetRepresentation';

import { RenderingTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';
import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import {
  Interpolation,
  Representation,
} from 'vtk.js/Sources/Rendering/Core/Property/Constants';

// ----------------------------------------------------------------------------
// Helper methods to build state
// ----------------------------------------------------------------------------

function allocatePointsInPolydata(polydata, numberOfPoints) {
  polydata.getPoints().setData(new Float32Array(numberOfPoints * 3), 3);
}

function allocateGlyphArrays(polydata) {
  const scale = vtkDataArray.newInstance({
    name: 'scale',
    numberOfComponents: 1,
    values: new Float32Array(1),
  });
  const color = vtkDataArray.newInstance({
    name: 'color',
    numberOfComponents: 1,
    values: new Float32Array(1),
  });
  polydata.getPointData().addArray(scale);
  polydata.getPointData().addArray(color);
  return {
    scale,
    color,
  };
}

function connectPipeline(pipeline) {
  if (pipeline.source.isA('vtkDataSet')) {
    pipeline.mapper.setInputData(pipeline.source);
  } else {
    pipeline.mapper.setInputConnection(pipeline.source.getOutputPort());
  }
  if (pipeline.glyph) {
    pipeline.mapper.setInputConnection(pipeline.glyph.getOutputPort(), 1);
  }
  pipeline.actor.setMapper(pipeline.mapper);
}

// ----------------------------------------------------------------------------
// Static methods to build state
// ----------------------------------------------------------------------------

function generateState() {
  return vtkStateBuilder
    .createBuilder()
    .addField({ name: 'origin', initialValue: [0, 0, 0] })
    .addField({ name: 'normal', initialValue: [0, 0, 1] })
    .addField({
      name: 'bounds',
      initialValue: [-0.5, 0.5, -0.5, 0.5, -0.5, 0.5],
    })
    .addField({ name: 'activeHandle', initialValue: null })
    .addField({
      name: 'updateMethodName',
    })
    .build();
}

// ----------------------------------------------------------------------------
// vtkImplicitPlaneRepresentation methods
// ----------------------------------------------------------------------------

function vtkImplicitPlaneRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImplicitPlaneRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.plane = vtkPlane.newInstance();
  model.matrix = vtkMatrixBuilder.buildFromDegree();

  model.outlinePipeline = {
    source: vtkCubeSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };

  model.planePipeline = {
    source: vtkClosedPolyLineToSurfaceFilter.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };

  model.pointsPipeline = {
    source: publicAPI,
    glyph: vtkSphereSource.newInstance(),
    mapper: vtkGlyph3DMapper.newInstance({
      scaleArray: 'scale',
      colorByArrayName: 'color',
      scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
    }),
    actor: vtkActor.newInstance(),
  };

  model.normalPipeline = {
    source: vtkCylinderSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };

  model.screen2DPipeline = {
    source: publicAPI,
    mapper: vtkPixelSpaceCallbackMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };

  const glyphPolyData = vtkPolyData.newInstance({ mtime: 0 });
  allocatePointsInPolydata(glyphPolyData, 1);
  const { color, scale } = allocateGlyphArrays(glyphPolyData);

  // Plane generation pipeline
  const cutter = vtkCutter.newInstance({ cutFunction: model.plane });
  cutter.setInputConnection(model.outlinePipeline.source.getOutputPort());
  model.planePipeline.source.setInputConnection(cutter.getOutputPort());

  connectPipeline(model.outlinePipeline);
  connectPipeline(model.planePipeline);
  connectPipeline(model.pointsPipeline);
  connectPipeline(model.normalPipeline);
  connectPipeline(model.screen2DPipeline);

  model.actors.push(model.outlinePipeline.actor);
  model.actors.push(model.planePipeline.actor);
  model.actors.push(model.pointsPipeline.actor);
  model.actors.push(model.normalPipeline.actor);
  model.actors.push(model.screen2DPipeline.actor);

  model.outlinePipeline.actor
    .getProperty()
    .setRepresentation(Representation.WIREFRAME);
  model.outlinePipeline.actor
    .getProperty()
    .setInterpolation(Interpolation.FLAT);

  // fixme
  model.normalPipeline.actor.getProperty().setInterpolation(Interpolation.FLAT);

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];
    const origin = state.getOrigin();
    const normal = state.getNormal();
    const bounds = state.getBounds();
    model.plane.setOrigin(origin);
    model.plane.setNormal(normal);

    // Update cube parameters
    model.outlinePipeline.source.setCenter(
      (bounds[0] + bounds[1]) * 0.5,
      (bounds[2] + bounds[3]) * 0.5,
      (bounds[4] + bounds[5]) * 0.5
    );
    const xRange = bounds[1] - bounds[0];
    const yRange = bounds[3] - bounds[2];
    const zRange = bounds[5] - bounds[4];
    model.outlinePipeline.source.setXLength(xRange);
    model.outlinePipeline.source.setYLength(yRange);
    model.outlinePipeline.source.setZLength(zRange);

    // Update normal parameters
    model.normalPipeline.source.set({
      height: Math.max(xRange, yRange, zRange),
      radius: model.handleSizeRatio * Math.min(xRange, yRange, zRange) * 0.25,
      resolution: 12,
    });

    // ------------------------------------------------------
    // Option 1 (not fully working but better)
    // ------------------------------------------------------
    // model.normalPipeline.actor.setUserMatrix(
    //   model.matrix
    //     .identity()
    //     .rotateFromDirections(normal, [0, -1, 0])
    //     .getVTKMatrix()
    // );
    // model.normalPipeline.actor.setPosition(origin[0], -origin[2], origin[1]);
    // ------------------------------------------------------

    // ------------------------------------------------------
    // Option 2
    // ------------------------------------------------------
    const originalDS = model.normalPipeline.source.getOutputData();
    const originalCoords = originalDS.getPoints().getData();
    const originalNormals = originalDS
      .getPointData()
      .getNormals()
      .getData();
    const newAxis = vtkPolyData.newInstance();
    newAxis.shallowCopy(model.normalPipeline.source.getOutputData());
    newAxis.setPoints(
      vtkPoints.newInstance({
        numberOfComponents: 3,
        values: Float32Array.from(originalCoords),
      })
    );
    newAxis.getPointData().setNormals(
      vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: Float32Array.from(originalNormals),
      })
    );
    model.matrix
      // .identity()
      // .rotateFromDirections([0, 1, 0], normal)
      // .apply(
      //   newAxis
      //     .getPointData()
      //     .getNormals()
      //     .getData()
      // )
      .identity()
      .translate(origin[0], origin[1], origin[2])
      .rotateFromDirections([0, 1, 0], normal)
      .apply(newAxis.getPoints().getData());
    model.normalPipeline.mapper.setInputData(newAxis);
    // ------------------------------------------------------

    const originCoord = glyphPolyData.getPoints().getData();
    originCoord[0] = origin[0];
    originCoord[1] = origin[1];
    originCoord[2] = origin[2];
    scale.getData()[0] =
      model.handleSizeRatio * Math.min(xRange, yRange, zRange);
    color.getData()[0] =
      state.getActive() &&
      state.getActiveHandle() === model.pointsPipeline.actor
        ? model.activeHandleColor
        : model.handleColor;
    scale.modified();
    color.modified();
    glyphPolyData.modified();

    outData[0] = glyphPolyData; // glyphPolyData;
    outData[1] = state;

    // Handle active state
    model.planePipeline.actor
      .getProperty()
      .setColor(
        ...(state.getActive() &&
        state.getActiveHandle() === model.planePipeline.actor
          ? model.activePlaneColor
          : model.planeColor)
      );

    model.normalPipeline.actor
      .getProperty()
      .setColor(
        ...(state.getActive() &&
        state.getActiveHandle() === model.normalPipeline.actor
          ? model.activePlaneColor
          : model.planeColor)
      );
  };

  // --------------------------------------------------------------------------
  // Set/Get Forwarding
  // --------------------------------------------------------------------------

  publicAPI.setSphereResolution = (res) => {
    model.sphereResolution = res;
    return (
      model.pointsPipeline.glyph.setPhiResolution(res) &&
      model.pointsPipeline.glyph.setThetaResolution(res)
    );
  };

  publicAPI.setPlaneOpacity = (opacity) => {
    model.planeOpacity = opacity;
    return model.planePipeline.actor.getProperty().setOpacity(opacity);
  };

  // --------------------------------------------------------------------------
  // WidgetRepresentation API
  // --------------------------------------------------------------------------

  publicAPI.updateActorVisibility = (
    renderingType,
    widgetVisible,
    ctxVisible,
    handleVisible
  ) => {
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      model.outlinePipeline.actor.setVisibility(false);
      model.planePipeline.actor.setVisibility(widgetVisible);
      model.pointsPipeline.actor.setVisibility(widgetVisible);
      model.planePipeline.actor.getProperty().setOpacity(1);
      model.normalPipeline.actor.setVisibility(widgetVisible);
    } else {
      model.outlinePipeline.actor.setVisibility(widgetVisible && ctxVisible);
      model.planePipeline.actor.setVisibility(widgetVisible && handleVisible);
      model.pointsPipeline.actor.setVisibility(widgetVisible && handleVisible);
      model.planePipeline.actor.getProperty().setOpacity(model.planeOpacity);
      model.normalPipeline.actor.setVisibility(widgetVisible && handleVisible);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.getSelectedState = (prop, compositeID) => {
    // We only have on state to control us
    // we may want to update some field on the state to highlight the
    // selected handle later on...
    const state = model.inputData[0];
    state.setActiveHandle(prop);

    switch (prop) {
      case model.planePipeline.actor:
        state.setUpdateMethodName('updateFromPlane');
        break;
      case model.pointsPipeline.actor:
        state.setUpdateMethodName('updateFromOrigin');
        break;
      case model.normalPipeline.actor:
        state.setUpdateMethodName('updateFromNormal');
        break;
      default:
        state.setUpdateMethodName('updateFromPlane');
        break;
    }

    return state;
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  publicAPI.setPlaneOpacity(model.planeOpacity);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handleSizeRatio: 0.05,
  sphereResolution: 8,
  planeOpacity: 0.2,
  planeColor: [1, 1, 1],
  activePlaneColor: [0, 1, 0],
  handleColor: 0,
  activeHandleColor: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['sphereResolution', 'planeOpacity']);
  macro.setGetArray(publicAPI, model, ['planeColor', 'activePlaneColor'], 3);
  macro.setGet(publicAPI, model, [
    'handleColor',
    'activeHandleColor',
    'handleSizeRatio',
  ]);

  // Object specific methods
  vtkImplicitPlaneRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImplicitPlaneRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, generateState };
