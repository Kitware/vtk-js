import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkStructuredData from 'vtk.js/Sources/Common/DataModel/StructuredData';
import { StructuredType } from 'vtk.js/Sources/Common/DataModel/StructuredData/Constants';
import { vec3, mat3, mat4 } from 'gl-matrix';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageData methods
// ----------------------------------------------------------------------------

function vtkImageData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageData');

  publicAPI.setExtent = (...inExtent) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return false;
    }

    const extentArray = inExtent.length === 1 ? inExtent[0] : inExtent;

    if (extentArray.length !== 6) {
      return false;
    }

    let changeDetected = false;
    model.extent.forEach((item, index) => {
      if (item !== extentArray[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected) {
      model.extent = extentArray.slice();
      model.dataDescription = vtkStructuredData.getDataDescriptionFromExtent(
        model.extent
      );
      publicAPI.modified();
    }
    return changeDetected;
  };

  publicAPI.setDimensions = (...dims) => {
    let i;
    let j;
    let k;

    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }

    if (dims.length === 1) {
      const array = dims[0];
      i = array[0];
      j = array[1];
      k = array[2];
    } else if (dims.length === 3) {
      i = dims[0];
      j = dims[1];
      k = dims[2];
    } else {
      vtkErrorMacro('Bad dimension specification');
      return;
    }

    publicAPI.setExtent(0, i - 1, 0, j - 1, 0, k - 1);
  };

  publicAPI.getDimensions = () => [
    model.extent[1] - model.extent[0] + 1,
    model.extent[3] - model.extent[2] + 1,
    model.extent[5] - model.extent[4] + 1,
  ];

  publicAPI.getNumberOfCells = () => {
    const dims = publicAPI.getDimensions();
    let nCells = 1;

    for (let i = 0; i < 3; i++) {
      if (dims[i] === 0) {
        return 0;
      }
      if (dims[i] > 1) {
        nCells *= dims[i] - 1;
      }
    }

    return nCells;
  };

  publicAPI.getNumberOfPoints = () => {
    const dims = publicAPI.getDimensions();
    return dims[0] * dims[1] * dims[2];
  };

  publicAPI.getPoint = (index) => {
    const dims = publicAPI.getDimensions();

    if (dims[0] === 0 || dims[1] === 0 || dims[2] === 0) {
      vtkErrorMacro('Requesting a point from an empty image.');
      return null;
    }

    const ijk = new Float64Array(3);

    switch (model.dataDescription) {
      case StructuredType.EMPTY:
        return null;

      case StructuredType.SINGLE_POINT:
        break;

      case StructuredType.X_LINE:
        ijk[0] = index;
        break;

      case StructuredType.Y_LINE:
        ijk[1] = index;
        break;

      case StructuredType.Z_LINE:
        ijk[2] = index;
        break;

      case StructuredType.XY_PLANE:
        ijk[0] = index % dims[0];
        ijk[1] = index / dims[0];
        break;

      case StructuredType.YZ_PLANE:
        ijk[1] = index % dims[1];
        ijk[2] = index / dims[1];
        break;

      case StructuredType.XZ_PLANE:
        ijk[0] = index % dims[0];
        ijk[2] = index / dims[0];
        break;

      case StructuredType.XYZ_GRID:
        ijk[0] = index % dims[0];
        ijk[1] = (index / dims[0]) % dims[1];
        ijk[2] = index / (dims[0] * dims[1]);
        break;

      default:
        vtkErrorMacro('Invalid dataDescription');
        break;
    }

    const coords = [0, 0, 0];
    publicAPI.indexToWorld(ijk, coords);
    return coords;
  };

  // vtkCell *GetCell(vtkIdType cellId) VTK_OVERRIDE;
  // void GetCell(vtkIdType cellId, vtkGenericCell *cell) VTK_OVERRIDE;
  // void GetCellBounds(vtkIdType cellId, double bounds[6]) VTK_OVERRIDE;
  // virtual vtkIdType FindPoint(double x, double y, double z)
  // {
  //   return this->vtkDataSet::FindPoint(x, y, z);
  // }
  // vtkIdType FindPoint(double x[3]) VTK_OVERRIDE;
  // vtkIdType FindCell(
  //   double x[3], vtkCell *cell, vtkIdType cellId, double tol2,
  //   int& subId, double pcoords[3], double *weights) VTK_OVERRIDE;
  // vtkIdType FindCell(
  //   double x[3], vtkCell *cell, vtkGenericCell *gencell,
  //   vtkIdType cellId, double tol2, int& subId,
  //   double pcoords[3], double *weights) VTK_OVERRIDE;
  // vtkCell *FindAndGetCell(double x[3], vtkCell *cell, vtkIdType cellId,
  //                                 double tol2, int& subId, double pcoords[3],
  //                                 double *weights) VTK_OVERRIDE;
  // int GetCellType(vtkIdType cellId) VTK_OVERRIDE;
  // void GetCellPoints(vtkIdType cellId, vtkIdList *ptIds) VTK_OVERRIDE
  //   {vtkStructuredData::GetCellPoints(cellId,ptIds,this->DataDescription,
  //                                     this->GetDimensions());}
  // void GetPointCells(vtkIdType ptId, vtkIdList *cellIds) VTK_OVERRIDE
  //   {vtkStructuredData::GetPointCells(ptId,cellIds,this->GetDimensions());}
  // void ComputeBounds() VTK_OVERRIDE;
  // int GetMaxCellSize() VTK_OVERRIDE {return 8;}; //voxel is the largest

  publicAPI.getBounds = () =>
    publicAPI.extentToBounds(publicAPI.getSpatialExtent());

  publicAPI.extentToBounds = (ex) => {
    // prettier-ignore
    const corners = [
      ex[0], ex[2], ex[4],
      ex[1], ex[2], ex[4],
      ex[0], ex[3], ex[4],
      ex[1], ex[3], ex[4],
      ex[0], ex[2], ex[5],
      ex[1], ex[2], ex[5],
      ex[0], ex[3], ex[5],
      ex[1], ex[3], ex[5]];

    const idx = new Float64Array([corners[0], corners[1], corners[2]]);
    const vout = new Float64Array(3);
    publicAPI.indexToWorld(idx, vout);
    const bounds = [vout[0], vout[0], vout[1], vout[1], vout[2], vout[2]];
    for (let i = 3; i < 24; i += 3) {
      vec3.set(idx, corners[i], corners[i + 1], corners[i + 2]);
      publicAPI.indexToWorld(idx, vout);
      if (vout[0] < bounds[0]) {
        bounds[0] = vout[0];
      }
      if (vout[1] < bounds[2]) {
        bounds[2] = vout[1];
      }
      if (vout[2] < bounds[4]) {
        bounds[4] = vout[2];
      }
      if (vout[0] > bounds[1]) {
        bounds[1] = vout[0];
      }
      if (vout[1] > bounds[3]) {
        bounds[3] = vout[1];
      }
      if (vout[2] > bounds[5]) {
        bounds[5] = vout[2];
      }
    }

    return bounds;
  };

  publicAPI.getSpatialExtent = () => {
    const boundingBox = vtkBoundingBox.newInstance();
    boundingBox.setBounds(model.extent);
    boundingBox.inflate(0.5);
    return boundingBox.getBounds();
  };

  // Internal, shouldn't need to call this manually.
  publicAPI.computeTransforms = () => {
    mat4.fromTranslation(model.indexToWorld, model.origin);

    model.indexToWorld[0] = model.direction[0];
    model.indexToWorld[1] = model.direction[1];
    model.indexToWorld[2] = model.direction[2];

    model.indexToWorld[4] = model.direction[3];
    model.indexToWorld[5] = model.direction[4];
    model.indexToWorld[6] = model.direction[5];

    model.indexToWorld[8] = model.direction[6];
    model.indexToWorld[9] = model.direction[7];
    model.indexToWorld[10] = model.direction[8];

    mat4.scale(model.indexToWorld, model.indexToWorld, model.spacing);

    mat4.invert(model.worldToIndex, model.indexToWorld);
  };

  //
  // The direction matrix is a 3x3 basis for the I, J, K axes
  // of the image. The rows of the matrix correspond to the
  // axes directions in world coordinates. Direction must
  // form an orthonormal basis, results are undefined if
  // it is not.
  //
  publicAPI.setDirection = (...args) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return false;
    }

    let array = args;
    // allow an array passed as a single arg.
    if (
      array.length === 1 &&
      (Array.isArray(array[0]) ||
        array[0].constructor === Float32Array ||
        array[0].constructor === Float64Array)
    ) {
      array = array[0];
    }

    if (array.length !== 9) {
      throw new RangeError('Invalid number of values for array setter');
    }
    let changeDetected = false;
    model.direction.forEach((item, index) => {
      if (item !== array[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected) {
      for (let i = 0; i < 9; ++i) {
        model.direction[i] = array[i];
      }
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.indexToWorld = (ain, aout = []) => {
    vec3.transformMat4(aout, ain, model.indexToWorld);
    return aout;
  };
  publicAPI.indexToWorldVec3 = publicAPI.indexToWorld;

  publicAPI.worldToIndex = (ain, aout = []) => {
    vec3.transformMat4(aout, ain, model.worldToIndex);
    return aout;
  };
  publicAPI.worldToIndexVec3 = publicAPI.worldToIndex;

  publicAPI.indexToWorldBounds = (bin, bout = []) => {
    const in1 = [0, 0, 0];
    const in2 = [0, 0, 0];
    vtkBoundingBox.computeCornerPoints(bin, in1, in2);

    const out1 = [0, 0, 0];
    const out2 = [0, 0, 0];
    vec3.transformMat4(out1, in1, model.indexToWorld);
    vec3.transformMat4(out2, in2, model.indexToWorld);

    return vtkMath.computeBoundsFromPoints(out1, out2, bout);
  };

  publicAPI.worldToIndexBounds = (bin, bout = []) => {
    const in1 = [0, 0, 0];
    const in2 = [0, 0, 0];
    vtkBoundingBox.computeCornerPoints(bin, in1, in2);

    const out1 = [0, 0, 0];
    const out2 = [0, 0, 0];
    vec3.transformMat4(out1, in1, model.worldToIndex);
    vec3.transformMat4(out2, in2, model.worldToIndex);

    return vtkMath.computeBoundsFromPoints(out1, out2, bout);
  };

  // Make sure the transform is correct
  publicAPI.onModified(publicAPI.computeTransforms);
  publicAPI.computeTransforms();

  publicAPI.getCenter = () => {
    const bounds = publicAPI.getBounds();
    const center = [];

    for (let i = 0; i < 3; i++) {
      center[i] = (bounds[2 * i + 1] + bounds[2 * i]) / 2;
    }

    return center;
  };

  publicAPI.computeHistogram = (worldBounds, voxelFunc = null) => {
    const bounds = [0, 0, 0, 0, 0, 0];
    publicAPI.worldToIndexBounds(worldBounds, bounds);

    const point1 = [0, 0, 0];
    const point2 = [0, 0, 0];
    vtkBoundingBox.computeCornerPoints(bounds, point1, point2);

    vtkMath.roundVector(point1, point1);
    vtkMath.roundVector(point2, point2);

    const dimensions = publicAPI.getDimensions();

    vtkMath.clampVector(
      point1,
      [0, 0, 0],
      [dimensions[0] - 1, dimensions[1] - 1, dimensions[2] - 1],
      point1
    );
    vtkMath.clampVector(
      point2,
      [0, 0, 0],
      [dimensions[0] - 1, dimensions[1] - 1, dimensions[2] - 1],
      point2
    );

    const yStride = dimensions[0];
    const zStride = dimensions[0] * dimensions[1];

    const pixels = publicAPI.getPointData().getScalars().getData();

    let maximum = -Infinity;
    let minimum = Infinity;
    let sumOfSquares = 0;
    let isum = 0;
    let inum = 0;

    for (let z = point1[2]; z <= point2[2]; z++) {
      for (let y = point1[1]; y <= point2[1]; y++) {
        let index = point1[0] + y * yStride + z * zStride;
        for (let x = point1[0]; x <= point2[0]; x++) {
          if (!voxelFunc || voxelFunc([x, y, z], bounds)) {
            const pixel = pixels[index];

            if (pixel > maximum) maximum = pixel;
            if (pixel < minimum) minimum = pixel;
            sumOfSquares += pixel * pixel;
            isum += pixel;
            inum += 1;
          }

          ++index;
        }
      }
    }

    const average = inum > 0 ? isum / inum : 0;
    const variance = inum
      ? Math.abs(sumOfSquares / inum - average * average)
      : 0;
    const sigma = Math.sqrt(variance);

    return {
      minimum,
      maximum,
      average,
      variance,
      sigma,
      count: inum,
    };
  };

  // TODO: use the unimplemented `vtkDataSetAttributes` for scalar length, that is currently also a TODO (GetNumberOfComponents).
  // Scalar data could be tuples for color information?
  publicAPI.computeIncrements = (extent, numberOfComponents = 1) => {
    const increments = [];
    let incr = numberOfComponents;

    // Calculate array increment offsets
    // similar to c++ vtkImageData::ComputeIncrements
    for (let idx = 0; idx < 3; ++idx) {
      increments[idx] = incr;
      incr *= extent[idx * 2 + 1] - extent[idx * 2] + 1;
    }
    return increments;
  };

  /**
   * @param {Number[]} index the localized `[i,j,k]` pixel array position. Float values will be rounded.
   * @return {Number} the corresponding flattened index in the scalar array
   */
  publicAPI.computeOffsetIndex = ([i, j, k]) => {
    const extent = publicAPI.getExtent();
    const numberOfComponents = publicAPI
      .getPointData()
      .getScalars()
      .getNumberOfComponents();
    const increments = publicAPI.computeIncrements(extent, numberOfComponents);
    // Use the array increments to find the pixel index
    // similar to c++ vtkImageData::GetArrayPointer
    // Math.floor to catch "practically 0" e^-15 scenarios.
    return Math.floor(
      (Math.round(i) - extent[0]) * increments[0] +
        (Math.round(j) - extent[2]) * increments[1] +
        (Math.round(k) - extent[4]) * increments[2]
    );
  };

  /**
   * @param {Number[]} xyz the [x,y,z] Array in world coordinates
   * @return {Number|NaN} the corresponding pixel's index in the scalar array
   */
  publicAPI.getOffsetIndexFromWorld = (xyz) => {
    const extent = publicAPI.getExtent();
    const index = publicAPI.worldToIndex(xyz);

    // Confirm indexed i,j,k coords are within the bounds of the volume
    for (let idx = 0; idx < 3; ++idx) {
      if (index[idx] < extent[idx * 2] || index[idx] > extent[idx * 2 + 1]) {
        vtkErrorMacro(
          `GetScalarPointer: Pixel ${index} is not in memory. Current extent = ${extent}`
        );
        return NaN;
      }
    }

    // Assumed the index here is within 0 <-> scalarData.length, but doesn't hurt to check upstream
    return publicAPI.computeOffsetIndex(index);
  };
  /**
   * @param {Number[]} xyz the [x,y,z] Array in world coordinates
   * @param {Number?} comp the scalar component index for multi-component scalars
   * @return {Number|NaN} the corresponding pixel's scalar value
   */
  publicAPI.getScalarValueFromWorld = (xyz, comp = 0) => {
    const numberOfComponents = publicAPI
      .getPointData()
      .getScalars()
      .getNumberOfComponents();
    if (comp < 0 || comp >= numberOfComponents) {
      vtkErrorMacro(
        `GetScalarPointer: Scalar Component ${comp} is not within bounds. Current Scalar numberOfComponents: ${numberOfComponents}`
      );
      return NaN;
    }
    const offsetIndex = publicAPI.getOffsetIndexFromWorld(xyz);
    if (Number.isNaN(offsetIndex)) {
      // VTK Error Macro will have been tripped already, no need to do it again,
      return offsetIndex;
    }

    return publicAPI
      .getPointData()
      .getScalars()
      .getComponent(offsetIndex, comp);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  direction: null, // a mat3
  indexToWorld: null, // a mat4
  worldToIndex: null, // a mat4
  spacing: [1.0, 1.0, 1.0],
  origin: [0.0, 0.0, 0.0],
  extent: [0, -1, 0, -1, 0, -1],
  dataDescription: StructuredType.EMPTY,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model, initialValues);

  if (!model.direction) {
    model.direction = mat3.identity(new Float64Array(9));
  } else if (Array.isArray(model.direction)) {
    model.direction = new Float64Array(model.direction.slice(0, 9));
  }

  model.indexToWorld = new Float64Array(16);
  model.worldToIndex = new Float64Array(16);

  // Set/Get methods
  macro.get(publicAPI, model, ['direction', 'indexToWorld', 'worldToIndex']);
  macro.setGetArray(publicAPI, model, ['origin', 'spacing'], 3);
  macro.getArray(publicAPI, model, ['extent'], 6);

  // Object specific methods
  vtkImageData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
