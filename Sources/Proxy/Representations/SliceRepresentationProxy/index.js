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

  updateProp('slice', propToUpdate.slice);
  updateProp('windowWidth', propToUpdate.windowWidth);
  updateProp('windowLevel', propToUpdate.windowLevel);

  return {
    slice: mean(propToUpdate.slice.domain.min, propToUpdate.slice.domain.max),
    windowWidth: propToUpdate.windowWidth.domain.max,
    windowLevel: Math.floor(
      mean(
        propToUpdate.windowLevel.domain.min,
        propToUpdate.windowWidth.domain.max
      )
    ),
  };
}

// ----------------------------------------------------------------------------
// vtkSliceRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkSliceRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSliceRepresentationProxy');

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
    switch (model.mapper.getSlicingMode()) {
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
      model.mapper.setSlicingMode(vtkImageMapper.SlicingMode[mode]);

      // Update to previously set position
      const modelKey = `${mode.toLowerCase()}Slice`;
      if (modelKey in model && model[modelKey] !== undefined) {
        model.mapper.setSlice(model[modelKey]);
      }

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
      publicAPI.modified();
    }
  };

  publicAPI.getSliceIndex = () => {
    if ('XYZ'.indexOf(model.slicingMode) !== -1) {
      return model.mapper.getSliceAtPosition(model.mapper.getSlice());
    }
    return model.mapper.getSlice();
  };

  publicAPI.getAnnotations = () => {
    const dynamicAddOn = {};
    const sliceIndex = publicAPI.getSliceIndex();
    const sliceBounds = model.mapper.getBoundsForSlice();
    const sliceNormal = model.mapper.getSlicingModeNormal();
    const { ijkMode } = model.mapper.getClosestIJKAxis();
    const sliceOrigin = [
      (sliceBounds[0] + sliceBounds[1]) * 0.5,
      (sliceBounds[2] + sliceBounds[3]) * 0.5,
      (sliceBounds[4] + sliceBounds[5]) * 0.5,
    ];
    let slicePosition = 0;
    if (sliceBounds[1] - sliceBounds[0] < Number.EPSILON) {
      slicePosition = sliceBounds[0];
    }
    if (sliceBounds[3] - sliceBounds[2] < Number.EPSILON) {
      slicePosition = sliceBounds[2];
    }
    if (sliceBounds[5] - sliceBounds[4] < Number.EPSILON) {
      slicePosition = sliceBounds[4];
    }

    const imageData = model.mapper.getInputData();
    if (imageData) {
      dynamicAddOn.sliceSpacing = imageData.getSpacing()[ijkMode];
      dynamicAddOn.dimensions = imageData.getDimensions();
      dynamicAddOn.sliceCount = imageData.getDimensions()[ijkMode];
      const ijkOrientation = [];
      for (let i = 0; i < 3; i++) {
        const extent = [0, 0, 0, 0, 0, 0];
        extent[i * 2 + 1] = 1;
        const tmpBounds = imageData.extentToBounds(extent);
        if (tmpBounds[1] - tmpBounds[0] > Number.EPSILON) {
          ijkOrientation[0] = 'IJK'[i];
        }
        if (tmpBounds[3] - tmpBounds[2] > Number.EPSILON) {
          ijkOrientation[1] = 'IJK'[i];
        }
        if (tmpBounds[5] - tmpBounds[4] > Number.EPSILON) {
          ijkOrientation[2] = 'IJK'[i];
        }
      }
      dynamicAddOn.ijkOrientation = ijkOrientation.join('');
    }

    return Object.assign(
      {
        ijkMode,
        sliceBounds,
        sliceIndex,
        sliceNormal,
        sliceOrigin,
        slicePosition,
      },
      dynamicAddOn
    );
  };

  // Used for UI
  publicAPI.getSliceValues = (slicingMode = model.slicingMode) => {
    const ds = publicAPI.getInputDataSet();
    if (!ds) {
      return [];
    }
    const values = [];
    const bds = ds.getBounds();
    const axisIndex = 'XYZ'.indexOf(slicingMode);
    const endValue = bds[axisIndex * 2 + 1];
    let currentValue = bds[axisIndex * 2];
    while (currentValue <= endValue) {
      values.push(currentValue);
      currentValue++;
    }
    return values;
  };

  const parentSetColorBy = publicAPI.setColorBy;
  publicAPI.setColorBy = (arrayName, arrayLocation, componentIndex = -1) => {
    if (arrayName === null) {
      model.property.setRGBTransferFunction(null);
      model.property.setScalarOpacity(null);
    } else {
      parentSetColorBy(arrayName, arrayLocation, componentIndex);
      const lutProxy = publicAPI.getLookupTableProxy(arrayName);
      const pwfProxy = publicAPI.getPiecewiseFunctionProxy(arrayName);
      model.property.setRGBTransferFunction(lutProxy.getLookupTable());
      model.property.setScalarOpacity(pwfProxy.getPiecewiseFunction());
    }
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
    windowWidth: { modelKey: 'property', property: 'colorWindow' },
    windowLevel: { modelKey: 'property', property: 'colorLevel' },
    interpolationType: { modelKey: 'property', property: 'interpolationType' },
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
