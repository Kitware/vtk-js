import _defineProperty from '@babel/runtime/helpers/defineProperty';
import Constants from './StructuredData/Constants.js';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var StructuredType = Constants.StructuredType;

function getDataDescriptionFromExtent(inExt) {
  var dataDim = 0;

  for (var i = 0; i < 3; ++i) {
    if (inExt[i * 2] < inExt[i * 2 + 1]) {
      dataDim++;
    }
  }

  if (inExt[0] > inExt[1] || inExt[2] > inExt[3] || inExt[4] > inExt[5]) {
    return StructuredType.EMPTY;
  }

  if (dataDim === 3) {
    return StructuredType.XYZ_GRID;
  }

  if (dataDim === 2) {
    if (inExt[0] === inExt[1]) {
      return StructuredType.YZ_PLANE;
    }

    if (inExt[2] === inExt[3]) {
      return StructuredType.XZ_PLANE;
    }

    return StructuredType.XY_PLANE;
  }

  if (dataDim === 1) {
    if (inExt[0] < inExt[1]) {
      return StructuredType.X_LINE;
    }

    if (inExt[2] < inExt[3]) {
      return StructuredType.Y_LINE;
    }

    return StructuredType.Z_LINE;
  }

  return StructuredType.SINGLE_POINT;
}


function getDimensionsFromExtent(extent, dims) {

}


function getLocalStructuredCoordinates(ijk, extent, lijk) {

}


function computePointId(dim, ijk) {
  return (ijk[2]*(dim[1] + ijk[1])*dim[0] + ijk[0]);
}


function computePointIdForExtent(extent, ijk) {
 var ydim = (extent[3] - extent[2] + 1); 
 var xdim = (extent[1] - extent[0] + 1);
 return ((ijk[2] - extent[4])*ydim + (ijk[1] - extent[2]))*xdim + (ijk[0] - extent[0]);
}

var vtkStructuredData = _objectSpread({
  getDataDescriptionFromExtent: getDataDescriptionFromExtent,
  computePointId: computePointId,
  computePointIdForExtent: computePointIdForExtent,
}, Constants);

export { vtkStructuredData as default, getDataDescriptionFromExtent };
