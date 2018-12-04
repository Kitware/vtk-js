/* eslint-disable no-bitwise */
import { vec3 } from 'gl-matrix';
import WebworkerPromise from 'webworker-promise';

import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

import PaintFilterWorker from 'vtk.js/Sources/Filters/General/PaintFilter/PaintFilter.worker';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPaintFilter methods
// ----------------------------------------------------------------------------

function vtkPaintFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPaintFilter');

  let worker = null;
  let workerPromise = null;
  const history = {
    buffer: null,
    // current painted layer index
    cindex: -1,
    colors: [],
  };

  // --------------------------------------------------------------------------

  publicAPI.startStroke = () => {
    if (model.labelMap) {
      worker = new PaintFilterWorker();
      workerPromise = new WebworkerPromise(worker);
      workerPromise.exec('start', {
        bufferType: 'Uint8Array',
        dimensions: model.labelMap.getDimensions(),
      });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.endStroke = () => {
    if (workerPromise) {
      workerPromise.exec('end').then((strokeBuffer) => {
        const scalars = model.labelMap.getPointData().getScalars();
        const data = scalars.getData();

        const strokeLabelMap = new Uint8Array(strokeBuffer);

        if (history.cindex === 7) {
          history.colors.shift();
        } else {
          history.cindex++;
        }
        history.colors.splice(history.cindex, history.colors.length);
        history.colors.push(model.label);

        const bgScalars = model.backgroundImage.getPointData().getScalars();
        if (model.voxelFunc) {
          for (let i = 0; i < strokeLabelMap.length; i++) {
            if (strokeLabelMap[i]) {
              const voxel = bgScalars.getTuple(i);
              const out = model.voxelFunc(voxel, strokeLabelMap[i], i);
              if (out !== null) {
                data[i] = out;
              }
            }
          }
        } else {
          for (let i = 0; i < strokeLabelMap.length; i++) {
            if (history.cindex === 7) {
              // last bit will be shifted off
              const lastBit = history.buffer[i] & 0x1;
              history.buffer[i] = (history.buffer[i] >> 1) | lastBit;
            }

            if (strokeLabelMap[i]) {
              data[i] = model.label;
              history.buffer[i] |= 1 << history.cindex;
            } else {
              history.buffer[i] &= ~(1 << history.cindex);
            }
          }
        }

        worker.terminate();
        worker = null;
        workerPromise = null;

        scalars.setData(data);
        scalars.modified();
        model.labelMap.modified();
        publicAPI.modified();
      });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.addPoint = (point) => {
    if (workerPromise) {
      const worldPt = [point[0], point[1], point[2]];
      const indexPt = [0, 0, 0];
      vec3.transformMat4(indexPt, worldPt, model.maskWorldToIndex);
      indexPt[0] = Math.round(indexPt[0]);
      indexPt[1] = Math.round(indexPt[1]);
      indexPt[2] = Math.round(indexPt[2]);

      const spacing = model.labelMap.getSpacing();
      const radius = spacing.map((s) => model.radius / s);

      workerPromise.exec('paint', { point: indexPt, radius });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.undo = () => {
    if (history.cindex > -1) {
      const scalars = model.labelMap.getPointData().getScalars();
      const data = scalars.getData();

      for (let i = 0; i < history.buffer.length; i++) {
        let labeli = history.cindex - 1;
        while (labeli > -1 && !(history.buffer[i] & (1 << labeli))) {
          labeli--;
        }
        const label = history.colors[labeli] || 0;
        data[i] = label;
      }

      history.cindex--;

      scalars.setData(data);
      scalars.modified();
      model.labelMap.modified();
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.redo = () => {
    if (history.cindex < history.colors.length - 1) {
      const scalars = model.labelMap.getPointData().getScalars();
      const data = scalars.getData();
      const labeli = history.cindex + 1;
      const label = history.colors[labeli];

      for (let i = 0; i < history.buffer.length; i++) {
        if (history.buffer[i] & (1 << labeli)) {
          data[i] = label;
        }
      }

      history.cindex++;

      scalars.setData(data);
      scalars.modified();
      model.labelMap.modified();
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  const superSetLabelMap = publicAPI.setLabelMap;
  publicAPI.setLabelMap = (lm) => {
    if (superSetLabelMap(lm)) {
      // reset history layer
      history.buffer = new Uint8Array(lm.getNumberOfPoints());
      history.cindex = -1;
    }
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

    if (!model.labelMap) {
      // clone background image properties
      const labelMap = vtkImageData.newInstance(
        model.backgroundImage.get('spacing', 'origin', 'direction')
      );
      labelMap.setDimensions(model.backgroundImage.getDimensions());
      labelMap.computeTransforms();

      // right now only support 256 labels
      const values = new Uint8Array(model.backgroundImage.getNumberOfPoints());
      const dataArray = vtkDataArray.newInstance({
        numberOfComponents: 1, // labelmap with single component
        values,
      });
      labelMap.getPointData().setScalars(dataArray);

      publicAPI.setLabelMap(labelMap);
    }

    if (!model.maskWorldToIndex) {
      model.maskWorldToIndex = model.labelMap.getWorldToIndex();
    }

    const scalars = model.labelMap.getPointData().getScalars();

    if (!scalars) {
      vtkErrorMacro('Mask image has no scalars');
      return;
    }

    model.labelMap.modified();

    outData[0] = model.labelMap;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  backgroundImage: null,
  labelMap: null,
  maskWorldToIndex: null,
  voxelFunc: null,
  radius: 1,
  label: 0,
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
    'labelMap',
    'labelWorldToIndex',
    'voxelFunc',
    'label',
    'radius',
  ]);

  // Object specific methods
  vtkPaintFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
