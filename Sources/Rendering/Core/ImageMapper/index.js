import Constants          from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro              from 'vtk.js/Sources/macro';
import vtkAbstractMapper  from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';

const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// vtkImageMapper methods
// ----------------------------------------------------------------------------

function vtkImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMapper');

  publicAPI.setZSliceFromCamera = (cam) => {
    const image = publicAPI.getInputData();
    const fp = cam.getFocalPoint();
    const idx = [];
    image.worldToIndex(fp, idx);
    publicAPI.setZSlice(Math.floor(idx[2] + 0.5));
  };

  publicAPI.setZSliceIndex = (id) => {
    model.currentSlicingMode = SlicingMode.Z;
    publicAPI.setZSlice(id);
  };

  publicAPI.setYSliceIndex = (id) => {
    model.currentSlicingMode = SlicingMode.Y;
    publicAPI.setYSlice(id);
  };

  publicAPI.setXSliceIndex = (id) => {
    model.currentSlicingMode = SlicingMode.X;
    publicAPI.setXSlice(id);
  };

  publicAPI.getBounds = () => {
    const image = publicAPI.getInputData();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    if (!model.useCustomExtents) {
      return image.getBounds();
    }

    const ex = [
      model.customDisplayExtent[0],
      model.customDisplayExtent[1],
      model.customDisplayExtent[2],
      model.customDisplayExtent[3],
      model.zSlice,
      model.zSlice,
    ];

    return image.extentToBounds(ex);
  };

  publicAPI.getIsOpaque = () => true;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  displayExtent: [0, 0, 0, 0, 0, 0],
  customDisplayExtent: [0, 0, 0, 0],
  useCustomExtents: false,
  xSlice: 0,
  ySlice: 0,
  zSlice: 0,
  currentSlicingMode: SlicingMode.NONE,
  renderToRectangle: false,
  sliceAtFocalPoint: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'currentSlicingMode',
    'xSlice',
    'ySlice',
    'zSlice',
    'useCustomExtents',
    'renderToRectangle',
    'sliceAtFocalPoint',
  ]);
  macro.setGetArray(publicAPI, model, [
    'customDisplayExtent',
  ], 4);

  // Object methods
  vtkImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
