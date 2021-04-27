import macro from 'vtk.js/Sources/macro';
// import vtkGenericWidgetRepresentation from 'vtk.js/Sources/Rendering/SceneGraph/GenericWidgetRepresentation';
import vtkWebGPUActor from 'vtk.js/Sources/Rendering/WebGPU/Actor';
// import vtkWebGPUActor2D from 'vtk.js/Sources/Rendering/WebGPU/Actor2D';
import vtkWebGPUCamera from 'vtk.js/Sources/Rendering/WebGPU/Camera';
// import vtkWebGPUGlyph3DMapper from 'vtk.js/Sources/Rendering/WebGPU/Glyph3DMapper';
// import vtkWebGPUImageMapper from 'vtk.js/Sources/Rendering/WebGPU/ImageMapper';
// import vtkWebGPUImageSlice from 'vtk.js/Sources/Rendering/WebGPU/ImageSlice';
import vtkWebGPUPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/WebGPU/PixelSpaceCallbackMapper';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPURenderer from 'vtk.js/Sources/Rendering/WebGPU/Renderer';
// import vtkWebGPUSkybox from 'vtk.js/Sources/Rendering/WebGPU/Skybox';
import vtkWebGPUSphereMapper from 'vtk.js/Sources/Rendering/WebGPU/SphereMapper';
import vtkWebGPUStickMapper from 'vtk.js/Sources/Rendering/WebGPU/StickMapper';
import vtkWebGPUVolume from 'vtk.js/Sources/Rendering/WebGPU/Volume';
import vtkWebGPUVolumeMapper from 'vtk.js/Sources/Rendering/WebGPU/VolumeMapper';
import vtkViewNodeFactory from 'vtk.js/Sources/Rendering/SceneGraph/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkWebGPUViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUViewNodeFactory');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNodeFactory.extend(publicAPI, model, initialValues);

  // Object methods
  vtkWebGPUViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkActor', vtkWebGPUActor.newInstance);
  // publicAPI.registerOverride('vtkActor2D', vtkWebGPUActor2D.newInstance);
  publicAPI.registerOverride('vtkCamera', vtkWebGPUCamera.newInstance);
  // publicAPI.registerOverride(
  //   'vtkGlyph3DMapper',
  //   vtkWebGPUGlyph3DMapper.newInstance
  // );
  // publicAPI.registerOverride(
  //   'vtkImageMapper',
  //   vtkWebGPUImageMapper.newInstance
  // );
  // publicAPI.registerOverride('vtkImageSlice', vtkWebGPUImageSlice.newInstance);
  publicAPI.registerOverride('vtkMapper', vtkWebGPUPolyDataMapper.newInstance);
  publicAPI.registerOverride(
    'vtkPixelSpaceCallbackMapper',
    vtkWebGPUPixelSpaceCallbackMapper.newInstance
  );
  publicAPI.registerOverride('vtkRenderer', vtkWebGPURenderer.newInstance);
  // publicAPI.registerOverride('vtkSkybox', vtkWebGPUSkybox.newInstance);
  publicAPI.registerOverride(
    'vtkSphereMapper',
    vtkWebGPUSphereMapper.newInstance
  );
  publicAPI.registerOverride(
    'vtkStickMapper',
    vtkWebGPUStickMapper.newInstance
  );
  publicAPI.registerOverride('vtkVolume', vtkWebGPUVolume.newInstance);
  publicAPI.registerOverride(
    'vtkVolumeMapper',
    vtkWebGPUVolumeMapper.newInstance
  );
  // publicAPI.registerOverride(
  //   'vtkWidgetRepresentation',
  //   vtkGenericWidgetRepresentation.newInstance
  // );
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUViewNodeFactory'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
