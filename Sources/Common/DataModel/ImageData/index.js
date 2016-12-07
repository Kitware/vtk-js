import * as macro from '../../../macro';
import vtkDataSet from '../DataSet';
import vtkStructuredData from '../StructuredData';
import { VTK_STRUCTURED_TYPE } from '../StructuredData/Constants';

// ----------------------------------------------------------------------------
// vtkImageData methods
// ----------------------------------------------------------------------------

function vtkImageData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageData');

  publicAPI.setExtent = (...inExtent) => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
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
      model.dataDescription = vtkStructuredData.getDataDescriptionFromExtent(model.extent);
      publicAPI.modified();
    }
  };

  publicAPI.setDimensions = (i, j, k) => publicAPI.setExtent(0, i - 1, 0, j - 1, 0, k - 1);

  publicAPI.getDimensions = () => [
    (model.extent[1] - model.extent[0]) + 1,
    (model.extent[3] - model.extent[2]) + 1,
    (model.extent[5] - model.extent[4]) + 1,
  ];

  publicAPI.getNumberOfCells = () => {
    const dims = publicAPI.getDimensions();
    let nCells = 1;

    for (let i = 0; i < 3; i++) {
      if (dims[i] === 0) {
        return 0;
      }
      if (dims[i] > 1) {
        nCells *= (dims[i] - 1);
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
    const ijk = [0, 0, 0];
    const coords = [0, 0, 0];

    if (dims[0] === 0 || dims[1] === 0 || dims[2] === 0) {
      vtkErrorMacro('Requesting a point from an empty image.');
      return null;
    }

    switch (model.dataDescription) {
      case VTK_STRUCTURED_TYPE.VTK_EMPTY:
        return null;

      case VTK_STRUCTURED_TYPE.VTK_SINGLE_POINT:
        break;

      case VTK_STRUCTURED_TYPE.VTK_X_LINE:
        ijk[0] = index;
        break;

      case VTK_STRUCTURED_TYPE.VTK_Y_LINE:
        ijk[1] = index;
        break;

      case VTK_STRUCTURED_TYPE.VTK_Z_LINE:
        ijk[2] = index;
        break;

      case VTK_STRUCTURED_TYPE.VTK_XY_PLANE:
        ijk[0] = index % dims[0];
        ijk[1] = index / dims[0];
        break;

      case VTK_STRUCTURED_TYPE.VTK_YZ_PLANE:
        ijk[1] = index % dims[1];
        ijk[2] = index / dims[1];
        break;

      case VTK_STRUCTURED_TYPE.VTK_XZ_PLANE:
        ijk[0] = index % dims[0];
        ijk[2] = index / dims[0];
        break;

      case VTK_STRUCTURED_TYPE.VTK_XYZ_GRID:
        ijk[0] = index % dims[0];
        ijk[1] = (index / dims[0]) % dims[1];
        ijk[2] = index / (dims[0] * dims[1]);
        break;

      default:
        vtkErrorMacro('Invalid dataDescription');
        break;
    }

    for (let i = 0; i < 3; i++) {
      coords[i] = model.origin[i] + ((ijk[i] + model.extent[i * 2]) * model.spacing[i]);
    }

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

  publicAPI.getBounds = () => [
    model.origin[0] + (model.extent[0] * model.spacing[0]),
    model.origin[0] + (model.extent[1] * model.spacing[0]),
    model.origin[1] + (model.extent[2] * model.spacing[1]),
    model.origin[1] + (model.extent[3] * model.spacing[1]),
    model.origin[2] + (model.extent[4] * model.spacing[2]),
    model.origin[2] + (model.extent[5] * model.spacing[2]),
  ];

  /* eslint-disable no-use-before-define */
  publicAPI.createShallowCopy = macro.createShallowCopyBuilder(model, newInstance);
  /* eslint-enable no-use-before-define */
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  spacing: [1.0, 1.0, 1.0],
  origin: [0.0, 0.0, 0.0],
  extent: [0, -1, 0, -1, 0, -1],
  dataDescription: VTK_STRUCTURED_TYPE.VTK_EMPTY,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model, initialValues);

  // Set/Get methods
  macro.setGetArray(publicAPI, model, ['origin', 'spacing'], 3);
  macro.getArray(publicAPI, model, ['extent'], 6);

  // Object specific methods
  vtkImageData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
