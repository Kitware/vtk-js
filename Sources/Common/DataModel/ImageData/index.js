import * as macro from '../../../macro';
import vtkDataSet from '../DataSet';
import { VTK_STRUCTURED_TYPE } from '../StructuredData';

// ----------------------------------------------------------------------------
// vtkImageData methods
// ----------------------------------------------------------------------------

function vtkImageData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageData');

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

  // double *GetPoint(vtkIdType ptId) VTK_OVERRIDE;
  // void GetPoint(vtkIdType id, double x[3]) VTK_OVERRIDE;
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

  publicAPI.getBounds = () => {
    const res = [];
    res[0] = model.origin[0] + (model.extent[0] * model.spacing[0]);
    res[1] = model.origin[0] + (model.extent[1] * model.spacing[0]);
    res[2] = model.origin[1] + (model.extent[2] * model.spacing[1]);
    res[3] = model.origin[1] + (model.extent[3] * model.spacing[1]);
    res[4] = model.origin[2] + (model.extent[4] * model.spacing[2]);
    res[5] = model.origin[2] + (model.extent[5] * model.spacing[2]);
    return res;
  };

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = macro.shallowCopyBuilder(model, newInstance);
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
  macro.setGetArray(publicAPI, model, ['extent'], 6);

  // Object specific methods
  vtkImageData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
