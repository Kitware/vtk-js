import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

import { vtkErrorMacro } from 'vtk.js/Sources/macros';

const { PrimitiveTypes } = vtkWebGPUBufferManager;

// ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper');

  publicAPI.createCellArrayMapper = () =>
    vtkWebGPUCellArrayMapper.newInstance();

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      if (!model.renderable.getStatic()) {
        model.renderable.update();
      }

      const poly = model.renderable.getInputData();

      model.renderable.mapScalars(poly, 1.0);

      publicAPI.updateCellArrayMappers(poly);
    }
  };

  publicAPI.updateCellArrayMappers = (poly) => {
    if (!poly) {
      vtkErrorMacro('No input!');
      return;
    }

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
    // Handle all primitive types including strips
    for (
      let i = PrimitiveTypes.Points;
      i <= PrimitiveTypes.TriangleStrips;
      i++
    ) {
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
        cellOffset += prims[i].getNumberOfCells();
        cellMappers.push(cellMapper);
      } else {
        model.primitives[i] = null;
      }
    }

    // Handle edge visibility for both triangles and triangle strips
    if (model.WebGPUActor.getRenderable().getProperty().getEdgeVisibility()) {
      // Handle triangle edges
      if (prims[PrimitiveTypes.Triangles].getNumberOfValues() > 0) {
        const i = PrimitiveTypes.TriangleEdges;
        if (!model.primitives[i]) {
          model.primitives[i] = publicAPI.createCellArrayMapper();
        }
        const cellMapper = model.primitives[i];
        cellMapper.setCellArray(prims[PrimitiveTypes.Triangles]);
        cellMapper.setCurrentInput(poly);
        cellMapper.setCellOffset(
          model.primitives[PrimitiveTypes.Triangles].getCellOffset()
        );
        cellMapper.setPrimitiveType(i);
        cellMapper.setRenderable(model.renderable);
        cellMappers.push(cellMapper);
      } else {
        model.primitives[PrimitiveTypes.TriangleEdges] = null;
      }

      // Handle triangle strip edges
      if (prims[PrimitiveTypes.TriangleStrips].getNumberOfValues() > 0) {
        const i = PrimitiveTypes.TriangleStripEdges;
        if (!model.primitives[i]) {
          model.primitives[i] = publicAPI.createCellArrayMapper();
        }
        const cellMapper = model.primitives[i];
        cellMapper.setCellArray(prims[PrimitiveTypes.TriangleStrips]);
        cellMapper.setCurrentInput(poly);
        cellMapper.setCellOffset(
          model.primitives[PrimitiveTypes.TriangleStrips].getCellOffset()
        );
        cellMapper.setPrimitiveType(i);
        cellMapper.setRenderable(model.renderable);
        cellMappers.push(cellMapper);
      } else {
        model.primitives[PrimitiveTypes.TriangleStripEdges] = null;
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

const DEFAULT_VALUES = {
  primitives: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.primitives = [];

  // Object methods
  vtkWebGPUPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkMapper', newInstance);
