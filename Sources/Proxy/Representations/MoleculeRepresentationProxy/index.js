import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkStickMapper from 'vtk.js/Sources/Rendering/Core/StickMapper';
import vtkMoleculeToRepresentation from 'vtk.js/Sources/Filters/General/MoleculeToRepresentation';

import vtkAbstractRepresentationProxy from 'vtk.js/Sources/Proxy/Core/AbstractRepresentationProxy';

// ----------------------------------------------------------------------------
// vtkMoleculeRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkMoleculeRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMoleculeRepresentationProxy');

  // Internals
  model.filter = vtkMoleculeToRepresentation.newInstance();
  model.sphereMapper = vtkSphereMapper.newInstance();
  model.stickMapper = vtkStickMapper.newInstance();
  model.sphereActor = vtkActor.newInstance();
  model.stickActor = vtkActor.newInstance();

  model.sourceDependencies.push(model.filter);

  // render sphere
  model.sphereMapper.setInputConnection(model.filter.getOutputPort(0));
  model.sphereMapper.setScaleArray(model.filter.getSphereScaleArrayName());
  model.sphereActor.setMapper(model.sphereMapper);

  // render sticks
  model.stickMapper.setInputConnection(model.filter.getOutputPort(1));
  model.stickMapper.setScaleArray('stickScales');
  model.stickMapper.setOrientationArray('orientation');
  model.stickActor.setMapper(model.stickMapper);

  // Add actors
  model.actors.push(model.sphereActor);
  model.actors.push(model.stickActor);

  // API ----------------------------------------------------------------------

  publicAPI.setColorBy = () => {};
  publicAPI.getColorBy = () => [];
  publicAPI.listDataArrays = () => [];
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
  vtkMoleculeRepresentationProxy(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    tolerance: { modelKey: 'filter', property: 'tolerance' },
    atomicRadiusScaleFactor: {
      modelKey: 'filter',
      property: 'atomicRadiusScaleFactor',
    },
    bondRadius: { modelKey: 'filter', property: 'bondRadius' },
    deltaBondFactor: { modelKey: 'filter', property: 'deltaBondFactor' },
    radiusType: { modelKey: 'filter', property: 'radiusType' },
    hideElements: { modelKey: 'filter', property: 'hideElements' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMoleculeRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
