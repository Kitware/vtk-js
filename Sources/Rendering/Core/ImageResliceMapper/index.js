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
    let bds = [0, 1, 0, 1, 0, 1];
    const image = publicAPI.getInputData();
    if (publicAPI.getSlicePolyData()) {
      bds = publicAPI.getSlicePolyData().getBounds();
    } else if (image) {
      // get bounds without the 0.5 voxel offset for each bound
      // applied when using image.getBounds()
      bds = image.extentToBounds(image.getExtent());
      const tmpBD = bds;
      if (publicAPI.getSlicePlane()) {
        vtkBoundingBox.cutWithPlane(
          bds,
          publicAPI.getSlicePlane().getOrigin(),
          publicAPI.getSlicePlane().getNormal()
        );
        for (let i = 0; i < 3; ++i) {
          if (bds[2 * i] - tmpBD[2 * i]) {
            bds[2 * i + 1] = bds[2 * i];
          } else if (tmpBD[2 * i + 1] - bds[2 * i + 1]) {
            bds[2 * i] = bds[2 * i + 1];
          }
        }
      }
    }
    return bds;
  };

  publicAPI.getBackgroundColor = (property) => {
    // Default to opaque black
    const color = [0, 0, 0, 1];
    if (property) {
      const lut = property.getRGBTransferFunction();
      if (lut) {
        // Return the first color defined in the color function
        let v = property.getColorLevel() - 0.5 * property.getColorWindow();
        if (property.getUseLookupTableScalarRange()) {
          v = lut.getRange()[0];
        }
        lut.getColor(v, color);
        color[3] = property.getOpacity();
      }
    }
    return color;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  slabThickness: 0.0,
  slabTrapezoidIntegration: 0,
  slabType: SlabTypes.MEAN,
  slicePlane: null,
  slicePolyData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractImageMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'slabThickness',
    'slabTrapezoidIntegration',
    'slabType',
    'slicePlane',
    'slicePolyData',
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
