import { mat3, mat4, vec3 } from 'gl-matrix';

import Constants from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper/Constants';
import macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const { OrientationModes, ScaleModes } = Constants;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// class methods
// ----------------------------------------------------------------------------

function vtkGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGlyph3DMapper');

  /**
   * An orientation array is a vtkDataArray with 3 components. The first
   * component is the angle of rotation along the X axis. The second
   * component is the angle of rotation along the Y axis. The third
   * component is the angle of rotation along the Z axis. Orientation is
   * specified in X,Y,Z order but the rotations are performed in Z,X an Y.
   * This definition is compliant with SetOrientation method on vtkProp3D.
   * By using vector or normal there is a degree of freedom or rotation
   * left (underconstrained). With the orientation array, there is no degree of
   * freedom left.
   */
  publicAPI.getOrientationModeAsString = () =>
    macro.enumToString(OrientationModes, model.orientationMode);
  publicAPI.setOrientationModeToDirection = () =>
    publicAPI.setOrientationMode(OrientationModes.DIRECTION);
  publicAPI.setOrientationModeToRotation = () =>
    publicAPI.setOrientationMode(OrientationModes.ROTATION);
  publicAPI.setOrientationModeToMatrix = () =>
    publicAPI.setOrientationMode(OrientationModes.MATRIX);
  publicAPI.getOrientationArrayData = () => {
    const idata = publicAPI.getInputData(0);
    if (!idata || !idata.getPointData()) {
      return null;
    }
    if (!model.orientationArray) {
      return idata.getPointData().getVectors();
    }
    return idata.getPointData().getArray(model.orientationArray);
  };

  publicAPI.getScaleModeAsString = () =>
    macro.enumToString(ScaleModes, model.scaleMode);
  publicAPI.setScaleModeToScaleByMagnitude = () =>
    publicAPI.setScaleMode(ScaleModes.SCALE_BY_MAGNITUDE);
  publicAPI.setScaleModeToScaleByComponents = () =>
    publicAPI.setScaleMode(ScaleModes.SCALE_BY_COMPONENTS);
  publicAPI.setScaleModeToScaleByConstant = () =>
    publicAPI.setScaleMode(ScaleModes.SCALE_BY_CONSTANT);
  publicAPI.getScaleArrayData = () => {
    const idata = publicAPI.getInputData(0);
    if (!idata || !idata.getPointData()) {
      return null;
    }
    if (!model.scaleArray) {
      return idata.getPointData().getScalars();
    }
    return idata.getPointData().getArray(model.scaleArray);
  };

  publicAPI.getBounds = () => {
    const idata = publicAPI.getInputData(0);
    const gdata = publicAPI.getInputData(1);
    if (!idata || !gdata) {
      return vtkMath.createUninitializedBounds();
    }

    // first we build the arrays used for the glyphing
    publicAPI.buildArrays();
    return model.bounds;
  };

  publicAPI.buildArrays = () => {
    // if the mtgime requires it, rebuild
    const idata = publicAPI.getInputData(0);
    const gdata = publicAPI.getInputData(1);
    if (
      model.buildTime.getMTime() < gdata.getMTime() ||
      model.buildTime.getMTime() < idata.getMTime() ||
      model.buildTime.getMTime() < publicAPI.getMTime()
    ) {
      const pts = idata.getPoints().getData();
      let sArray = publicAPI.getScaleArrayData();
      let sData = null;
      let numSComp = 0;
      if (sArray) {
        sData = sArray.getData();
        numSComp = sArray.getNumberOfComponents();
      }

      if (
        model.scaling &&
        sArray &&
        model.scaleMode === ScaleModes.SCALE_BY_COMPONENTS &&
        sArray.getNumberOfComponents() !== 3
      ) {
        vtkErrorMacro(
          'Cannot scale by components since scale array does not have 3 components.'
        );
        sArray = null;
      }

      // get the glyph bounds
      const gbounds = gdata.getBounds();
      // convert them to 8 points so we can compute the
      // overall bounds while building the arrays
      const corners = [];
      vtkBoundingBox.getCorners(gbounds, corners);
      model.bounds[0] = vtkBoundingBox.INIT_BOUNDS[0];
      model.bounds[1] = vtkBoundingBox.INIT_BOUNDS[1];
      model.bounds[2] = vtkBoundingBox.INIT_BOUNDS[2];
      model.bounds[3] = vtkBoundingBox.INIT_BOUNDS[3];
      model.bounds[4] = vtkBoundingBox.INIT_BOUNDS[4];
      model.bounds[5] = vtkBoundingBox.INIT_BOUNDS[5];

      const tcorner = new Float64Array(3);

      const oArray = publicAPI.getOrientationArrayData();

      const identity = mat4.identity(new Float64Array(16));
      const trans = [];
      const scale = [];
      const numPts = pts.length / 3;
      model.matrixArray = new Float32Array(16 * numPts);
      const mbuff = model.matrixArray.buffer;
      model.normalArray = new Float32Array(9 * numPts);
      const nbuff = model.normalArray.buffer;
      const tuple = [];
      for (let i = 0; i < numPts; ++i) {
        const z = new Float32Array(mbuff, i * 64, 16);
        trans[0] = pts[i * 3];
        trans[1] = pts[i * 3 + 1];
        trans[2] = pts[i * 3 + 2];
        mat4.translate(z, identity, trans);

        if (oArray) {
          const orientation = [];
          oArray.getTuple(i, orientation);
          switch (model.orientationMode) {
            case OrientationModes.MATRIX: {
              // prettier-ignore
              const rotMat4 = [
                ...orientation.slice(0, 3), 0,
                ...orientation.slice(3, 6), 0,
                ...orientation.slice(6, 9), 0,
                0, 0, 0, 1,
              ];
              mat4.multiply(z, z, rotMat4);
              break;
            }
            case OrientationModes.ROTATION:
              mat4.rotateZ(z, z, orientation[2]);
              mat4.rotateX(z, z, orientation[0]);
              mat4.rotateY(z, z, orientation[1]);
              break;

            case OrientationModes.DIRECTION:
              if (orientation[1] === 0.0 && orientation[2] === 0.0) {
                if (orientation[0] < 0) {
                  mat4.rotateY(z, z, 3.1415926);
                }
              } else {
                const vMag = vtkMath.norm(orientation);
                const vNew = [];
                vNew[0] = (orientation[0] + vMag) / 2.0;
                vNew[1] = orientation[1] / 2.0;
                vNew[2] = orientation[2] / 2.0;
                mat4.rotate(z, z, 3.1415926, vNew);
              }
              break;
            default:
              break;
          }
        }

        // scale data if appropriate
        if (model.scaling) {
          scale[0] = model.scaleFactor;
          scale[1] = model.scaleFactor;
          scale[2] = model.scaleFactor;
          // Get the scalar and vector data
          if (sArray) {
            switch (model.scaleMode) {
              case ScaleModes.SCALE_BY_MAGNITUDE:
                for (let t = 0; t < numSComp; ++t) {
                  tuple[t] = sData[i * numSComp + t];
                }
                scale[0] *= vtkMath.norm(tuple, numSComp);
                scale[1] = scale[0];
                scale[2] = scale[0];
                break;
              case ScaleModes.SCALE_BY_COMPONENTS:
                for (let t = 0; t < numSComp; ++t) {
                  tuple[t] = sData[i * numSComp + t];
                }
                scale[0] *= tuple[0];
                scale[1] *= tuple[1];
                scale[2] *= tuple[2];
                break;
              case ScaleModes.SCALE_BY_CONSTANT:
              default:
                break;
            }
          }
          if (scale[0] === 0.0) {
            scale[0] = 1.0e-10;
          }
          if (scale[1] === 0.0) {
            scale[1] = 1.0e-10;
          }
          if (scale[2] === 0.0) {
            scale[2] = 1.0e-10;
          }
          mat4.scale(z, z, scale);
        }

        // update bounds
        for (let p = 0; p < 8; ++p) {
          vec3.transformMat4(tcorner, corners[p], z);
          if (tcorner[0] < model.bounds[0]) {
            model.bounds[0] = tcorner[0];
          }
          if (tcorner[1] < model.bounds[2]) {
            model.bounds[2] = tcorner[1];
          }
          if (tcorner[2] < model.bounds[4]) {
            model.bounds[4] = tcorner[2];
          }
          if (tcorner[0] > model.bounds[1]) {
            model.bounds[1] = tcorner[0];
          }
          if (tcorner[1] > model.bounds[3]) {
            model.bounds[3] = tcorner[1];
          }
          if (tcorner[2] > model.bounds[5]) {
            model.bounds[5] = tcorner[2];
          }
        }

        const n = new Float32Array(nbuff, i * 36, 9);
        mat3.fromMat4(n, z);
        mat3.invert(n, n);
        mat3.transpose(n, n);
      }

      // map scalars as well
      const scalars = publicAPI.getAbstractScalars(
        idata,
        model.scalarMode,
        model.arrayAccessMode,
        model.arrayId,
        model.colorByArrayName
      ).scalars;

      if (!model.useLookupTableScalarRange) {
        publicAPI
          .getLookupTable()
          .setRange(model.scalarRange[0], model.scalarRange[1]);
      }

      model.colorArray = null;
      const lut = publicAPI.getLookupTable();
      if (lut && scalars) {
        // Ensure that the lookup table is built
        lut.build();
        model.colorArray = lut.mapScalars(scalars, model.colorMode, 0);
      }

      model.buildTime.modified();
    }
  };

  publicAPI.getPrimitiveCount = () => {
    const glyph = publicAPI.getInputData(1);
    const mult = publicAPI.getInputData().getPoints().getNumberOfValues() / 3;

    const pcount = {
      points: (mult * glyph.getPoints().getNumberOfValues()) / 3,
      verts:
        mult *
        (glyph.getVerts().getNumberOfValues() -
          glyph.getVerts().getNumberOfCells()),
      lines:
        mult *
        (glyph.getLines().getNumberOfValues() -
          2 * glyph.getLines().getNumberOfCells()),
      triangles:
        mult *
        (glyph.getPolys().getNumberOfValues() -
          3 * glyph.getLines().getNumberOfCells()),
    };
    return pcount;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  orient: true,
  orientationMode: OrientationModes.DIRECTION,
  orientationArray: null,
  scaling: true,
  scaleFactor: 1.0,
  scaleMode: ScaleModes.SCALE_BY_MAGNITUDE,
  scaleArray: null,
  matrixArray: null,
  normalArray: null,
  colorArray: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMapper.extend(publicAPI, model, initialValues);
  macro.algo(publicAPI, model, 2, 0);

  model.buildTime = {};
  macro.obj(model.buildTime, { mtime: 0 });

  model.boundsTime = {};
  macro.obj(model.boundsTime, { mtime: 0 });

  macro.setGet(publicAPI, model, [
    'orient',
    'orientationMode',
    'orientationArray',
    'scaleArray',
    'scaleFactor',
    'scaleMode',
    'scaling',
  ]);

  macro.get(publicAPI, model, [
    'colorArray',
    'matrixArray',
    'normalArray',
    'buildTime',
  ]);

  // Object methods
  vtkGlyph3DMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
