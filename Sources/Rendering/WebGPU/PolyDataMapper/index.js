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

  // Hooks for the 2D mapper: the type of the actor view node, the opacity
  // that the scalar colors get, the input that the cell mappers draw, and
  // the setup of each cell mapper.
  publicAPI.getScalarOpacity = () => 1.0;
  publicAPI.getRenderInput = (poly) => poly;
  publicAPI.setUpCellArrayMapper = (cellMapper) => {};

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType(
        model.actorClassName
      );
      if (!model.renderable.getStatic()) {
        model.renderable.update();
      }

      const poly = model.renderable.getInputData();
      if (!poly) {
        vtkErrorMacro('No input!');
        return;
      }

      model.renderable.mapScalars(poly, publicAPI.getScalarOpacity());

      publicAPI.updateCellArrayMappers(publicAPI.getRenderInput(poly));
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
    const useCellArrayMapper = (primType, cellArray, cellOffset) => {
      if (!model.primitives[primType]) {
        model.primitives[primType] = publicAPI.createCellArrayMapper();
      }
      const cellMapper = model.primitives[primType];
      cellMapper.setCellArray(cellArray);
      cellMapper.setCurrentInput(poly);
      cellMapper.setCellOffset(cellOffset);
      cellMapper.setPrimitiveType(primType);
      cellMapper.setRenderable(model.renderable);
      publicAPI.setUpCellArrayMapper(cellMapper);
      cellMappers.push(cellMapper);
    };

    let cellOffset = 0;
    for (
      let i = PrimitiveTypes.Points;
      i <= PrimitiveTypes.TriangleStrips;
      i++
    ) {
      if (prims[i].getNumberOfValues() > 0) {
        useCellArrayMapper(i, prims[i], cellOffset);
        cellOffset += prims[i].getNumberOfCells();
      } else {
        model.primitives[i] = null;
      }
    }

    // The edges of triangles and strips use the cells and the cell offset
    // of their surface. vtkProperty2D has no edge visibility.
    const property = model.WebGPUActor.getRenderable().getProperty();
    if (property.getEdgeVisibility?.()) {
      const edgeTypes = [
        [PrimitiveTypes.Triangles, PrimitiveTypes.TriangleEdges],
        [PrimitiveTypes.TriangleStrips, PrimitiveTypes.TriangleStripEdges],
      ];
      edgeTypes.forEach(([surfaceType, edgeType]) => {
        if (prims[surfaceType].getNumberOfValues() > 0) {
          useCellArrayMapper(
            edgeType,
            prims[surfaceType],
            model.primitives[surfaceType].getCellOffset()
          );
        } else {
          model.primitives[edgeType] = null;
        }
      });
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
  actorClassName: 'vtkWebGPUActor',
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
