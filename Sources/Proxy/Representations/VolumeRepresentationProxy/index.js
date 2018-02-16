import macro from 'vtk.js/Sources/macro';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
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

function updateDomains(dataset, dataArray, updateProp) {
  const dataRange = dataArray.getRange();
  const extent = dataset.getExtent();

  const propToUpdate = {
    xSliceIndex: {
      domain: {
        min: extent[0],
        max: extent[1],
        step: 1,
      },
    },
    ySliceIndex: {
      domain: {
        min: extent[2],
        max: extent[3],
        step: 1,
      },
    },
    zSliceIndex: {
      domain: {
        min: extent[4],
        max: extent[5],
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

  updateProp('xSliceIndex', propToUpdate.xSliceIndex);
  updateProp('ySliceIndex', propToUpdate.ySliceIndex);
  updateProp('zSliceIndex', propToUpdate.zSliceIndex);
  updateProp('colorWindow', propToUpdate.colorWindow);
  updateProp('colorLevel', propToUpdate.colorLevel);

  return {
    xSliceIndex: Math.floor(
      mean(
        propToUpdate.xSliceIndex.domain.min,
        propToUpdate.xSliceIndex.domain.max
      )
    ),
    ySliceIndex: Math.floor(
      mean(
        propToUpdate.ySliceIndex.domain.min,
        propToUpdate.ySliceIndex.domain.max
      )
    ),
    zSliceIndex: Math.floor(
      mean(
        propToUpdate.zSliceIndex.domain.min,
        propToUpdate.zSliceIndex.domain.max
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

function updateConfiguration(dataset, dataArray, { mapper, property }) {
  const dataRange = dataArray.getRange();

  // Configuration
  // actor.getProperty().setInterpolationTypeToFastLinear();
  property.setInterpolationTypeToLinear();

  // For better looking volume rendering
  // - distance in world coordinates a scalar opacity of 1.0
  property.setScalarOpacityUnitDistance(
    0,
    vtkBoundingBox.getDiagonalLength(dataset.getBounds()) /
      Math.max(...dataset.getDimensions())
  );
  // - control how we emphasize surface boundaries
  //  => max should be around the average gradient magnitude for the
  //     volume or maybe average plus one std dev of the gradient magnitude
  //     (adjusted for spacing, this is a world coordinate gradient, not a
  //     pixel gradient)
  //  => max hack: (dataRange[1] - dataRange[0]) * 0.05
  property.setGradientOpacityMinimumValue(0, 0);
  property.setGradientOpacityMaximumValue(
    0,
    (dataRange[1] - dataRange[0]) * 0.05
  );
  // - Use shading based on gradient
  property.setShade(true);
  property.setUseGradientOpacity(0, true);
  // - generic good default
  property.setGradientOpacityMinimumOpacity(0, 0.0);
  property.setGradientOpacityMaximumOpacity(0, 1.0);
  property.setAmbient(0.2);
  property.setDiffuse(0.7);
  property.setSpecular(0.3);
  property.setSpecularPower(8.0);
}

// ----------------------------------------------------------------------------
// vtkVolumeRepresentationProxy methods
// ----------------------------------------------------------------------------

function vtkVolumeRepresentationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolumeRepresentationProxy');

  // Volume
  model.mapper = vtkVolumeMapper.newInstance();
  model.volume = vtkVolume.newInstance();
  model.property = model.volume.getProperty();

  model.sourceDependencies.push(model.mapper);

  // Slices
  model.mapperX = vtkImageMapper.newInstance({
    currentSlicingMode: vtkImageMapper.SlicingMode.X,
  });
  model.actorX = vtkImageSlice.newInstance({ visibility: false });
  model.propertySlices = model.actorX.getProperty();
  model.mapperY = vtkImageMapper.newInstance({
    currentSlicingMode: vtkImageMapper.SlicingMode.Y,
  });
  model.actorY = vtkImageSlice.newInstance({
    visibility: false,
    property: model.propertySlices,
  });
  model.mapperZ = vtkImageMapper.newInstance({
    currentSlicingMode: vtkImageMapper.SlicingMode.Z,
  });
  model.actorZ = vtkImageSlice.newInstance({
    visibility: false,
    property: model.propertySlices,
  });

  model.sourceDependencies.push(model.mapperX);
  model.sourceDependencies.push(model.mapperY);
  model.sourceDependencies.push(model.mapperZ);

  // connect rendering pipeline
  model.volume.setMapper(model.mapper);
  model.volumes.push(model.volume);

  // Connect slice pipeline
  model.actorX.setMapper(model.mapperX);
  model.actors.push(model.actorX);
  model.actorY.setMapper(model.mapperY);
  model.actors.push(model.actorY);
  model.actorZ.setMapper(model.mapperZ);
  model.actors.push(model.actorZ);

  function setInputData(inputDataset) {
    const [name, location] = publicAPI.getColorBy();
    publicAPI.rescaleTransferFunctionToDataRange(name, location);

    const lutProxy = publicAPI.getLookupTableProxy(name);
    const pwfProxy = publicAPI.getPiecewiseFunctionProxy(name);
    if (pwfProxy.getGaussians().length === 0) {
      pwfProxy.setGaussians([
        { position: 0.5, height: 1, width: 0.5, xBias: 0.5, yBias: 0.5 },
      ]);
    }

    model.property.setRGBTransferFunction(0, lutProxy.getLookupTable());
    model.property.setScalarOpacity(0, pwfProxy.getPiecewiseFunction());

    updateConfiguration(inputDataset, publicAPI.getDataArray(), model);
    publicAPI.setSampleDistance();
    publicAPI.setEdgeGradient();

    // Update domains
    const state = updateDomains(
      inputDataset,
      publicAPI.getDataArray(),
      publicAPI.updateProxyProperty
    );
    publicAPI.set(state);
  }

  model.sourceDependencies.push({ setInputData });

  // API ----------------------------------------------------------------------

  publicAPI.isVisible = () => model.volume.getVisibility();

  publicAPI.setVisibility = model.volume.setVisibility;
  publicAPI.getVisibility = model.volume.getVisibility;

  publicAPI.setVolumeVisibility = model.volume.setVisibility;
  publicAPI.getVolumeVisibility = model.volume.getVisibility;

  publicAPI.setSliceVisibility = macro.chain(
    model.actorX.setVisibility,
    model.actorY.setVisibility,
    model.actorZ.setVisibility
  );
  publicAPI.getSliceVisibility = model.actorX.getVisibility;

  publicAPI.setSampleDistance = (distance = 0.4) => {
    if (model.sampleDistance !== distance) {
      model.sampleDistance = distance;
      const sourceDS = publicAPI.getInputDataSet();
      const sampleDistance =
        0.7 *
        Math.sqrt(
          sourceDS
            .getSpacing()
            .map((v) => v * v)
            .reduce((a, b) => a + b, 0)
        );
      model.mapper.setSampleDistance(
        sampleDistance * 2 ** (distance * 3.0 - 1.5)
      );

      publicAPI.modified();
    }
  };

  publicAPI.setEdgeGradient = (edgeGradient = 0.2) => {
    if (model.edgeGradient !== edgeGradient) {
      model.edgeGradient = edgeGradient;
      if (edgeGradient === 0) {
        model.volume.getProperty().setUseGradientOpacity(0, false);
      } else {
        const dataArray = publicAPI.getDataArray();
        const dataRange = dataArray.getRange();
        model.volume.getProperty().setUseGradientOpacity(0, true);
        const minV = Math.max(0.0, edgeGradient - 0.3) / 0.7;
        model.volume
          .getProperty()
          .setGradientOpacityMinimumValue(
            0,
            (dataRange[1] - dataRange[0]) * 0.2 * minV * minV
          );
        model.volume
          .getProperty()
          .setGradientOpacityMaximumValue(
            0,
            (dataRange[1] - dataRange[0]) * 1.0 * edgeGradient * edgeGradient
          );
      }
      publicAPI.modified();
    }
  };

  const parentSetColorBy = publicAPI.setColorBy;
  publicAPI.setColorBy = (arrayName, arrayLocation, componentIndex = -1) => {
    console.log('setColorBy', arrayName, arrayLocation, componentIndex);
    parentSetColorBy(arrayName, arrayLocation, componentIndex);
    const lutProxy = publicAPI.getLookupTableProxy(arrayName);
    const pwfProxy = publicAPI.getPiecewiseFunctionProxy(arrayName);
    model.property.setRGBTransferFunction(0, lutProxy.getLookupTable());
    model.property.setScalarOpacity(0, pwfProxy.getPiecewiseFunction());
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  sampleDistance: -1,
  edgeGradient: -1,
  disableSolidColor: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkAbstractRepresentationProxy.extend(publicAPI, model);
  macro.get(publicAPI, model, ['sampleDistance', 'edgeGradient']);

  // Object specific methods
  vtkVolumeRepresentationProxy(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    xSliceIndex: { modelKey: 'mapperX', property: 'slice' },
    ySliceIndex: { modelKey: 'mapperY', property: 'slice' },
    zSliceIndex: { modelKey: 'mapperZ', property: 'slice' },
    colorWindow: { modelKey: 'propertySlices', property: 'colorWindow' },
    colorLevel: { modelKey: 'propertySlices', property: 'colorLevel' },
    useShadow: { modelKey: 'property', property: 'shade' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkVolumeRepresentationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, updateConfiguration };
