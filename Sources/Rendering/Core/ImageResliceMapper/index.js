import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';
import macro from 'vtk.js/Sources/macros';
import vtkAbstractImageMapper from 'vtk.js/Sources/Rendering/Core/AbstractImageMapper';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const { SlabTypes } = Constants;

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;

// ----------------------------------------------------------------------------
// vtkImageResliceMapper methods
// ----------------------------------------------------------------------------

function vtkImageResliceMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageResliceMapper');

  publicAPI.getBounds = () => {
    let bds = [...vtkBoundingBox.INIT_BOUNDS];
    const image = publicAPI.getInputData();
    if (publicAPI.getSlicePolyData()) {
      bds = publicAPI.getSlicePolyData().getBounds();
    } else if (image) {
      bds = image.getBounds();
      if (publicAPI.getSlicePlane()) {
        vtkBoundingBox.cutWithPlane(
          bds,
          publicAPI.getSlicePlane().getOrigin(),
          publicAPI.getSlicePlane().getNormal()
        );
      }
    }
    return bds;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const defaultValues = (initialValues) => ({
  slabThickness: 0.0,
  slabTrapezoidIntegration: 0,
  slabType: SlabTypes.MEAN,
  slicePlane: null,
  slicePolyData: null,
  updatedExtents: [],
  ...initialValues,
});

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Build VTK API
  vtkAbstractImageMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'slabThickness',
    'slabTrapezoidIntegration',
    'slabType',
    'slicePlane',
    'slicePolyData',
    'updatedExtents',
  ]);
  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkImageResliceMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageResliceMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
};
