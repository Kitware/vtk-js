import { describe, expect, it } from 'vitest';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUIndexBuffer from 'vtk.js/Sources/Rendering/WebGPU/IndexBuffer';

const { Representation } = vtkProperty;
const { PrimitiveTypes } = vtkWebGPUBufferManager;

function build(
  values,
  primitiveType,
  representation,
  cellOffset = 0,
  pointIds = true
) {
  const cells = vtkCellArray.newInstance({ values: Uint32Array.from(values) });
  const indexBuffer = vtkWebGPUIndexBuffer.newInstance();
  const req = {
    cells,
    numberOfPoints: 10,
    primitiveType,
    representation,
    cellOffset,
    pointIds,
  };
  indexBuffer.buildIndexBuffer(req);
  return { indexBuffer, req };
}

describe('vtkWebGPUIndexBuffer with point ids', () => {
  it('uses the point ids and needs no map for triangles', () => {
    const { indexBuffer, req } = build(
      [3, 0, 1, 2, 3, 2, 1, 3],
      PrimitiveTypes.Triangles,
      Representation.SURFACE,
      5
    );
    expect(Array.from(req.nativeArray)).toEqual([0, 1, 2, 2, 1, 3]);
    expect(req.format).toBe('uint16');
    expect(indexBuffer.getIndexCount()).toBe(6);
    expect(indexBuffer.getFlatSize()).toBe(10);
    expect(indexBuffer.getFlatIdToPointId()).toBe(null);
    expect(indexBuffer.getPrimitiveToCellId()).toBe(null);
  });

  it('maps the triangles of a polygon to its global cell id', () => {
    const { indexBuffer, req } = build(
      [3, 0, 1, 2, 4, 3, 4, 5, 6],
      PrimitiveTypes.Triangles,
      Representation.SURFACE,
      2
    );
    expect(Array.from(req.nativeArray)).toEqual([0, 1, 2, 3, 4, 5, 3, 5, 6]);
    expect(Array.from(indexBuffer.getPrimitiveToCellId())).toEqual([2, 3, 3]);
  });

  it('maps the edges of a wireframe to their cells', () => {
    const { indexBuffer, req } = build(
      [3, 0, 1, 2],
      PrimitiveTypes.Triangles,
      Representation.WIREFRAME,
      1
    );
    expect(Array.from(req.nativeArray)).toEqual([0, 1, 1, 2, 2, 0]);
    expect(Array.from(indexBuffer.getPrimitiveToCellId())).toEqual([1, 1, 1]);
  });

  it('maps the segments of a polyline to its cell', () => {
    const { indexBuffer, req } = build(
      [2, 0, 1, 3, 1, 2, 3],
      PrimitiveTypes.Lines,
      Representation.SURFACE
    );
    expect(Array.from(req.nativeArray)).toEqual([0, 1, 1, 2, 2, 3]);
    expect(Array.from(indexBuffer.getPrimitiveToCellId())).toEqual([0, 1, 1]);
  });

  it('gives one primitive for each point of a vertex cell', () => {
    const { indexBuffer, req } = build(
      [1, 4, 1, 7],
      PrimitiveTypes.Points,
      Representation.SURFACE,
      3
    );
    expect(Array.from(req.nativeArray)).toEqual([4, 7]);
    expect(indexBuffer.getPrimitiveToCellId()).toBe(null);
  });
});

describe('vtkWebGPUIndexBuffer flat path', () => {
  it('gives each cell a provoking vertex with its global cell id', () => {
    // Two triangles that share the edge 1-2.
    const { indexBuffer, req } = build(
      [3, 0, 1, 2, 3, 2, 1, 3],
      PrimitiveTypes.Triangles,
      Representation.SURFACE,
      5,
      false
    );
    const ibo = Array.from(req.nativeArray);
    const flatToPoint = indexBuffer.getFlatIdToPointId();
    const flatToCell = indexBuffer.getFlatIdToCellId();
    expect(indexBuffer.getPrimitiveToCellId()).toBe(null);
    expect(ibo).toHaveLength(6);
    // The index values give back the point ids of each triangle.
    expect(
      ibo
        .slice(0, 3)
        .map((f) => flatToPoint[f])
        .sort()
    ).toEqual([0, 1, 2]);
    expect(
      ibo
        .slice(3, 6)
        .map((f) => flatToPoint[f])
        .sort()
    ).toEqual([1, 2, 3]);
    // The first vertex of each triangle provokes its global cell id.
    expect(flatToCell[ibo[0]]).toBe(5);
    expect(flatToCell[ibo[3]]).toBe(6);
  });
});
