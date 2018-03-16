import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import vtkAbstractRepresentationProxy from 'vtk.js/Sources/Proxy/Core/AbstractRepresentationProxy';

// ----------------------------------------------------------------------------
// vtkSlicedGeometryRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkSlicedGeometryRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSlicedGeometryRepresentationProxy');

  // Internals
  model.plane = vtkPlane.newInstance();
  model.cutter = vtkCutter.newInstance();
  model.cutter.setCutFunction(model.plane);
  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance();
  model.property = model.actor.getProperty();
  model.property.setLighting(false);

  // connect rendering pipeline
  model.mapper.setInputConnection(model.cutter.getOutputPort());
  model.actor.setMapper(model.mapper);
  model.actors.push(model.actor);

  // Keep things updated
  model.sourceDependencies.push(model.cutter);

  // Internal functions -------------------------------------------------------
  function updateSlice(slice) {
    model.slice = slice;
    const n = model.plane.getNormal();
    model.plane.setOrigin(n[0] * slice, n[1] * slice, n[2] * slice);
    model.cutter.modified();
  }

  function updateOffset(offset) {
    model.offset = offset;
    const normal = model.plane.getNormal();
    model.actor.setPosition(
      offset * normal[0],
      offset * normal[1],
      offset * normal[2]
    );
  }

  // API ----------------------------------------------------------------------
  publicAPI.setSlice = (slice) => {
    if (slice === model.slice || slice === undefined) {
      return;
    }
    updateSlice(slice);
    publicAPI.modified();
  };

  publicAPI.setOffset = (offset) => {
    if (offset === model.offset || offset === undefined) {
      return;
    }
    updateOffset(offset);
    publicAPI.modified();
  };

  publicAPI.setSlicingMode = (mode) => {
    if (model.slicingMode === mode || !mode) {
      console.log('skip setSlicingMode', mode);
      return;
    }
    model.slicingMode = mode;
    switch (vtkImageMapper.SlicingMode[mode]) {
      case vtkImageMapper.SlicingMode.X:
        model.plane.setNormal(1, 0, 0);
        break;
      case vtkImageMapper.SlicingMode.Y:
        model.plane.setNormal(0, 1, 0);
        break;
      case vtkImageMapper.SlicingMode.Z:
        model.plane.setNormal(0, 0, 1);
        break;
      default:
        return;
    }
    // Reslice properly along that new axis
    updateSlice(model.slice);
    updateOffset(model.offset);

    // Update pipeline
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  slicingMode: vtkImageMapper.SlicingMode.NONE,
  slice: 0,
  offset: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model);
  macro.get(publicAPI, model, ['slicingMode', 'slice', 'offset']);

  // Object specific methods
  vtkSlicedGeometryRepresentationProxy(publicAPI, model);

  // Map proxy properties
  macro.proxyPropertyState(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    opacity: { modelKey: 'property', property: 'opacity' },
    visibility: { modelKey: 'actor', property: 'visibility' },
    color: { modelKey: 'property', property: 'diffuseColor' },
    useShadow: { modelKey: 'property', property: 'lighting' },
    useBounds: { modelKey: 'actor', property: 'useBounds' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSlicedGeometryRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
