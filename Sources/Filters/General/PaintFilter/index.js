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
  const history = {};

  // --------------------------------------------------------------------------

  function resetHistory() {
    history.index = -1;
    history.snapshots = [];
    history.labels = [];
  }

  // --------------------------------------------------------------------------

  publicAPI.startStroke = () => {
    if (model.labelMap) {
      if (!workerPromise) {
        worker = new PaintFilterWorker();
        workerPromise = new WebworkerPromise(worker);
      }

      workerPromise.exec('start', {
        bufferType: 'Uint8Array',
        dimensions: model.labelMap.getDimensions(),
        slicingMode: model.slicingMode,
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

        let diffCount = 0;
        for (let i = 0; i < strokeLabelMap.length; i++) {
          // strokeLabelMap is binary mask of paint stroke
          diffCount += strokeLabelMap[i];
        }

        // Format: [ [index, oldLabel], ...]
        // I could use an ArrayBuffer, which would place limits
        // on the values of index/old, but will be more efficient.
        const snapshot = new Array(diffCount);
        const label = model.label;

        let diffIdx = 0;
        if (model.voxelFunc) {
          const bgScalars = model.backgroundImage.getPointData().getScalars();
          for (let i = 0; i < strokeLabelMap.length; i++) {
            if (strokeLabelMap[i]) {
              const voxel = bgScalars.getTuple(i);
              // might not fill up snapshot
              if (model.voxelFunc(voxel, i, label)) {
                snapshot[diffIdx++] = [i, data[i]];
                data[i] = label;
              }
            }
          }
        } else {
          for (let i = 0; i < strokeLabelMap.length; i++) {
            if (strokeLabelMap[i]) {
              if (data[i] !== label) {
                snapshot[diffIdx++] = [i, data[i]];
                data[i] = label;
              }
            }
          }
        }

        // clear any "redo" info
        const spliceIndex = history.index + 1;
        const spliceLength = history.snapshots.length - history.index;
        history.snapshots.splice(spliceIndex, spliceLength);
        history.labels.splice(spliceIndex, spliceLength);

        history.snapshots.push(snapshot);
        history.labels.push(label);
        history.index++;

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

  publicAPI.paintRectangle = (point1, point2) => {
    if (workerPromise) {
      const index1 = [0, 0, 0];
      const index2 = [0, 0, 0];
      vec3.transformMat4(index1, point1, model.maskWorldToIndex);
      vec3.transformMat4(index2, point2, model.maskWorldToIndex);
      index1[0] = Math.round(index1[0]);
      index1[1] = Math.round(index1[1]);
      index1[2] = Math.round(index1[2]);
      index2[0] = Math.round(index2[0]);
      index2[1] = Math.round(index2[1]);
      index2[2] = Math.round(index2[2]);
      workerPromise.exec('paintRectangle', {
        point1: index1,
        point2: index2,
      });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.paintEllipse = (center, scale3) => {
    if (workerPromise) {
      const realCenter = [0, 0, 0];
      const origin = [0, 0, 0];
      let realScale3 = [0, 0, 0];
      vec3.transformMat4(realCenter, center, model.maskWorldToIndex);
      vec3.transformMat4(origin, origin, model.maskWorldToIndex);
      vec3.transformMat4(realScale3, scale3, model.maskWorldToIndex);
      vec3.subtract(realScale3, realScale3, origin);
      realScale3 = realScale3.map((s) => (s === 0 ? 0.25 : Math.abs(s)));
      workerPromise.exec('paintEllipse', {
        center: realCenter,
        scale3: realScale3,
      });
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.undo = () => {
    if (history.index > -1) {
      const scalars = model.labelMap.getPointData().getScalars();
      const data = scalars.getData();

      const snapshot = history.snapshots[history.index];
      for (let i = 0; i < snapshot.length; i++) {
        if (!snapshot[i]) {
          break;
        }

        const [index, oldLabel] = snapshot[i];
        data[index] = oldLabel;
      }

      history.index--;

      scalars.setData(data);
      scalars.modified();
      model.labelMap.modified();
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.redo = () => {
    if (history.index < history.labels.length - 1) {
      const scalars = model.labelMap.getPointData().getScalars();
      const data = scalars.getData();

      const redoLabel = history.labels[history.index + 1];
      const snapshot = history.snapshots[history.index + 1];

      for (let i = 0; i < snapshot.length; i++) {
        if (!snapshot[i]) {
          break;
        }

        const [index] = snapshot[i];
        data[index] = redoLabel;
      }

      history.index++;

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
      resetHistory();
      return true;
    }
    return false;
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

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  resetHistory();
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
  slicingMode: null,
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
    'slicingMode',
  ]);

  // Object specific methods
  vtkPaintFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
