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

function updateDomains(dataset, dataArray, model, updateProp) {
  const dataRange = dataArray.getRange();
  const spacing = dataset.getSpacing();
  const bounds = dataset.getBounds();
  const extent = dataset.getExtent();

  let sliceMin;
  let sliceMax;
  let stepVal;
  let axisIndex;
  const sliceMode = model.mapper.getSlicingMode();
  const sliceModeLabel = 'IJKXYZ'[sliceMode];
  switch (sliceMode) {
    case vtkImageMapper.SlicingMode.I:
    case vtkImageMapper.SlicingMode.J:
    case vtkImageMapper.SlicingMode.K:
      axisIndex = 'IJK'.indexOf(sliceModeLabel);
      sliceMin = extent[axisIndex * 2];
      sliceMax = extent[axisIndex * 2 + 1];
      stepVal = 1;
      break;
    case vtkImageMapper.SlicingMode.X:
    case vtkImageMapper.SlicingMode.Y:
    case vtkImageMapper.SlicingMode.Z:
      {
        axisIndex = 'XYZ'.indexOf(sliceModeLabel);
        sliceMin = bounds[axisIndex * 2];
        sliceMax = bounds[axisIndex * 2 + 1];
        const { ijkMode } = model.mapper.getClosestIJKAxis();
        stepVal = spacing[ijkMode];
      }
      break;
    default:
      break;
  }

  const propToUpdate = {
    slice: {
      domain: {
        min: sliceMin,
        max: sliceMax,
        step: stepVal,
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

  updateProp('slice', propToUpdate.slice);
  updateProp('colorWindow', propToUpdate.colorWindow);
  updateProp('colorLevel', propToUpdate.colorLevel);

  return {
    slice: mean(propToUpdate.slice.domain.min, propToUpdate.slice.domain.max),
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
    const bounds = inputDataset.getBounds();
    const extent = inputDataset.getExtent();
    switch (model.mapper.getCurrentSlicingMode()) {
      case vtkImageMapper.SlicingMode.I:
        publicAPI.setSlice(Math.floor(mean(extent[0], extent[1])));
        break;
      case vtkImageMapper.SlicingMode.J:
        publicAPI.setSlice(Math.floor(mean(extent[2], extent[3])));
        break;
      case vtkImageMapper.SlicingMode.K:
        publicAPI.setSlice(Math.floor(mean(extent[4], extent[5])));
        break;
      case vtkImageMapper.SlicingMode.X:
        publicAPI.setSlice(mean(bounds[0], bounds[1]));
        break;
      case vtkImageMapper.SlicingMode.Y:
        publicAPI.setSlice(mean(bounds[2], bounds[3]));
        break;
      case vtkImageMapper.SlicingMode.Z:
        publicAPI.setSlice(mean(bounds[4], bounds[5]));
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
    if (model.slicingMode !== mode) {
      // Update Mode
      model.slicingMode = mode;
      model.mapper.setCurrentSlicingMode(vtkImageMapper.SlicingMode[mode]);

      if (model.input) {
        // Update domains for UI...
        const state = updateDomains(
          publicAPI.getInputDataSet(),
          publicAPI.getDataArray(),
          model,
          publicAPI.updateProxyProperty
        );
        publicAPI.set(state);
      }
    }
  };

  // Used for UI
  publicAPI.getSliceValues = () => {
    const ds = publicAPI.getInputDataSet();
    if (!ds) {
      return [];
    }
    const values = [];
    const bds = ds.getBounds();
    const axisIndex = 'XYZ'.indexOf(model.slicingMode);
    const endValue = bds[axisIndex * 2 + 1];
    let currentValue = bds[axisIndex * 2];
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
    slice: { modelKey: 'mapper', property: 'slice' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSliceRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
