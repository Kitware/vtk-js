import Constants          from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro              from 'vtk.js/Sources/macro';
import vtkAbstractMapper  from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane           from 'vtk.js/Sources/Common/DataModel/Plane';

import { vec3 } from 'gl-matrix';

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

  publicAPI.intersectWithLineForPointPicking = (p1, p2) => {
    const imageData = publicAPI.getInputData();
    const extent = imageData.getExtent();

    // Slice origin
    const ijk = [model.xSlice + extent[0], model.ySlice + extent[2], model.zSlice + extent[4]];
    const worldOrigin = [0, 0, 0];
    imageData.indexToWorld(ijk, worldOrigin);

    // Normal computation
    ijk[model.currentSlicingMode] += 1;
    const worldNormal = [0, 0, 0];
    imageData.indexToWorld(ijk, worldNormal);
    worldNormal[0] -= worldOrigin[0];
    worldNormal[1] -= worldOrigin[1];
    worldNormal[2] -= worldOrigin[2];
    vec3.normalize(worldNormal, worldNormal);

    const intersect = vtkPlane.intersectWithLine(p1, p2, worldOrigin, worldNormal);
    if (intersect.intersection) {
      const point = intersect.x;
      const absoluteIJK = [0, 0, 0];
      imageData.worldToIndex(point, absoluteIJK);

      // Are we outside our actual extent/bounds
      if (absoluteIJK[0] < extent[0] || absoluteIJK[0] > extent[1]
        || absoluteIJK[1] < extent[2] || absoluteIJK[1] > extent[3]
        || absoluteIJK[2] < extent[4] || absoluteIJK[2] > extent[5]) {
        return null;
      }

      // Get closer integer ijk
      ijk[0] = Math.round(absoluteIJK[0]);
      ijk[1] = Math.round(absoluteIJK[1]);
      ijk[2] = Math.round(absoluteIJK[2]);

      return {
        ijk,
        absoluteIJK,
        point,
      };
    }
    return null;
  };

  publicAPI.intersectWithLineForCellPicking = (p1, p2) => {
    const imageData = publicAPI.getInputData();
    const extent = imageData.getExtent();

    // Slice origin
    const ijk = [model.xSlice + extent[0], model.ySlice + extent[2], model.zSlice + extent[4]];
    const worldOrigin = [0, 0, 0];
    imageData.indexToWorld(ijk, worldOrigin);

    // Normal computation
    ijk[model.currentSlicingMode] += 1;
    const worldNormal = [0, 0, 0];
    imageData.indexToWorld(ijk, worldNormal);
    worldNormal[0] -= worldOrigin[0];
    worldNormal[1] -= worldOrigin[1];
    worldNormal[2] -= worldOrigin[2];
    vec3.normalize(worldNormal, worldNormal);

    const intersect = vtkPlane.intersectWithLine(p1, p2, worldOrigin, worldNormal);
    if (intersect.intersection) {
      const point = intersect.x;
      const absoluteIJK = [0, 0, 0];
      imageData.worldToIndex(point, absoluteIJK);


      // Are we outside our actual extent/bounds
      if (absoluteIJK[0] < extent[0] || absoluteIJK[0] > extent[1]
        || absoluteIJK[1] < extent[2] || absoluteIJK[1] > extent[3]
        || absoluteIJK[2] < extent[4] || absoluteIJK[2] > extent[5]) {
        return null;
      }

      // Get closer integer ijk
      ijk[0] = Math.floor(absoluteIJK[0]);
      ijk[1] = Math.floor(absoluteIJK[1]);
      ijk[2] = Math.floor(absoluteIJK[2]);

      return {
        ijk,
        absoluteIJK,
        point,
      };
    }
    return null;
  };
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

export default Object.assign({ newInstance, extend }, Constants);
