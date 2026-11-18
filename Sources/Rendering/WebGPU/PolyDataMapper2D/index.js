import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper2D methods
// ----------------------------------------------------------------------------

function vtkWebGPUPolyDataMapper2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper2D');

  // The scalar colors get the opacity of the property, as in the OpenGL
  // backend.
  publicAPI.getScalarOpacity = () =>
    model.WebGPUActor.getRenderable().getProperty().getOpacity();

  publicAPI.setUpCellArrayMapper = (cellMapper) => {
    cellMapper.setIs2D(true);
  };

  // With a transform coordinate, each point goes through it to viewport
  // pixels, as in the OpenGL backend. The result is kept until the input,
  // the coordinate, the renderer or the viewport size changes.
  publicAPI.getRenderInput = (poly) => {
    const transformCoordinate = model.renderable.getTransformCoordinate();
    if (!transformCoordinate) {
      model.transformedInput = null;
      return poly;
    }
    const wgpuRen = publicAPI.getFirstAncestorOfType('vtkWebGPURenderer');
    const ren = wgpuRen.getRenderable();
    const tsize = wgpuRen.getTiledSizeAndOrigin();
    const key =
      `${poly.getMTime()}_${transformCoordinate.getMTime()}_` +
      `${ren.getMTime()}_${tsize.usize}_${tsize.vsize}`;
    if (model.transformedInput && model.transformedInputKey === key) {
      return model.transformedInput;
    }

    const points = poly.getPoints();
    const numPts = points.getNumberOfPoints();
    const values = new Float32Array(numPts * 3);
    const point = [];
    for (let i = 0; i < numPts; ++i) {
      points.getPoint(i, point);
      transformCoordinate.setValue(point);
      const v = transformCoordinate.getComputedDoubleViewportValue(ren);
      values[i * 3] = v[0];
      values[i * 3 + 1] = v[1];
    }
    const transformedPoints = vtkPoints.newInstance();
    transformedPoints.setData(values, 3);

    const transformed = vtkPolyData.newInstance();
    transformed.shallowCopy(poly);
    transformed.setPoints(transformedPoints);
    model.transformedInput = transformed;
    model.transformedInputKey = key;
    return transformed;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return { actorClassName: 'vtkWebGPUActor2D', ...initialValues };
}

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  // Inheritance
  vtkWebGPUPolyDataMapper.extend(
    publicAPI,
    model,
    defaultValues(initialValues)
  );

  // Object methods
  vtkWebGPUPolyDataMapper2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUPolyDataMapper2D'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkMapper2D', newInstance);
