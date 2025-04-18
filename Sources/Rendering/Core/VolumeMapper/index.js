import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';
import vtkAbstractMapper3D from 'vtk.js/Sources/Rendering/Core/AbstractMapper3D';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

const { BlendMode } = Constants;

function createRadonTransferFunction(
  firstAbsorbentMaterialHounsfieldValue,
  firstAbsorbentMaterialAbsorption,
  maxAbsorbentMaterialHounsfieldValue,
  maxAbsorbentMaterialAbsorption,
  outputTransferFunction
) {
  let ofun = null;
  if (outputTransferFunction) {
    ofun = outputTransferFunction;
    ofun.removeAllPoints();
  } else {
    ofun = vtkPiecewiseFunction.newInstance();
  }
  ofun.addPointLong(-1024, 0, 1, 1); // air (i.e. material with no absorption)
  ofun.addPoint(
    firstAbsorbentMaterialHounsfieldValue,
    firstAbsorbentMaterialAbsorption
  );
  ofun.addPoint(
    maxAbsorbentMaterialHounsfieldValue,
    maxAbsorbentMaterialAbsorption
  );

  return ofun;
}

const methodNamesMovedToVolumeProperties = [
  'getAnisotropy',
  'getComputeNormalFromOpacity',
  'getFilterMode',
  'getFilterModeAsString',
  'getGlobalIlluminationReach',
  'getIpScalarRange',
  'getIpScalarRangeByReference',
  'getLAOKernelRadius',
  'getLAOKernelSize',
  'getLocalAmbientOcclusion',
  'getPreferSizeOverAccuracy',
  'getVolumetricScatteringBlending',
  'setAnisotropy',
  'setAverageIPScalarRange',
  'setComputeNormalFromOpacity',
  'setFilterMode',
  'setFilterModeToNormalized',
  'setFilterModeToOff',
  'setFilterModeToRaw',
  'setGlobalIlluminationReach',
  'setIpScalarRange',
  'setIpScalarRangeFrom',
  'setLAOKernelRadius',
  'setLAOKernelSize',
  'setLocalAmbientOcclusion',
  'setPreferSizeOverAccuracy',
  'setVolumetricScatteringBlending',
];

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  createRadonTransferFunction,
};

// ----------------------------------------------------------------------------
// vtkVolumeMapper methods
// ----------------------------------------------------------------------------

function vtkVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkVolumeMapper');

  const superClass = { ...publicAPI };

  publicAPI.getBounds = () => {
    if (!model.static) {
      publicAPI.update();
    }
    model.bounds = [...publicAPI.getInputData().getBounds()];
    return model.bounds;
  };

  publicAPI.setBlendModeToComposite = () => {
    publicAPI.setBlendMode(BlendMode.COMPOSITE_BLEND);
  };

  publicAPI.setBlendModeToMaximumIntensity = () => {
    publicAPI.setBlendMode(BlendMode.MAXIMUM_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToMinimumIntensity = () => {
    publicAPI.setBlendMode(BlendMode.MINIMUM_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToAverageIntensity = () => {
    publicAPI.setBlendMode(BlendMode.AVERAGE_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToAdditiveIntensity = () => {
    publicAPI.setBlendMode(BlendMode.ADDITIVE_INTENSITY_BLEND);
  };

  publicAPI.setBlendModeToRadonTransform = () => {
    publicAPI.setBlendMode(BlendMode.RADON_TRANSFORM_BLEND);
  };

  publicAPI.getBlendModeAsString = () =>
    macro.enumToString(BlendMode, model.blendMode);

  publicAPI.setVolumeShadowSamplingDistFactor = (vsdf) =>
    superClass.setVolumeShadowSamplingDistFactor(vsdf >= 1.0 ? vsdf : 1.0);

  // Instead of a "undefined is not a function" error, give more context and advice for these widely used methods
  methodNamesMovedToVolumeProperties.forEach((removedMethodName) => {
    const removedMethod = () => {
      throw new Error(
        `The method "volumeMapper.${removedMethodName}()" doesn't exist anymore. ` +
          `It is a rendering property that has been moved to the volume property. ` +
          `Replace your code with:\n` +
          `volumeActor.getProperty().${removedMethodName}()\n`
      );
    };
    publicAPI[removedMethodName] = removedMethod;
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// TODO: what values to use for averageIPScalarRange to get GLSL to use max / min values like [-Math.inf, Math.inf]?
const defaultValues = (initialValues) => ({
  bounds: [...vtkBoundingBox.INIT_BOUNDS],
  sampleDistance: 1.0,
  imageSampleDistance: 1.0,
  maximumSamplesPerRay: 1000,
  autoAdjustSampleDistances: true,
  initialInteractionScale: 1.0,
  interactionSampleDistanceFactor: 1.0,
  blendMode: BlendMode.COMPOSITE_BLEND,
  volumeShadowSamplingDistFactor: 5.0,
  colorTextureWidth: 1024,
  opacityTextureWidth: 1024,
  labelOutlineTextureWidth: 1024,
  ...initialValues,
});

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'sampleDistance',
    'imageSampleDistance',
    'maximumSamplesPerRay',
    'autoAdjustSampleDistances',
    'initialInteractionScale',
    'interactionSampleDistanceFactor',
    'blendMode',
    'volumeShadowSamplingDistFactor',
    'colorTextureWidth',
    'opacityTextureWidth',
    'labelOutlineTextureWidth',
  ]);

  macro.event(publicAPI, model, 'lightingActivated');

  // Object methods
  vtkVolumeMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkVolumeMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
