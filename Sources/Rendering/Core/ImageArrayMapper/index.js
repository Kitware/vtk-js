import macro from 'vtk.js/Sources/macros';
import vtkAbstractImageMapper from 'vtk.js/Sources/Rendering/Core/AbstractImageMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
// import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;
const { vtkErrorMacro, vtkWarningMacro } = macro;
const { SlicingMode } = vtkImageMapper;

// ----------------------------------------------------------------------------
// vtkImageArrayMapper methods
// ----------------------------------------------------------------------------

function vtkImageArrayMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageArrayMapper');

  //------------------
  // Private functions

  const _computeSliceToSubSliceMap = () => {
    const inputCollection = publicAPI.getInputData();
    if (!inputCollection || inputCollection.empty()) {
      return;
    }

    const perImageMap = inputCollection.map((image, index) => {
      const dim = image.getDimensions();
      const out = new Array(dim[model.slicingMode]);
      for (let i = 0; i < out.length; ++i) {
        out[i] = { imageIndex: index, subSlice: i };
      }
      return out;
    });

    model.sliceToSubSliceMap = perImageMap.flat();
    publicAPI.modified();
  };

  const _superSetInputData = publicAPI.setInputData;
  const _superSetInputConnection = publicAPI.setInputConnection;

  //------------------
  // Public functions

  publicAPI.setInputData = (inputData) => {
    _superSetInputData(inputData);
    _computeSliceToSubSliceMap();
  };

  publicAPI.setInputConnection = (outputPort, port = 0) => {
    _superSetInputConnection(outputPort, port);
    _computeSliceToSubSliceMap();
  };

  publicAPI.getImage = (slice = publicAPI.getSlice()) => {
    const imageCollection = publicAPI.getInputData();
    if (!imageCollection) {
      vtkWarningMacro('No input set.');
    } else if (slice < 0 || slice >= publicAPI.getTotalSlices()) {
      vtkWarningMacro('Invalid slice number.');
    } else {
      return imageCollection.getItem(
        model.sliceToSubSliceMap[slice].imageIndex
      );
    }
    return null;
  };

  publicAPI.getBounds = () => {
    const image = publicAPI.getCurrentImage();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }

    const inputCollection = publicAPI.getInputData();
    const bounds = [...vtkBoundingBox.INIT_BOUNDS];
    inputCollection.forEach((element) => {
      const sb = element.getBounds();
      vtkBoundingBox.addBounds(
        bounds,
        sb[0],
        sb[1],
        sb[2],
        sb[3],
        sb[4],
        sb[5]
      );
    });
    return bounds;
  };

  publicAPI.getClosestIJKAxis = () => ({
    ijkMode: model.slicingMode,
    flip: false,
  });

  publicAPI.computeTotalSlices = () => {
    const inputCollection = publicAPI.getInputData();
    return inputCollection.reduce(
      (accumulator, currImage) =>
        currImage.getDimensions()[model.slicingMode] + accumulator,
      0
    );
  };

  publicAPI.getTotalSlices = () => model.sliceToSubSliceMap.length;

  // set slice number in terms of imageIndex and subSlice number.
  publicAPI.setSlice = (slice) => {
    const inputCollection = publicAPI.getInputData();
    if (!inputCollection) {
      // No input is set
      vtkWarningMacro('No input set.');
      return;
    }

    if (
      model.sliceToSubSliceMap.length === 0 ||
      inputCollection.getMTime() > publicAPI.getMTime()
    ) {
      _computeSliceToSubSliceMap();
    }

    const totalSlices = publicAPI.getTotalSlices();
    if (slice >= 0 && slice < totalSlices) {
      model.slice = slice;
      publicAPI.modified();
    } else {
      vtkErrorMacro(
        `Slice number out of range. Acceptable range is: [0, ${
          totalSlices > 0 ? totalSlices - 1 : 0
        }]slice <= totalSlices`
      );
    }
  };

  publicAPI.computeSlice = (imageIndex, subSlice) =>
    model.sliceToSubSliceMap.findIndex(
      (x) => x.imageIndex === imageIndex && x.subSlice === subSlice
    );

  publicAPI.getImageIndex = (slice = publicAPI.getSlice()) =>
    model.sliceToSubSliceMap[slice]?.imageIndex;

  publicAPI.getSubSlice = (slice = publicAPI.getSlice()) =>
    model.sliceToSubSliceMap[slice]?.subSlice;

  publicAPI.getCurrentImage = () => publicAPI.getImage(publicAPI.getSlice());
}

// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  slicingMode: SlicingMode.K,
  sliceToSubSliceMap: [],
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractImageMapper.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.get(publicAPI, model, ['slicingMode']);

  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkImageArrayMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageArrayMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
};
