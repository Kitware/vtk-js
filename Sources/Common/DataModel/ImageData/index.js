import macro from 'vtk.js/Sources/macro';
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
      return;
    }

    if (!inExtent || inExtent.length !== 6) {
      return;
    }

    let changeDetected = false;
    model.extent.forEach((item, index) => {
      if (item !== inExtent[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected) {
      model.extent = [].concat(inExtent);
      model.dataDescription = vtkStructuredData.getDataDescriptionFromExtent(
        model.extent
      );
      publicAPI.modified();
    }
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
    const ijk = vec3.fromValues(0, 0, 0);
    const coords = [0, 0, 0];

    if (dims[0] === 0 || dims[1] === 0 || dims[2] === 0) {
      vtkErrorMacro('Requesting a point from an empty image.');
      return null;
    }

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

    const vout = vec3.create();
    publicAPI.indexToWorldVec3(ijk, vout);
    vec3.copy(coords, vout);
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

  publicAPI.getBounds = () => publicAPI.extentToBounds(model.extent);

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

    const idx = vec3.fromValues(corners[0], corners[1], corners[2]);
    const vout = vec3.create();
    publicAPI.indexToWorldVec3(idx, vout);
    const bounds = [vout[0], vout[0], vout[1], vout[1], vout[2], vout[2]];
    for (let i = 3; i < 24; i += 3) {
      vec3.set(idx, corners[i], corners[i + 1], corners[i + 2]);
      publicAPI.indexToWorldVec3(idx, vout);
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

  publicAPI.computeTransforms = () => {
    const trans = vec3.fromValues(
      model.origin[0],
      model.origin[1],
      model.origin[2]
    );
    mat4.fromTranslation(model.indexToWorld, trans);

    model.indexToWorld[0] = model.direction[0];
    model.indexToWorld[1] = model.direction[1];
    model.indexToWorld[2] = model.direction[2];

    model.indexToWorld[4] = model.direction[3];
    model.indexToWorld[5] = model.direction[4];
    model.indexToWorld[6] = model.direction[5];

    model.indexToWorld[8] = model.direction[6];
    model.indexToWorld[9] = model.direction[7];
    model.indexToWorld[10] = model.direction[8];

    const scale = vec3.fromValues(
      model.spacing[0],
      model.spacing[1],
      model.spacing[2]
    );
    mat4.scale(model.indexToWorld, model.indexToWorld, scale);

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
    if (array.length === 1 && Array.isArray(array[0])) {
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

  // this is the fast version, requires vec3 arguments
  publicAPI.indexToWorldVec3 = (vin, vout) => {
    vec3.transformMat4(vout, vin, model.indexToWorld);
  };

  // slow version for generic arrays
  publicAPI.indexToWorld = (ain, aout) => {
    const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
    const vout = vec3.create();
    vec3.transformMat4(vout, vin, model.indexToWorld);
    vec3.copy(aout, vout);
  };

  // this is the fast version, requires vec3 arguments
  publicAPI.worldToIndexVec3 = (vin, vout) => {
    vec3.transformMat4(vout, vin, model.worldToIndex);
  };

  // slow version for generic arrays
  publicAPI.worldToIndex = (ain, aout) => {
    const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
    const vout = vec3.create();
    vec3.transformMat4(vout, vin, model.worldToIndex);
    vec3.copy(aout, vout);
  };

  // Make sure the transform is correct
  publicAPI.onModified(publicAPI.computeTransforms);
  publicAPI.computeTransforms();
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
    model.direction = mat3.create();
  } else if (Array.isArray(model.direction)) {
    const dvals = model.direction.slice(0);
    model.direction = mat3.create();
    for (let i = 0; i < 9; ++i) {
      model.direction[i] = dvals[i];
    }
  }

  model.indexToWorld = mat4.create();
  model.worldToIndex = mat4.create();

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
