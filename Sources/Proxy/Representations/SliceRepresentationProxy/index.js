import macro from 'vtk.js/Sources/macro';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';

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

function updateDomains(dataset, dataArray, { slicingMode }, updateProp) {
  const dataRange = dataArray.getRange();
  const extent = dataset.getExtent();
  const axisIndex = 'XYZ'.indexOf(slicingMode);

  const propToUpdate = {
    sliceIndex: {
      domain: {
        min: extent[axisIndex * 2],
        max: extent[axisIndex * 2 + 1],
        step: 1,
      },
    },
    colorWindow: {
      domain: {
        min: 0,
        max: dataRange[1] - dataRange[0],
        step: 'any',
      },
    },
    colorLevel: {
      domain: {
        min: dataRange[0],
        max: dataRange[1],
        step: 'any',
      },
    },
  };

  updateProp('sliceIndex', propToUpdate.sliceIndex);
  updateProp('colorWindow', propToUpdate.colorWindow);
  updateProp('colorLevel', propToUpdate.colorLevel);

  return {
    colorWindow: propToUpdate.colorWindow.domain.max,
    colorLevel: Math.floor(
      mean(
        propToUpdate.colorLevel.domain.min,
        propToUpdate.colorWindow.domain.max
      )
    ),
  };
}

// ----------------------------------------------------------------------------
// vtkSliceRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkSliceRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSliceRepresentation');

  model.mapper = vtkImageMapper.newInstance();
  model.actor = vtkImageSlice.newInstance();
  model.property = model.actor.getProperty();

  // connect rendering pipeline
  model.actor.setMapper(model.mapper);
  model.actors.push(model.actor);

  function setInputData(inputDataset) {
    const state = updateDomains(
      inputDataset,
      publicAPI.getDataArray(),
      model,
      publicAPI.updateProxyProperty
    );
    publicAPI.set(state);

    // Init slice location
    const extent = inputDataset.getExtent();
    const { ijkMode } = model.mapper.getClosestIJKSlice();
    switch (ijkMode) {
      case vtkImageMapper.SlicingMode.I:
        publicAPI.setSlice(Math.floor(mean(extent[0], extent[1])));
        break;
      case vtkImageMapper.SlicingMode.J:
        publicAPI.setSlice(Math.floor(mean(extent[2], extent[3])));
        break;
      case vtkImageMapper.SlicingMode.K:
        publicAPI.setSlice(Math.floor(mean(extent[4], extent[5])));
        break;
      default:
        break;
    }
  }

  // Keep things updated
  model.sourceDependencies.push(model.mapper);
  model.sourceDependencies.push({ setInputData });

  // API ----------------------------------------------------------------------

  publicAPI.setSlicingMode = (mode) => {
    if (!mode) {
      console.log('skip setSlicingMode', mode);
      return;
    }
    if (model.input && model.slicingMode !== mode) {
      // Update Mode
      model.slicingMode = mode;
      model.mapper.setCurrentSlicingMode(vtkImageMapper.SlicingMode[mode]);

      // Update domains for UI...
      const state = updateDomains(
        publicAPI.getInputDataSet(),
        publicAPI.getDataArray(),
        model,
        publicAPI.updateProxyProperty
      );
      publicAPI.set(state);
    }
  };

  // Used for UI
  publicAPI.getSliceIndexValues = () => {
    const ds = publicAPI.getInputDataSet();
    if (!ds) {
      return [];
    }
    const values = [];
    const extent = ds.getExtent();
    const axisIndex = 'XYZ'.indexOf(model.slicingMode);
    const endValue = extent[axisIndex * 2 + 1];
    let currentValue = extent[axisIndex * 2];
    while (currentValue <= endValue) {
      values.push(currentValue);
      currentValue++;
    }
    return values;
  };

  // Initialize slicing mode
  publicAPI.setSlicingMode(model.slicingMode || 'X');
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
  macro.get(publicAPI, model, ['slicingMode']);

  // Object specific methods
  vtkSliceRepresentationProxy(publicAPI, model);

  // Proxyfy
  macro.proxyPropertyMapping(publicAPI, model, {
    visibility: { modelKey: 'actor', property: 'visibility' },
    colorWindow: { modelKey: 'property', property: 'colorWindow' },
    colorLevel: { modelKey: 'property', property: 'colorLevel' },
    sliceIndex: { modelKey: 'mapper', property: 'slice' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSliceRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
