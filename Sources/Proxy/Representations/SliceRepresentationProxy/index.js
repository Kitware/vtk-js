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
    sliceIndex: Math.floor(
      mean(
        propToUpdate.sliceIndex.domain.min,
        propToUpdate.sliceIndex.domain.max
      )
    ),
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

  // API ----------------------------------------------------------------------

  publicAPI.setInput = (source) => {
    superSetInput(source);

    if (!source) {
      return;
    }

    vtkAbstractRepresentationProxy.connectMapper(model.mapper, source);
    const state = updateDomains(
      publicAPI.getInputDataSet(),
      publicAPI.getDataArray(),
      model,
      publicAPI.updateProxyProperty
    );
    publicAPI.set(state);

    // connect rendering pipeline
    model.actor.setMapper(model.mapper);
    model.actors.push(model.actor);

    // Create a link handler on source

    // Ensure the delete will clear all possible conbinaison
    ['SliceX', 'SliceY', 'SliceZ', 'ColorWindow', 'ColorLevel'].forEach(
      (linkName) => {
        publicAPI.registerPropertyLinkForGC(source.getPropertyLink(linkName));
      }
    );

    source.getPropertyLink('ColorWindow').bind(publicAPI, 'colorWindow');
    source.getPropertyLink('ColorLevel').bind(publicAPI, 'colorLevel');
    source
      .getPropertyLink(`Slice${model.slicingMode}`)
      .bind(publicAPI, 'sliceIndex');
  };

  publicAPI.setSliceIndex = (index) => {
    model.mapper[`set${model.slicingMode}SliceIndex`](index);
    model.sliceIndex = index;
    publicAPI.modified();
  };

  publicAPI.getSliceIndexValues = () => {
    const values = [];
    const extent = publicAPI.getInputDataSet().getExtent();
    const axisIndex = 'XYZ'.indexOf(model.slicingMode);
    const endValue = extent[axisIndex * 2 + 1];
    let currentValue = extent[axisIndex * 2];
    while (currentValue <= endValue) {
      values.push(currentValue);
      currentValue++;
    }
    return values;
  };

  publicAPI.setSlicingMode = (mode) => {
    if (!mode) {
      console.log('skip setSlicingMode', mode);
      return;
    }
    if (model.input && model.slicingMode !== mode) {
      model.input
        .getPropertyLink(`Slice${model.slicingMode}`)
        .unbind(publicAPI, 'sliceIndex');
      model.slicingMode = mode;
      model.input
        .getPropertyLink(`Slice${model.slicingMode}`)
        .bind(publicAPI, 'sliceIndex');

      // Update domains for UI...
      const state = updateDomains(
        publicAPI.getInputDataSet(),
        publicAPI.getDataArray(),
        model,
        publicAPI.updateProxyProperty
      );
      publicAPI.set(state);
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  slicingMode: 'X',
  sliceIndex: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model);
  macro.get(publicAPI, model, ['sliceIndex', 'slicingMode']);

  // Object specific methods
  vtkSliceRepresentationProxy(publicAPI, model);

  // Proxyfy
  macro.proxyPropertyMapping(publicAPI, model, {
    visibility: { modelKey: 'actor', property: 'visibility' },
    colorWindow: { modelKey: 'property', property: 'colorWindow' },
    colorLevel: { modelKey: 'property', property: 'colorLevel' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSliceRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
