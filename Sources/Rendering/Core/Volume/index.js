import macro from 'vtk.js/Sources/macros';
import vtkProp3D from 'vtk.js/Sources/Rendering/Core/Prop3D';
import vtkVolumeProperty from 'vtk.js/Sources/Rendering/Core/VolumeProperty';

// ----------------------------------------------------------------------------
// vtkVolume methods
// ----------------------------------------------------------------------------

function vtkVolume(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolume');

  publicAPI.getVolumes = () => [publicAPI];

  publicAPI.makeProperty = vtkVolumeProperty.newInstance;

  publicAPI.getRedrawMTime = () => {
    let mt = model.mtime;
    if (model.mapper !== null) {
      let time = model.mapper.getMTime();
      mt = time > mt ? time : mt;
      if (model.mapper.getInput() !== null) {
        // FIXME !!! getInputAlgorithm / getInput
        model.mapper.getInputAlgorithm().update();
        time = model.mapper.getInput().getMTime();
        mt = time > mt ? time : mt;
      }
    }
    return mt;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mapper: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProp3D.extend(publicAPI, model, initialValues);

  // vtkTimeStamp
  model.boundsMTime = {};
  macro.obj(model.boundsMTime);

  // Build VTK API
  macro.setGet(publicAPI, model, ['mapper']);

  // Object methods
  vtkVolume(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkVolume');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
