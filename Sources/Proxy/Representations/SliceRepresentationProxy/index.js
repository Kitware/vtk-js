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
  const superSetInput = publicAPI.setInput;

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
    publicAPI.setXSlice(Math.floor(mean(extent[0], extent[1])));
    publicAPI.setYSlice(Math.floor(mean(extent[2], extent[3])));
    publicAPI.setZSlice(Math.floor(mean(extent[4], extent[5])));
  }

  // Keep things updated
  model.sourceDependencies.push(model.mapper);
  model.sourceDependencies.push({ setInputData });

  // API ----------------------------------------------------------------------

  publicAPI.setInput = (source) => {
    superSetInput(source);

    if (!source) {
      return;
    }

    // Create a link handler on source
    // Ensure the delete will clear all possible conbinaison
    ['SliceX', 'SliceY', 'SliceZ', 'ColorWindow', 'ColorLevel'].forEach(
      (linkName) => {
        publicAPI.registerPropertyLinkForGC(source.getPropertyLink(linkName));
      }
    );

    source.getPropertyLink('ColorWindow').bind(publicAPI, 'colorWindow');
    source.getPropertyLink('ColorLevel').bind(publicAPI, 'colorLevel');
    source.getPropertyLink('SliceX').bind(publicAPI, 'xSlice');
    source.getPropertyLink('SliceY').bind(publicAPI, 'ySlice');
    source.getPropertyLink('SliceZ').bind(publicAPI, 'zSlice');
  };

  publicAPI.setSliceIndex = (index) =>
    model.mapper[`set${model.slicingMode}Slice`](index);

  publicAPI.getSliceIndex = () =>
    model.slicingMode ? model.mapper[`get${model.slicingMode}Slice`]() : 0;

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
    xSlice: { modelKey: 'mapper', property: 'xSlice' },
    ySlice: { modelKey: 'mapper', property: 'ySlice' },
    zSlice: { modelKey: 'mapper', property: 'zSlice' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSliceRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
