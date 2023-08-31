import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkImageDataOutlineFilter from 'vtk.js/Sources/Filters/General/ImageDataOutlineFilter';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { SlabTypes } from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import vtkAbstractRepresentationProxy from 'vtk.js/Sources/Proxy/Core/AbstractRepresentationProxy';

// ----------------------------------------------------------------------------

function sum(a, b) {
  return a + b;
}

// ----------------------------------------------------------------------------

function mean(...array) {
  return array.reduce(sum, 0) / array.length;
}

// ----------------------------------------------------------------------------

function updateDomains(dataset, dataArray, model, updateProp) {
  const dataRange = dataArray.getRange();

  const propToUpdate = {
    windowWidth: {
      domain: {
        min: 0,
        max: dataRange[1] - dataRange[0],
        step: 'any',
      },
    },
    windowLevel: {
      domain: {
        min: dataRange[0],
        max: dataRange[1],
        step: 'any',
      },
    },
  };

  updateProp('windowWidth', propToUpdate.windowWidth);
  updateProp('windowLevel', propToUpdate.windowLevel);

  return {
    windowWidth: propToUpdate.windowWidth.domain.max,
    windowLevel: Math.floor(
      mean(
        propToUpdate.windowLevel.domain.min,
        propToUpdate.windowLevel.domain.max
      )
    ),
  };
}

// ----------------------------------------------------------------------------
// vtkResliceRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkResliceRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceRepresentationProxy');

  model.mapper = vtkImageResliceMapper.newInstance();
  model.actor = vtkImageSlice.newInstance();
  model.property = model.actor.getProperty();

  // set slicing plane
  model.slicePlane = vtkPlane.newInstance();
  model.slicePlane.setNormal(0, 1, 0);
  model.mapper.setSlicePlane(model.slicePlane);
  model.mapper.setSlabType(SlabTypes.MAX);

  // for the slice polygon outline
  model.outline = {
    iof: vtkImageDataOutlineFilter.newInstance(),
    sof: vtkCutter.newInstance({ cutFunction: model.slicePlane }),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ visibility: false }),
  };
  model.outline.sof.setInputConnection(model.outline.iof.getOutputPort());
  model.outline.mapper.setInputConnection(model.outline.sof.getOutputPort());

  // connect rendering pipeline
  model.actor.setMapper(model.mapper);
  model.actors.push(model.actor);
  model.outline.actor.setMapper(model.outline.mapper);
  model.actors.push(model.outline.actor);

  function setInputData(inputDataset) {
    const state = updateDomains(
      inputDataset,
      publicAPI.getDataArray(),
      model,
      publicAPI.updateProxyProperty
    );
    publicAPI.set(state);

    model.slicePlane.setOrigin(inputDataset.getCenter());
  }

  // Keep things updated
  model.sourceDependencies.push(model.mapper);
  model.sourceDependencies.push({ setInputData });
  model.sourceDependencies.push(model.outline.iof);

  // API ----------------------------------------------------------------------

  const parentSetColorBy = publicAPI.setColorBy;
  publicAPI.setColorBy = (arrayName, arrayLocation, componentIndex = -1) => {
    if (arrayName === null) {
      model.property.setRGBTransferFunction(null);
      model.property.setPiecewiseFunction(null);
    } else {
      parentSetColorBy(arrayName, arrayLocation, componentIndex);
      const lutProxy = publicAPI.getLookupTableProxy(arrayName);
      const pwfProxy = publicAPI.getPiecewiseFunctionProxy(arrayName);
      model.property.setRGBTransferFunction(lutProxy.getLookupTable());
      model.property.setPiecewiseFunction(pwfProxy.getPiecewiseFunction());
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['slicePlane']);

  // Object specific methods
  vtkResliceRepresentationProxy(publicAPI, model);

  // Proxyfy
  model.outlineActor = model.outline.actor;
  model.outlineProperty = model.outline.actor.getProperty();
  macro.proxyPropertyMapping(publicAPI, model, {
    visibility: { modelKey: 'actor', property: 'visibility' },
    windowWidth: { modelKey: 'property', property: 'colorWindow' },
    windowLevel: { modelKey: 'property', property: 'colorLevel' },
    interpolationType: { modelKey: 'property', property: 'interpolationType' },
    slicePlane: { modelKey: 'mapper', property: 'slicePlane' },
    slicePolyData: { modelKey: 'mapper', property: 'slicePolyData' },
    slabType: { modelKey: 'mapper', property: 'slabType' },
    slabThickness: { modelKey: 'mapper', property: 'slabThickness' },
    slabTrapezoidIntegration: {
      modelKey: 'mapper',
      property: 'slabTrapezoidIntegration',
    },
    outlineVisibility: { modelKey: 'outlineActor', property: 'visibility' },
    outlineColor: { modelKey: 'outlineProperty', property: 'color' },
    outlineLineWidth: { modelKey: 'outlineProperty', property: 'lineWidth' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkResliceRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
