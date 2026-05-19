import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';

const { FieldAssociations } = vtkDataSet;
const { BufferUsage, PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
const { ScalarMode, ColorMode } = vtkMapper;

export function getUsage(rep, i) {
  if (rep === Representation.POINTS || i === PrimitiveTypes.Points) {
    return BufferUsage.Verts;
  }

  if (i === PrimitiveTypes.Lines) {
    return BufferUsage.Lines;
  }

  if (rep === Representation.WIREFRAME) {
    if (i === PrimitiveTypes.Triangles) {
      return BufferUsage.LinesFromTriangles;
    }
    return BufferUsage.LinesFromStrips;
  }

  if (i === PrimitiveTypes.Triangles) {
    return BufferUsage.Triangles;
  }

  if (i === PrimitiveTypes.TriangleStrips) {
    return BufferUsage.Strips;
  }

  if (i === PrimitiveTypes.TriangleEdges) {
    return BufferUsage.LinesFromTriangles;
  }

  // only strip edges left which are lines
  return BufferUsage.LinesFromStrips;
}

export function getHashFromUsage(usage) {
  return `pt${usage}`;
}

export function getTopologyFromUsage(usage) {
  switch (usage) {
    case BufferUsage.Triangles:
      return 'triangle-list';
    case BufferUsage.Verts:
      return 'point-list';
    case BufferUsage.Lines:
    default:
      return 'line-list';
  }
}

// TODO: calculate tangents
export function buildVertexInput(publicAPI, model) {
  const pd = model.currentInput;
  const cells = model.cellArray;
  const primType = model.primitiveType;

  const actor = model.WebGPUActor.getRenderable();
  let representation = actor.getProperty().getRepresentation();
  const device = model.WebGPURenderWindow.getDevice();
  let edges = false;
  if (primType === PrimitiveTypes.TriangleEdges) {
    edges = true;
    representation = Representation.WIREFRAME;
  }

  const vertexInput = model.vertexInput;
  const points = pd.getPoints();

  // Index Buffer
  let indexBuffer = null;
  if (cells) {
    indexBuffer = device.getBufferManager().getBuffer({
      hash: `R${representation}P${primType}O${model.cellOffset
        }${cells.getMTime()}`,
      usage: BufferUsage.Index,
      cells,
      numberOfPoints: points.getNumberOfPoints(),
      primitiveType: primType,
      representation,
      cellOffset: model.cellOffset,
    });
    vertexInput.setIndexBuffer(indexBuffer);
  } else {
    vertexInput.setIndexBuffer(null);
  }

  // hash = all things that can change the values on the buffer
  // since mtimes are unique we can use
  // - indexBuffer mtime - because cells drive how we pack
  // - relevant dataArray mtime - the source data
  // - shift - not currently captured
  // - scale - not currently captured
  // - format
  // - usage
  // - packExtra - covered by format
  // Points Buffer
  if (points) {
    const shift = model.WebGPUActor.getBufferShift(model.WebGPURenderer);
    vertexInput.addBuffer(
      device.getBufferManager().getBuffer({
        hash: `${points.getMTime()}I${indexBuffer?.getMTime?.() ?? 0
          }${shift.join()}float32x4`,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        dataArray: points,
        indexBuffer,
        shift,
        packExtra: true,
      }),
      ['vertexBC']
    );
  } else {
    vertexInput.removeBufferIfPresent('vertexBC');
  }

  // Normals
  const usage = getUsage(representation, primType);
  model._usesCellNormals = false;
  // Add normals for triangles/strips, AND for lines in wireframe mode (converted from triangles)
  const isWireframeFromTriangles =
    representation === Representation.WIREFRAME &&
    (primType === PrimitiveTypes.Triangles ||
      primType === PrimitiveTypes.TriangleStrips);
  if (
    !model.is2D && // no lighting on Property2D
    (usage === BufferUsage.Triangles ||
      usage === BufferUsage.Strips ||
      isWireframeFromTriangles)
  ) {
    const normals = pd.getPointData().getNormals();
    // https://vtk.org/doc/nightly/html/classvtkPolyDataTangents.html
    // Need to find some way of using precomputed tangents (or computing new ones)
    const buffRequest = {
      format: 'snorm8x4',
      indexBuffer,
      packExtra: true,
      shift: 0,
      scale: 127,
    };
    if (normals) {
      buffRequest.hash = `${normals.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
      buffRequest.dataArray = normals;
      buffRequest.usage = BufferUsage.PointArray;
      vertexInput.addBuffer(device.getBufferManager().getBuffer(buffRequest), [
        'normalMC',
      ]);
    } else if (primType === PrimitiveTypes.Triangles) {
      model._usesCellNormals = true;
      buffRequest.hash = `PFN${points.getMTime()}I${indexBuffer.getMTime()}snorm8x4`;
      buffRequest.dataArray = points;
      buffRequest.cells = cells;
      buffRequest.usage = BufferUsage.NormalsFromPoints;
      buffRequest.cellOffset = model.cellOffset;
      vertexInput.addBuffer(device.getBufferManager().getBuffer(buffRequest), [
        'normalMC',
      ]);
    } else {
      vertexInput.removeBufferIfPresent('normalMC');
    }

    // Tangents (precomputed)
    const tangents =
      pd.getPointData().getArrayByName?.('Tangents') ??
      pd.getPointData().getTangents?.();
    if (
      tangents &&
      (tangents.getNumberOfComponents() === 3 ||
        tangents.getNumberOfComponents() === 4)
    ) {
      vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          hash: `${tangents.getMTime()}I${indexBuffer.getMTime()}snorm8x4-tangent`,
          dataArray: tangents,
          usage: BufferUsage.PointArray,
          format: 'snorm8x4',
          indexBuffer,
          packExtra: true,
          shift: 0,
          scale: 127,
        }),
        ['tangentMC']
      );
    } else {
      vertexInput.removeBufferIfPresent('tangentMC');
    }
  } else {
    vertexInput.removeBufferIfPresent('normalMC');
    vertexInput.removeBufferIfPresent('tangentMC');
  }

  const scalarMode = model.renderable.getScalarMode();
  const hasScalarSource =
    !!model.renderable.getColorMapColors?.() ||
    !!model.renderable.getColorCoordinates?.() ||
    !!model.renderable.getColorTextureMap?.();
  const scalarModeUsesCells =
    scalarMode === ScalarMode.USE_CELL_DATA ||
    scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
    scalarMode === ScalarMode.USE_FIELD_DATA ||
    model.renderable.getAreScalarsMappedFromCells?.() ||
    !pd.getPointData().getScalars();

  // Colors
  let haveColors = false;
  model._usesCellScalars =
    !!model.renderable.getScalarVisibility() &&
    hasScalarSource &&
    scalarModeUsesCells &&
    scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
    !edges;
  if (model.renderable.getScalarVisibility()) {
    let c = model.renderable.getColorMapColors();
    const indexedLookup =
      model.renderable.getLookupTable?.()?.getIndexedLookup?.() ?? false;
    if (!c && indexedLookup && model._usesCellScalars) {
      let scalars = null;
      const colorByName = model.renderable.getColorByArrayName?.();
      if (scalarMode === ScalarMode.USE_CELL_DATA && colorByName) {
        scalars = pd.getCellData()?.getArrayByName?.(colorByName) ?? null;
      }
      if (!scalars) {
        const resolved = model.renderable.getAbstractScalars(
          pd,
          scalarMode,
          model.renderable.getArrayAccessMode(),
          0,
          colorByName
        );
        scalars = resolved?.scalars ?? null;
      }
      if (scalars) {
        const lut = model.renderable.getLookupTable?.();
        if (lut) {
          lut.build?.();
          c = lut.mapScalars(
            scalars,
            model.renderable.getColorMode?.() ?? ColorMode.MAP_SCALARS,
            model.renderable.getFieldDataTupleId?.() ?? -1
          );
        }
      }
    }
    if (c && !edges && !model._usesCellScalars) {
      // We must figure out how the scalars should be mapped to the polydata.
      const haveCellScalars =
        (scalarMode === ScalarMode.USE_CELL_DATA ||
          scalarMode === ScalarMode.USE_CELL_FIELD_DATA ||
          scalarMode === ScalarMode.USE_FIELD_DATA ||
          !pd.getPointData().getScalars()) &&
        scalarMode !== ScalarMode.USE_POINT_FIELD_DATA &&
        c;
      vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          usage: BufferUsage.PointArray,
          format: 'unorm8x4',
          hash: `${haveCellScalars}${c.getMTime()}I${indexBuffer.getMTime()}O${model.cellOffset
            }unorm8x4`,
          dataArray: c,
          indexBuffer,
          cellData: haveCellScalars,
          cellOffset: model.cellOffset,
        }),
        ['colorVI']
      );
      haveColors = true;
    }
  }
  if (!haveColors) vertexInput.removeBufferIfPresent('colorVI');

  // Texture Coordinates
  let tcoords = null;
  let colorTCoords = null;
  let useCellTCoords = false;
  if (
    (model.renderable.getAreScalarsMappedFromCells() ||
      model.renderable.getInterpolateScalarsBeforeMapping?.()) &&
    model.renderable.getColorCoordinates()
  ) {
    colorTCoords = model.renderable.getColorCoordinates();
    useCellTCoords = model.renderable.getAreScalarsMappedFromCells();
  }
  tcoords = pd.getPointData().getTCoords();
  if (tcoords && !edges) {
    vertexInput.addBuffer(
      device
        .getBufferManager()
        .getBufferForPointArray(tcoords, vertexInput.getIndexBuffer()),
      ['tcoord']
    );

    // TEXCOORD_1 support for glTF models
    const tcoords1 = pd.getPointData().getArrayByName('TEXCOORD_1');
    if (tcoords1) {
      vertexInput.addBuffer(
        device
          .getBufferManager()
          .getBufferForPointArray(tcoords1, vertexInput.getIndexBuffer()),
        ['tcoord1']
      );
    } else {
      vertexInput.removeBufferIfPresent('tcoord1');
    }
  } else {
    vertexInput.removeBufferIfPresent('tcoord');
    vertexInput.removeBufferIfPresent('tcoord1');
  }

  const indexedLookup =
    model.renderable.getLookupTable?.()?.getIndexedLookup?.() ?? false;
  if (colorTCoords && !edges && !(indexedLookup && model._usesCellScalars)) {
    vertexInput.addBuffer(
      useCellTCoords
        ? device
            .getBufferManager()
            .getBufferForCellArray(
              colorTCoords,
              vertexInput.getIndexBuffer(),
              model.cellOffset
            )
        : device
            .getBufferManager()
            .getBufferForPointArray(
              colorTCoords,
              vertexInput.getIndexBuffer()
            ),
      ['colorTCoord']
    );
  } else {
    vertexInput.removeBufferIfPresent('colorTCoord');
  }

  // Selection IDs
  const selector = model.WebGPURenderer?.getSelector?.();
  if (selector && !edges && indexBuffer) {
    let selectIds = null;
    if (
      selector.getFieldAssociation() ===
      FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      selectIds = indexBuffer.getFlatIdToPointId();
    } else if (
      selector.getFieldAssociation() ===
      FieldAssociations.FIELD_ASSOCIATION_CELLS
    ) {
      selectIds = indexBuffer.getFlatIdToCellId();
    }

    if (selectIds) {
      vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          hash: `sel${selector.getFieldAssociation()}I${indexBuffer.getMTime()}`,
          usage: BufferUsage.RawVertex,
          format: 'uint32',
          interpolation: 'flat',
          nativeArray:
            selectIds instanceof Uint32Array
              ? selectIds
              : Uint32Array.from(selectIds),
        }),
        ['selectId']
      );
    } else {
      vertexInput.removeBufferIfPresent('selectId');
    }
  } else {
    vertexInput.removeBufferIfPresent('selectId');
  }

  // Cell scalar IDs for fragment cell color fetch
  if (model._usesCellScalars && !edges && indexBuffer) {
    const cellIds = indexBuffer.getFlatIdToCellId();
    if (cellIds) {
      vertexInput.addBuffer(
        device.getBufferManager().getBuffer({
          hash: `cellScalarIdI${indexBuffer.getMTime()}`,
          usage: BufferUsage.RawVertex,
          format: 'uint32',
          interpolation: 'flat',
          nativeArray:
            cellIds instanceof Uint32Array ? cellIds : Uint32Array.from(cellIds),
        }),
        ['cellScalarId']
      );
    } else {
      vertexInput.removeBufferIfPresent('cellScalarId');
    }
  } else {
    vertexInput.removeBufferIfPresent('cellScalarId');
  }

  // Skinning Attributes (JOINTS_0 / WEIGHTS_0)
  const jointsArray = pd.getPointData().getArrayByName('JOINTS_0');
  const weightsArray = pd.getPointData().getArrayByName('WEIGHTS_0');
  if (jointsArray && weightsArray && !edges) {
    // JOINTS_0: uint16x4 or uint8x4 depending on source data
    const jointsFormat =
      jointsArray.getDataType() === 'Uint8Array' ? 'uint8x4' : 'uint16x4';
    vertexInput.addBuffer(
      device.getBufferManager().getBuffer({
        hash: `${jointsArray.getMTime()}I${indexBuffer?.getMTime?.() ?? 0
          }${jointsFormat}`,
        usage: BufferUsage.PointArray,
        format: jointsFormat,
        dataArray: jointsArray,
        indexBuffer,
      }),
      ['jointIndices']
    );
    // WEIGHTS_0: float32x4
    vertexInput.addBuffer(
      device.getBufferManager().getBuffer({
        hash: `${weightsArray.getMTime()}I${indexBuffer?.getMTime?.() ?? 0
          }float32x4`,
        usage: BufferUsage.PointArray,
        format: 'float32x4',
        dataArray: weightsArray,
        indexBuffer,
      }),
      ['jointWeights']
    );
  } else {
    vertexInput.removeBufferIfPresent('jointIndices');
    vertexInput.removeBufferIfPresent('jointWeights');
  }
}
