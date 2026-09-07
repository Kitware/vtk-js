import * as macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import { getWebGPUContext } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/Context';

const { PrimitiveTypes } = vtkWebGPUBufferManager;

// ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUPolyDataMapper2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper2D');

  publicAPI.createCellArrayMapper = () =>
    vtkWebGPUCellArrayMapper.newInstance();

  publicAPI.transformInputData = (poly) => {
    const transformCoordinate = model.renderable.getTransformCoordinate();
    if (!transformCoordinate) {
      return poly;
    }

    const { renderer } = getWebGPUContext(publicAPI);
    const coreRenderer = renderer.getRenderable();
    const inputPoints = poly.getPoints();
    const points = vtkPoints.newInstance({
      dataType: inputPoints.getDataType(),
    });
    points.setNumberOfPoints(inputPoints.getNumberOfPoints());

    const point = [];
    for (let i = 0; i < inputPoints.getNumberOfPoints(); i++) {
      inputPoints.getPoint(i, point);
      transformCoordinate.setValue(point);
      const viewportPoint =
        transformCoordinate.getComputedDoubleViewportValue(coreRenderer);
      points.setPoint(i, viewportPoint[0], viewportPoint[1], 0);
    }

    const transformedPoly = vtkPolyData.newInstance();
    transformedPoly.shallowCopy(poly);
    transformedPoly.setPoints(points);
    return transformedPoly;
  };

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor2D');
      if (!model.renderable.getStatic()) {
        model.renderable.update();
      }

      const poly = model.renderable.getInputData();

      model.renderable.mapScalars(poly, 1.0);

      publicAPI.updateCellArrayMappers(publicAPI.transformInputData(poly));
    }
  };

  publicAPI.updateCellArrayMappers = (poly) => {
    const prims = [
      poly.getVerts(),
      poly.getLines(),
      poly.getPolys(),
      poly.getStrips(),
    ];

    // we instantiate a cell array mapper for each cellArray that has cells
    // and they handle the rendering of that cell array
    const cellMappers = [];
    let cellOffset = 0;
    for (let i = PrimitiveTypes.Points; i <= PrimitiveTypes.Triangles; i++) {
      if (prims[i].getNumberOfValues() > 0) {
        if (!model.primitives[i]) {
          model.primitives[i] = publicAPI.createCellArrayMapper();
        }
        const cellMapper = model.primitives[i];
        cellMapper.setCellArray(prims[i]);
        cellMapper.setCurrentInput(poly);
        cellMapper.setCellOffset(cellOffset);
        cellMapper.setPrimitiveType(i);
        cellMapper.setRenderable(model.renderable);
        cellMapper.setIs2D(true);
        cellOffset += prims[i].getNumberOfCells();
        cellMappers.push(cellMapper);
      } else {
        model.primitives[i] = null;
      }
    }

    publicAPI.prepareNodes();
    publicAPI.addMissingChildren(cellMappers);
    publicAPI.removeUnusedNodes();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return { primitives: [], ...initialValues };
}

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.primitives = [];

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
