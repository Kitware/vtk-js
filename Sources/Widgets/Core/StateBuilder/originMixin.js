import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { getPixelWorldHeightAtCoord } from 'vtk.js/Sources/Widgets/Core/WidgetManager';

// ----------------------------------------------------------------------------

function vtkOriginMixin(publicAPI, model) {
  const superClass = { ...publicAPI };
  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getOriginByReference();
    publicAPI.setOrigin(x + dx, y + dy, z + dz);
  };
  publicAPI.getOrigin = (displayScaleParams) => {
    const origin = superClass.getOrigin();
    if (!model.offset) {
      return origin;
    }
    if (!displayScaleParams) {
      return vtkMath.add(origin, model.offset, origin);
    }
    const pixelWorldHeight = getPixelWorldHeightAtCoord(
      origin,
      displayScaleParams
    );
    const { rendererPixelDims } = displayScaleParams;
    const totalSize = Math.min(rendererPixelDims[0], rendererPixelDims[1]);
    return vtkMath.multiplyAccumulate(
      origin,
      model.offset,
      totalSize * pixelWorldHeight,
      origin
    );
  };
}

// ----------------------------------------------------------------------------
/**
 * offset: optional offset that can be scaled to pixel screen space.
 */
const DEFAULT_VALUES = {
  origin: null,
  offset: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['origin', 'offset'], 3);
  vtkOriginMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
