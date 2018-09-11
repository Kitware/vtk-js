import { vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPaintFilter methods
// ----------------------------------------------------------------------------

function vtkPaintFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPaintFilter');

  model.points = [];

  // --------------------------------------------------------------------------

  publicAPI.paintPoints = (points) => {
    model.points = points;
    publicAPI.modified();
  };

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    if (!model.backgroundImage) {
      vtkErrorMacro('No background image');
      return;
    }

    if (!model.backgroundImage.getPointData().getScalars()) {
      vtkErrorMacro('Background image has no scalars');
      return;
    }

    if (!model.maskImage) {
      // clone background image properties
      model.maskImage = vtkImageData.newInstance(
        model.backgroundImage.get('spacing', 'origin', 'direction')
      );
      model.maskImage.setDimensions(model.backgroundImage.getDimensions());
      model.maskImage.computeTransforms();

      const values = new Uint8Array(
        model.backgroundImage.getNumberOfPoints() * 4
      );
      const dataArray = vtkDataArray.newInstance({
        numberOfComponents: 4, // rgba
        values,
      });
      model.maskImage.getPointData().setScalars(dataArray);
    }

    if (!model.maskWorldToIndex) {
      model.maskWorldToIndex = model.maskImage.getWorldToIndex();
    }

    const scalars = model.maskImage.getPointData().getScalars();

    if (!scalars) {
      vtkErrorMacro('Mask image has no scalars');
      return;
    }

    // transform points into index space
    const worldPoints = model.points.map((pt) => {
      const worldPt = [pt[0], pt[1], pt[2]];
      const indexPt = [0, 0, 0];
      vec3.transformMat4(indexPt, worldPt, model.maskWorldToIndex);
      return [
        Math.round(indexPt[0]),
        Math.round(indexPt[1]),
        Math.round(indexPt[2]),
      ];
    });

    const spacing = model.maskImage.getSpacing();
    const dims = model.maskImage.getDimensions();
    const numberOfComponents = scalars.getNumberOfComponents();
    const jStride = numberOfComponents * dims[0];
    const kStride = numberOfComponents * dims[0] * dims[1];
    const scalarsData = scalars.getData();

    const [rx, ry, rz] = spacing.map((s) => model.radius / s);
    for (let pti = 0; pti < worldPoints.length; pti++) {
      const [x, y, z] = worldPoints[pti];
      const xstart = Math.floor(Math.min(dims[0] - 1, Math.max(0, x - rx)));
      const xend = Math.floor(Math.min(dims[0] - 1, Math.max(0, x + rx)));
      const ystart = Math.floor(Math.min(dims[1] - 1, Math.max(0, y - ry)));
      const yend = Math.floor(Math.min(dims[1] - 1, Math.max(0, y + ry)));
      const zstart = Math.floor(Math.min(dims[2] - 1, Math.max(0, z - rz)));
      const zend = Math.floor(Math.min(dims[2] - 1, Math.max(0, z + rz)));

      // naive algo
      for (let i = xstart; i <= xend; i++) {
        for (let j = ystart; j <= yend; j++) {
          for (let k = zstart; k <= zend; k++) {
            const ival = (i - x) / rx;
            const jval = (j - y) / ry;
            const kval = (k - z) / rz;
            if (ival * ival + jval * jval + kval * kval <= 1) {
              const voxel = model.voxelFunc
                ? model.voxelFunc(i, j, k, model.color)
                : model.color;
              scalarsData.set(
                voxel,
                i * numberOfComponents + j * jStride + k * kStride
              );
            }
          }
        }
      }
    }

    scalars.setData(scalarsData);
    scalars.modified();
    model.maskImage.modified();

    // clear points without triggering requestData
    model.points = [];
    outData[0] = model.maskImage;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  backgroundImage: null,
  maskImage: null,
  maskWorldToIndex: null,
  voxelFunc: null,
  radius: 1,
  color: [1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with no input and one output
  macro.algo(publicAPI, model, 0, 1);

  macro.setGet(publicAPI, model, [
    'backgroundImage',
    'maskImage',
    'maskWorldToIndex',
    'voxelFunc',
    'color',
    'radius',
  ]);

  // Object specific methods
  vtkPaintFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
