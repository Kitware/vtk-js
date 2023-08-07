import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import macro from '../../macros.js';
import { b as roundVector, c as clampVector } from '../Core/Math/index.js';
import vtkBoundingBox from './BoundingBox.js';
import vtkDataSet from './DataSet.js';
import vtkStructuredData from './StructuredData.js';
import { StructuredType } from './StructuredData/Constants.js';
import { mat3, mat4, vec3 } from 'gl-matrix';

var vtkErrorMacro = macro.vtkErrorMacro; // ----------------------------------------------------------------------------
// vtkImageData methods
// ----------------------------------------------------------------------------

function vtkImageData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageData');

  publicAPI.setExtent = function () {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return false;
    }

    for (var _len = arguments.length, inExtent = new Array(_len), _key = 0; _key < _len; _key++) {
      inExtent[_key] = arguments[_key];
    }

    var extentArray = inExtent.length === 1 ? inExtent[0] : inExtent;

    if (extentArray.length !== 6) {
      return false;
    }

    var changeDetected = model.extent.some(function (item, index) {
      return item !== extentArray[index];
    });

    if (changeDetected) {
      model.extent = extentArray.slice();
      model.dataDescription = vtkStructuredData.getDataDescriptionFromExtent(model.extent);
      publicAPI.modified();
    }

    return changeDetected;
  };

  publicAPI.computePointId = function (ijk) {
    return vtkStructuredData.computePointIdForExtent(model.extent, ijk);
  }

  publicAPI.setDimensions = function () {
    var i;
    var j;
    var k;

    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }

    if (arguments.length === 1) {
      var array = arguments.length <= 0 ? undefined : arguments[0];
      i = array[0];
      j = array[1];
      k = array[2];
    } else if (arguments.length === 3) {
      i = arguments.length <= 0 ? undefined : arguments[0];
      j = arguments.length <= 1 ? undefined : arguments[1];
      k = arguments.length <= 2 ? undefined : arguments[2];
    } else {
      vtkErrorMacro('Bad dimension specification');
      return;
    }

    publicAPI.setExtent(0, i - 1, 0, j - 1, 0, k - 1);
  };

  publicAPI.getDimensions = function () {
    return [model.extent[1] - model.extent[0] + 1, model.extent[3] - model.extent[2] + 1, model.extent[5] - model.extent[4] + 1];
  };

  publicAPI.getNumberOfCells = function () {
    var dims = publicAPI.getDimensions();
    var nCells = 1;

    for (var i = 0; i < 3; i++) {
      if (dims[i] === 0) {
        return 0;
      }

      if (dims[i] > 1) {
        nCells *= dims[i] - 1;
      }
    }

    return nCells;
  };

  publicAPI.getNumberOfPoints = function () {
    var dims = publicAPI.getDimensions();
    return dims[0] * dims[1] * dims[2];
  };

  publicAPI.getPoint = function (index) {
    var dims = publicAPI.getDimensions();

    if (dims[0] === 0 || dims[1] === 0 || dims[2] === 0) {
      vtkErrorMacro('Requesting a point from an empty image.');
      return null;
    }

    var ijk = new Float64Array(3);

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
        ijk[1] = index / dims[0] % dims[1];
        ijk[2] = index / (dims[0] * dims[1]);
        break;

      default:
        vtkErrorMacro('Invalid dataDescription');
        break;
    }

    var coords = [0, 0, 0];
    publicAPI.indexToWorld(ijk, coords);
    return coords;
  };
  
  publicAPI.getScalarType = function () {
    var scalars = publicAPI.getPointData().getScalars(); 
    
    if (!scalars) {
      return Number.MAX_VALUE
    }

    return scalars.getDataType();
  }
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

  publicAPI.getNumberOfScalarComponents = function () {
    let scalars = publicAPI.getPointData().getScalars();
    if (scalars)
    {
      return scalars.getNumberOfComponents();
    }
    return 1;
  }

  publicAPI.getBounds = function () {
    return publicAPI.extentToBounds(publicAPI.getSpatialExtent());
  };

  publicAPI.extentToBounds = function (ex) {
    return vtkBoundingBox.transformBounds(ex, model.indexToWorld);
  };

  publicAPI.getSpatialExtent = function () {
    return vtkBoundingBox.inflate(_toConsumableArray(model.extent), 0.5);
  }; // Internal, shouldn't need to call this manually.


  publicAPI.computeTransforms = function () {
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

  publicAPI.indexToWorld = function (ain) {
    var aout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    vec3.transformMat4(aout, ain, model.indexToWorld);
    return aout;
  };

  publicAPI.indexToWorldVec3 = publicAPI.indexToWorld;

  publicAPI.worldToIndex = function (ain) {
    var aout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    vec3.transformMat4(aout, ain, model.worldToIndex);
    return aout;
  };

  publicAPI.worldToIndexVec3 = publicAPI.worldToIndex;

  publicAPI.indexToWorldBounds = function (bin) {
    var bout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    return vtkBoundingBox.transformBounds(bin, model.indexToWorld, bout);
  };

  publicAPI.worldToIndexBounds = function (bin) {
    var bout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    return vtkBoundingBox.transformBounds(bin, model.worldToIndex, bout);
  }; // Make sure the transform is correct


  publicAPI.onModified(publicAPI.computeTransforms);
  publicAPI.computeTransforms();

  publicAPI.getCenter = function () {
    return vtkBoundingBox.getCenter(publicAPI.getBounds());
  };

  publicAPI.getPointGradient = function(i, j, k, s, g) {
    var ar = model.spacing;
    var sp, sm;
    var extent = model.extent;
  
    var dims = publicAPI.getDimensions();
    var ijsize = dims[0] * dims[1];
  
    // Adjust i,j,k to the start of the extent
    i -= extent[0];
    j -= extent[2];
    k -= extent[4];
  
    // Check for out-of-bounds
    if (i < 0 || i >= dims[0] || j < 0 || j >= dims[1] || k < 0 || k >= dims[2])
    {
      g[0] = g[1] = g[2] = 0.0;
      return;
    }
  
    // i-axis
    if (dims[0] == 1)
    {
      g[0] = 0.0;
    }
    else if (i == 0)
    {
      sp = s.getComponent(i + 1 + j * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      g[0] = (sm - sp) / ar[0];
    }
    else if (i == (dims[0] - 1))
    {
      sp = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i - 1 + j * dims[0] + k * ijsize, 0);
      g[0] = (sm - sp) / ar[0];
    }
    else
    {
      sp = s.getComponent(i + 1 + j * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i - 1 + j * dims[0] + k * ijsize, 0);
      g[0] = 0.5 * (sm - sp) / ar[0];
    }
  
    // j-axis
    if (dims[1] == 1)
    {
      g[1] = 0.0;
    }
    else if (j == 0)
    {
      sp = s.getComponent(i + (j + 1) * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      g[1] = (sm - sp) / ar[1];
    }
    else if (j == (dims[1] - 1))
    {
      sp = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i + (j - 1) * dims[0] + k * ijsize, 0);
      g[1] = (sm - sp) / ar[1];
    }
    else
    {
      sp = s.getComponent(i + (j + 1) * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i + (j - 1) * dims[0] + k * ijsize, 0);
      g[1] = 0.5 * (sm - sp) / ar[1];
    }
  
    // k-axis
    if (dims[2] == 1)
    {
      g[2] = 0.0;
    }
    else if (k == 0)
    {
      sp = s.getComponent(i + j * dims[0] + (k + 1) * ijsize, 0);
      sm = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      g[2] = (sm - sp) / ar[2];
    }
    else if (k == (dims[2] - 1))
    {
      sp = s.getComponent(i + j * dims[0] + k * ijsize, 0);
      sm = s.getComponent(i + j * dims[0] + (k - 1) * ijsize, 0);
      g[2] = (sm - sp) / ar[2];
    }
    else
    {
      sp = s.getComponent(i + j * dims[0] + (k + 1) * ijsize, 0);
      sm = s.getComponent(i + j * dims[0] + (k - 1) * ijsize, 0);
      g[2] = 0.5 * (sm - sp) / ar[2];
    }
    
      // Apply direction transform to get in xyz coordinate system
      // Note: we already applied the spacing when handling the ijk
      // axis above, and do not need to translate by the origin
      // since this is a gradient computation
      /// ???
      // this->DirectionMatrix->MultiplyPoint(g, g);
  }

  publicAPI.getVoxelGradient = function (i, j, k, s, g) {
    var gv = new Array(3);
    var idx = 0;

    for (var kk = 0; kk < 2; kk++)
    {
      for (var jj = 0; jj < 2; jj++)
      {
        for (var ii = 0; ii < 2; ii++)
        {
          publicAPI.getPointGradient(i + ii, j + jj, k + kk, s, gv);
          g.setTuple(idx++, gv);
        }
      }
    }
  }

  publicAPI.computeHistogram = function (worldBounds) {
    var voxelFunc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var bounds = [0, 0, 0, 0, 0, 0];
    publicAPI.worldToIndexBounds(worldBounds, bounds);
    var point1 = [0, 0, 0];
    var point2 = [0, 0, 0];
    vtkBoundingBox.computeCornerPoints(bounds, point1, point2);
    roundVector(point1, point1);
    roundVector(point2, point2);
    var dimensions = publicAPI.getDimensions();
    clampVector(point1, [0, 0, 0], [dimensions[0] - 1, dimensions[1] - 1, dimensions[2] - 1], point1);
    clampVector(point2, [0, 0, 0], [dimensions[0] - 1, dimensions[1] - 1, dimensions[2] - 1], point2);
    var yStride = dimensions[0];
    var zStride = dimensions[0] * dimensions[1];
    var pixels = publicAPI.getPointData().getScalars().getData();
    var maximum = -Infinity;
    var minimum = Infinity;
    var sumOfSquares = 0;
    var isum = 0;
    var inum = 0;

    for (var z = point1[2]; z <= point2[2]; z++) {
      for (var y = point1[1]; y <= point2[1]; y++) {
        var index = point1[0] + y * yStride + z * zStride;

        for (var x = point1[0]; x <= point2[0]; x++) {
          if (!voxelFunc || voxelFunc([x, y, z], bounds)) {
            var pixel = pixels[index];
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

    var average = inum > 0 ? isum / inum : 0;
    var variance = inum ? Math.abs(sumOfSquares / inum - average * average) : 0;
    var sigma = Math.sqrt(variance);
    return {
      minimum: minimum,
      maximum: maximum,
      average: average,
      variance: variance,
      sigma: sigma,
      count: inum
    };
  }; // TODO: use the unimplemented `vtkDataSetAttributes` for scalar length, that is currently also a TODO (GetNumberOfComponents).
  // Scalar data could be tuples for color information?


  publicAPI.computeIncrements = function (extent) {
    var numberOfComponents = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var increments = [];
    var incr = numberOfComponents; // Calculate array increment offsets
    // similar to c++ vtkImageData::ComputeIncrements

    for (var idx = 0; idx < 3; ++idx) {
      increments[idx] = incr;
      incr *= extent[idx * 2 + 1] - extent[idx * 2] + 1;
    }

    return increments;
  };
  /**
   * @param {Number[]} index the localized `[i,j,k]` pixel array position. Float values will be rounded.
   * @return {Number} the corresponding flattened index in the scalar array
   */


  publicAPI.computeOffsetIndex = function (_ref) {
    var _ref2 = _slicedToArray(_ref, 3),
        i = _ref2[0],
        j = _ref2[1],
        k = _ref2[2];

    var extent = publicAPI.getExtent();
    var numberOfComponents = publicAPI.getPointData().getScalars().getNumberOfComponents();
    var increments = publicAPI.computeIncrements(extent, numberOfComponents); // Use the array increments to find the pixel index
    // similar to c++ vtkImageData::GetArrayPointer
    // Math.floor to catch "practically 0" e^-15 scenarios.

    return Math.floor((Math.round(i) - extent[0]) * increments[0] + (Math.round(j) - extent[2]) * increments[1] + (Math.round(k) - extent[4]) * increments[2]);
  };
  /**
   * @param {Number[]} xyz the [x,y,z] Array in world coordinates
   * @return {Number|NaN} the corresponding pixel's index in the scalar array
   */


  publicAPI.getOffsetIndexFromWorld = function (xyz) {
    var extent = publicAPI.getExtent();
    var index = publicAPI.worldToIndex(xyz); // Confirm indexed i,j,k coords are within the bounds of the volume

    for (var idx = 0; idx < 3; ++idx) {
      if (index[idx] < extent[idx * 2] || index[idx] > extent[idx * 2 + 1]) {
        vtkErrorMacro("GetScalarPointer: Pixel ".concat(index, " is not in memory. Current extent = ").concat(extent));
        return NaN;
      }
    } // Assumed the index here is within 0 <-> scalarData.length, but doesn't hurt to check upstream


    return publicAPI.computeOffsetIndex(index);
  };
  /**
   * @param {Number[]} xyz the [x,y,z] Array in world coordinates
   * @param {Number?} comp the scalar component index for multi-component scalars
   * @return {Number|NaN} the corresponding pixel's scalar value
   */


  publicAPI.getScalarValueFromWorld = function (xyz) {
    var comp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var numberOfComponents = publicAPI.getPointData().getScalars().getNumberOfComponents();

    if (comp < 0 || comp >= numberOfComponents) {
      vtkErrorMacro("GetScalarPointer: Scalar Component ".concat(comp, " is not within bounds. Current Scalar numberOfComponents: ").concat(numberOfComponents));
      return NaN;
    }

    var offsetIndex = publicAPI.getOffsetIndexFromWorld(xyz);

    if (Number.isNaN(offsetIndex)) {
      // VTK Error Macro will have been tripped already, no need to do it again,
      return offsetIndex;
    }

    return publicAPI.getPointData().getScalars().getComponent(offsetIndex, comp);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {
  direction: null,
  // a mat3
  indexToWorld: null,
  // a mat4
  worldToIndex: null,
  // a mat4
  spacing: [1.0, 1.0, 1.0],
  origin: [0.0, 0.0, 0.0],
  extent: [0, -1, 0, -1, 0, -1],
  dataDescription: StructuredType.EMPTY
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Inheritance

  vtkDataSet.extend(publicAPI, model, initialValues);

  if (!model.direction) {
    model.direction = mat3.identity(new Float64Array(9));
  } else if (Array.isArray(model.direction)) {
    model.direction = new Float64Array(model.direction.slice(0, 9));
  }

  model.indexToWorld = new Float64Array(16);
  model.worldToIndex = new Float64Array(16); // Set/Get methods

  macro.get(publicAPI, model, ['indexToWorld', 'worldToIndex']);
  macro.setGetArray(publicAPI, model, ['origin', 'spacing'], 3);
  macro.setGetArray(publicAPI, model, ['direction'], 9);
  macro.getArray(publicAPI, model, ['extent'], 6); // Object specific methods

  vtkImageData(publicAPI, model);
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkImageData'); // ----------------------------------------------------------------------------

var vtkImageData$1 = {
  newInstance: newInstance,
  extend: extend
};

export { vtkImageData$1 as default, extend, newInstance };
