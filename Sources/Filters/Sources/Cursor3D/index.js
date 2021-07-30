import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
// ----------------------------------------------------------------------------
// vtkCursor3D methods
// ----------------------------------------------------------------------------

function vtkCursor3D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCursor3D');
  // Public API methods
  publicAPI.setModelBounds = (bounds) => {
    if (!Array.isArray(bounds) || bounds.length < 6) {
      return;
    }
    if (
      model.modelBounds[0] === bounds[0] &&
      model.modelBounds[1] === bounds[1] &&
      model.modelBounds[2] === bounds[2] &&
      model.modelBounds[3] === bounds[3] &&
      model.modelBounds[4] === bounds[4] &&
      model.modelBounds[5] === bounds[5]
    ) {
      return;
    }
    publicAPI.modified();
    // Doing type convert, make sure it is a number array.
    // Without correct coversion, the array may contains string which cause
    // the wrapping and clampping works incorrectly.
    model.modelBounds = bounds.map((v) => Number(v));
    for (let i = 0; i < 3; ++i) {
      model.modelBounds[2 * i] = Math.min(
        model.modelBounds[2 * i],
        model.modelBounds[2 * i + 1]
      );
    }
  };

  publicAPI.setFocalPoint = (points) => {
    if (!Array.isArray(points) || points.length < 3) {
      return;
    }
    if (
      points[0] === model.focalPoint[0] &&
      points[1] === model.focalPoint[1] &&
      points[2] === model.focalPoint[2]
    ) {
      return;
    }
    publicAPI.modified();
    const v = [];
    for (let i = 0; i < 3; i++) {
      v[i] = points[i] - model.focalPoint[i];
      model.focalPoint[i] = Number(points[i]);

      if (model.translationMode) {
        model.modelBounds[2 * i] += v[i];
        model.modelBounds[2 * i + 1] += v[i];
      }
      // wrap
      else if (model.wrap) {
        model.focalPoint[i] =
          model.modelBounds[2 * i] +
          (((model.focalPoint[i] - model.modelBounds[2 * i]) * 1.0) %
            ((model.modelBounds[2 * i + 1] - model.modelBounds[2 * i]) * 1.0));
      }
      // clamp
      else {
        if (points[i] < model.modelBounds[2 * i]) {
          model.focalPoint[i] = model.modelBounds[2 * i];
        }
        if (points[i] > model.modelBounds[2 * i + 1]) {
          model.focalPoint[i] = model.modelBounds[2 * i + 1];
        }
      }
    }
  };

  publicAPI.setAll = (flag) => {
    publicAPI.setOutline(flag);
    publicAPI.setAxes(flag);
    publicAPI.setXShadows(flag);
    publicAPI.setYShadows(flag);
    publicAPI.setZShadows(flag);
  };

  publicAPI.allOn = () => {
    publicAPI.setAll(true);
  };

  publicAPI.allOff = () => {
    publicAPI.setAll(false);
  };

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }
    let numPts = 0;
    let numLines = 0;
    // Check bounding box and origin
    if (model.wrap) {
      for (let i = 0; i < model.focalPoint.length; ++i) {
        model.focalPoint[i] =
          model.modelBounds[2 * i] +
          (((model.focalPoint[i] - model.modelBounds[2 * i]) * 1.0) %
            (model.modelBounds[2 * i + 1] - model.modelBounds[2 * i]));
      }
    } else {
      for (let i = 0; i < model.focalPoint.length; ++i) {
        model.focalPoint[i] = Math.max(
          model.focalPoint[i],
          model.modelBounds[2 * i]
        );
        model.focalPoint[i] = Math.min(
          model.focalPoint[i],
          model.modelBounds[2 * i + 1]
        );
      }
    }
    // allocate storage
    if (model.axes) {
      numPts += 6;
      numLines += 3;
    }

    if (model.outline) {
      numPts += 8;
      numLines += 12;
    }

    if (model.xShadows) {
      numPts += 8;
      numLines += 4;
    }

    if (model.yShadows) {
      numPts += 8;
      numLines += 4;
    }

    if (model.zShadows) {
      numPts += 8;
      numLines += 4;
    }

    if (numPts === 0) {
      return;
    }
    const polyData = vtkPolyData.newInstance();
    const newPts = vtkPoints.newInstance({ size: numPts * 3 });
    //  vtkCellArray is a supporting object that explicitly represents cell
    //  connectivity. The cell array structure is a raw integer list
    //  of the form: (n,id1,id2,...,idn, n,id1,id2,...,idn, ...)
    //  where n is the number of points in the cell, and id is a zero-offset index
    //  into an associated point list.
    const newLines = vtkCellArray.newInstance({ size: numLines * (2 + 1) });
    let pid = 0;
    let cid = 0;
    // Create axes
    if (model.axes) {
      newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
      newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
      newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
      newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
      newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
      ++pid;
      newLines.getData()[cid * 3 + 0] = 2;
      newLines.getData()[cid * 3 + 1] = pid - 2;
      newLines.getData()[cid * 3 + 2] = pid - 1;
      ++cid;
      newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
      newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
      newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
      ++pid;
      newLines.getData()[cid * 3 + 0] = 2;
      newLines.getData()[cid * 3 + 1] = pid - 2;
      newLines.getData()[cid * 3 + 2] = pid - 1;
      ++cid;
      newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
      newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
      newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
      ++pid;
      newLines.getData()[cid * 3 + 0] = 2;
      newLines.getData()[cid * 3 + 1] = pid - 2;
      newLines.getData()[cid * 3 + 2] = pid - 1;
      ++cid;
    }
    // create outline
    if (model.outline) {
      // first traid
      newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
      const corner024 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
      const corner124 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
      const corner034 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
      const corner025 = pid;
      ++pid;
      newLines.getData()[(cid + 0) * 3 + 0] = 2;
      newLines.getData()[(cid + 0) * 3 + 1] = corner024;
      newLines.getData()[(cid + 0) * 3 + 2] = corner124;
      newLines.getData()[(cid + 1) * 3 + 0] = 2;
      newLines.getData()[(cid + 1) * 3 + 1] = corner024;
      newLines.getData()[(cid + 1) * 3 + 2] = corner034;
      newLines.getData()[(cid + 2) * 3 + 0] = 2;
      newLines.getData()[(cid + 2) * 3 + 1] = corner024;
      newLines.getData()[(cid + 2) * 3 + 2] = corner025;
      cid += 3;
      // second triad
      newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
      const corner135 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
      const corner035 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
      const corner125 = pid;
      ++pid;
      newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
      newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
      newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
      const corner134 = pid;
      ++pid;
      newLines.getData()[(cid + 0) * 3 + 0] = 2;
      newLines.getData()[(cid + 0) * 3 + 1] = corner135;
      newLines.getData()[(cid + 0) * 3 + 2] = corner035;
      newLines.getData()[(cid + 1) * 3 + 0] = 2;
      newLines.getData()[(cid + 1) * 3 + 1] = corner135;
      newLines.getData()[(cid + 1) * 3 + 2] = corner125;
      newLines.getData()[(cid + 2) * 3 + 0] = 2;
      newLines.getData()[(cid + 2) * 3 + 1] = corner135;
      newLines.getData()[(cid + 2) * 3 + 2] = corner134;
      cid += 3;
      // Fill in remaining lines
      // vtk.js do not support checking repeating insertion
      newLines.getData()[(cid + 0) * 3 + 0] = 2;
      newLines.getData()[(cid + 0) * 3 + 1] = corner124;
      newLines.getData()[(cid + 0) * 3 + 2] = corner134;
      newLines.getData()[(cid + 1) * 3 + 0] = 2;
      newLines.getData()[(cid + 1) * 3 + 1] = corner124;
      newLines.getData()[(cid + 1) * 3 + 2] = corner125;
      cid += 2;
      newLines.getData()[(cid + 0) * 3 + 0] = 2;
      newLines.getData()[(cid + 0) * 3 + 1] = corner034;
      newLines.getData()[(cid + 0) * 3 + 2] = corner134;
      newLines.getData()[(cid + 1) * 3 + 0] = 2;
      newLines.getData()[(cid + 1) * 3 + 1] = corner034;
      newLines.getData()[(cid + 1) * 3 + 2] = corner035;
      cid += 2;
      newLines.getData()[(cid + 0) * 3 + 0] = 2;
      newLines.getData()[(cid + 0) * 3 + 1] = corner025;
      newLines.getData()[(cid + 0) * 3 + 2] = corner125;
      newLines.getData()[(cid + 1) * 3 + 0] = 2;
      newLines.getData()[(cid + 1) * 3 + 1] = corner025;
      newLines.getData()[(cid + 1) * 3 + 2] = corner035;
      cid += 2;
    }
    // create x-shadows
    if (model.xShadows) {
      for (let i = 0; i < 2; ++i) {
        newPts.getData()[pid * 3 + 0] = model.modelBounds[i];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
        newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.modelBounds[i];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
        newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
        newPts.getData()[pid * 3 + 0] = model.modelBounds[i];
        newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.modelBounds[i];
        newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
      }
    }

    // create y-shadows
    if (model.yShadows) {
      for (let i = 0; i < 2; ++i) {
        newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[i + 2];
        newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[i + 2];
        newPts.getData()[pid * 3 + 2] = model.focalPoint[2];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
        newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[i + 2];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[4];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[i + 2];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[5];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
      }
    }

    // create z-shadows
    if (model.zShadows) {
      for (let i = 0; i < 2; ++i) {
        newPts.getData()[pid * 3 + 0] = model.modelBounds[0];
        newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[i + 4];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.modelBounds[1];
        newPts.getData()[pid * 3 + 1] = model.focalPoint[1];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[i + 4];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
        newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[2];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[i + 4];
        ++pid;
        newPts.getData()[pid * 3 + 0] = model.focalPoint[0];
        newPts.getData()[pid * 3 + 1] = model.modelBounds[3];
        newPts.getData()[pid * 3 + 2] = model.modelBounds[i + 4];
        ++pid;
        newLines.getData()[cid * 3 + 0] = 2;
        newLines.getData()[cid * 3 + 1] = pid - 2;
        newLines.getData()[cid * 3 + 2] = pid - 1;
        ++cid;
      }
    }
    const pts = vtkPoints.newInstance({ size: 3 });
    pts.getData()[0] = model.focalPoint[0];
    pts.getData()[1] = model.focalPoint[1];
    pts.getData()[2] = model.focalPoint[2];
    // update ourseleves
    model.focus = vtkPolyData.newInstance();
    model.focus.setPoints(pts);

    polyData.setPoints(newPts);
    polyData.setLines(newLines);
    outData[0] = polyData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  focus: null,
  modelBounds: [-1.0, 1.0, -1.0, 1.0, -1.0, 1.0],
  focalPoint: [0.0, 0.0, 0.0],
  outline: true,
  axes: true,
  xShadows: true,
  yShadows: true,
  zShadows: true,
  wrap: false,
  translationMode: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  // Cursor3D
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['focus']);
  macro.getArray(publicAPI, model, ['modelBounds'], 6);
  macro.getArray(publicAPI, model, ['focalPoint'], 3);
  macro.setGet(publicAPI, model, ['outline']);
  macro.setGet(publicAPI, model, ['axes']);
  macro.setGet(publicAPI, model, ['xShadows']);
  macro.setGet(publicAPI, model, ['yShadows']);
  macro.setGet(publicAPI, model, ['zShadows']);
  macro.setGet(publicAPI, model, ['wrap']);
  macro.setGet(publicAPI, model, ['translationMode']);
  macro.algo(publicAPI, model, 0, 1);
  vtkCursor3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCursor3D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
