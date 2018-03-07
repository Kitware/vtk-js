import macro from 'vtk.js/Sources/macro';
import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';

import vtkAbstractRepresentationProxy from 'vtk.js/Sources/Proxy/Core/AbstractRepresentationProxy';

// ----------------------------------------------------------------------------
// vtkSkyboxRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkSkyboxRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSkyboxRepresentationProxy');
  model.actor = vtkSkybox.newInstance();
  model.actors.push(model.actor);

  function updateTexture(texture) {
    model.actor.removeAllTextures();
    model.actor.addTexture(texture);

    // Update domain
    const values = model.input.getAlgo().getPositions();
    publicAPI.updateProxyProperty('position', { values });
  }

  model.sourceDependencies.push({ setInputData: updateTexture });

  // API ----------------------------------------------------------------------

  publicAPI.setColorBy = () => {};
  publicAPI.getColorBy = () => [];
  publicAPI.listDataArrays = () => [];

  publicAPI.setPosition = (value) => {
    model.input.getAlgo().setPosition(value);
  };

  publicAPI.getPosition = () => model.input.getAlgo().getPosition();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model);

  // Object specific methods
  vtkSkyboxRepresentationProxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSkyboxRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
