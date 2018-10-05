import macro from 'vtk.js/Sources/macro';
import vtkGenericWidgetRepresentation from 'vtk.js/Sources/Rendering/SceneGraph/GenericWidgetRepresentation';
import vtkOpenGLActor from 'vtk.js/Sources/Rendering/OpenGL/Actor';
import vtkOpenGLActor2D from 'vtk.js/Sources/Rendering/OpenGL/Actor2D';
import vtkOpenGLCamera from 'vtk.js/Sources/Rendering/OpenGL/Camera';
import vtkOpenGLGlyph3DMapper from 'vtk.js/Sources/Rendering/OpenGL/Glyph3DMapper';
import vtkOpenGLImageMapper from 'vtk.js/Sources/Rendering/OpenGL/ImageMapper';
import vtkOpenGLImageSlice from 'vtk.js/Sources/Rendering/OpenGL/ImageSlice';
import vtkOpenGLPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/OpenGL/PixelSpaceCallbackMapper';
import vtkOpenGLPolyDataMapper from 'vtk.js/Sources/Rendering/OpenGL/PolyDataMapper';
import vtkOpenGLRenderer from 'vtk.js/Sources/Rendering/OpenGL/Renderer';
import vtkOpenGLSkybox from 'vtk.js/Sources/Rendering/OpenGL/Skybox';
import vtkOpenGLSphereMapper from 'vtk.js/Sources/Rendering/OpenGL/SphereMapper';
import vtkOpenGLStickMapper from 'vtk.js/Sources/Rendering/OpenGL/StickMapper';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkOpenGLVolume from 'vtk.js/Sources/Rendering/OpenGL/Volume';
import vtkOpenGLVolumeMapper from 'vtk.js/Sources/Rendering/OpenGL/VolumeMapper';
import vtkViewNodeFactory from 'vtk.js/Sources/Rendering/SceneGraph/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkOpenGLViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLViewNodeFactory');
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
  vtkOpenGLViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkActor', vtkOpenGLActor.newInstance);
  publicAPI.registerOverride('vtkActor2D', vtkOpenGLActor2D.newInstance);
  publicAPI.registerOverride('vtkCamera', vtkOpenGLCamera.newInstance);
  publicAPI.registerOverride(
    'vtkGlyph3DMapper',
    vtkOpenGLGlyph3DMapper.newInstance
  );
  publicAPI.registerOverride(
    'vtkImageMapper',
    vtkOpenGLImageMapper.newInstance
  );
  publicAPI.registerOverride('vtkImageSlice', vtkOpenGLImageSlice.newInstance);
  publicAPI.registerOverride('vtkMapper', vtkOpenGLPolyDataMapper.newInstance);
  publicAPI.registerOverride(
    'vtkPixelSpaceCallbackMapper',
    vtkOpenGLPixelSpaceCallbackMapper.newInstance
  );
  publicAPI.registerOverride('vtkRenderer', vtkOpenGLRenderer.newInstance);
  publicAPI.registerOverride('vtkSkybox', vtkOpenGLSkybox.newInstance);
  publicAPI.registerOverride(
    'vtkSphereMapper',
    vtkOpenGLSphereMapper.newInstance
  );
  publicAPI.registerOverride(
    'vtkStickMapper',
    vtkOpenGLStickMapper.newInstance
  );
  publicAPI.registerOverride('vtkTexture', vtkOpenGLTexture.newInstance);
  publicAPI.registerOverride('vtkVolume', vtkOpenGLVolume.newInstance);
  publicAPI.registerOverride(
    'vtkVolumeMapper',
    vtkOpenGLVolumeMapper.newInstance
  );
  publicAPI.registerOverride(
    'vtkWidgetRepresentation',
    vtkGenericWidgetRepresentation.newInstance
  );
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLViewNodeFactory'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
