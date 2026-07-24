import { it, expect } from 'vitest';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import {
  ColorMode,
  ScalarMode,
  GetArray,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

it('does not use the texture path for cell data + indexed LUT', () => {
  // This is a regression test for a bug https://github.com/Kitware/vtk-js/issues/3509
  const polydata = vtkPolyData.newInstance();
  polydata.getCellData().setScalars(
    vtkDataArray.newInstance({
      name: 'Categories',
      values: new Uint8Array([0, 1, 2, 3, 0, 1]),
    })
  );

  const lut = vtkLookupTable.newInstance();
  lut.setNumberOfColors(4);
  lut.build();
  lut.setIndexedLookup(true);
  lut.setAnnotations(['0', '1', '2', '3'], ['Cat0', 'Cat1', 'Cat2', 'Cat3']);

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_CELL_DATA,
    colorMode: ColorMode.MAP_SCALARS,
  });
  mapper.setInputData(polydata);
  mapper.setLookupTable(lut);

  const scalars = polydata.getCellData().getScalars();
  // Indexed lookup must win over the cell data shortcut.
  expect(mapper.canUseTextureMapForColoring(scalars, true)).toBe(false);

  mapper.mapScalars(polydata, 1.0);
  // Vertex color path: colors present, no texture map.
  expect(mapper.getColorMapColors()).not.toBeNull();
  expect(mapper.getColorTextureMap()).toBeNull();
});

it('cell data with a continuous LUT still uses the texture path', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getCellData().setScalars(
    vtkDataArray.newInstance({
      name: 'data',
      values: new Float32Array([0.1, 0.2, 0.3, 0.4]),
    })
  );

  const lut = vtkLookupTable.newInstance();
  lut.build();

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_CELL_DATA,
    colorMode: ColorMode.MAP_SCALARS,
  });
  mapper.setInputData(polydata);
  mapper.setLookupTable(lut);

  mapper.mapScalars(polydata, 1.0);
  expect(mapper.getColorTextureMap()).not.toBeNull();
  expect(mapper.getColorMapColors()).toBeNull();
});

it('honors colorByArrayName for USE_CELL_DATA (bug: getAbstractScalars)', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getCellData().setScalars(
    vtkDataArray.newInstance({
      name: 'CellScalars',
      values: new Float32Array([0.0, 0.5, 1.0, 0.25]),
    })
  );
  polydata.getCellData().addArray(
    vtkDataArray.newInstance({
      name: 'CellCategories',
      values: new Uint8Array([0, 1, 2, 3]),
    })
  );

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_CELL_DATA,
    colorByArrayName: 'CellCategories',
  });

  const { scalars, cellFlag } = mapper.getAbstractScalars(
    polydata,
    ScalarMode.USE_CELL_DATA,
    GetArray.BY_NAME,
    0,
    'CellCategories'
  );
  expect(scalars).not.toBeNull();
  expect(scalars.getName()).toBe('CellCategories');
  expect(cellFlag).toBe(true);
});

it('honors colorByArrayName for USE_POINT_DATA', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'PointScalars',
      values: new Float32Array([0.0, 0.5, 1.0]),
    })
  );
  polydata.getPointData().addArray(
    vtkDataArray.newInstance({
      name: 'PointCategories',
      values: new Uint8Array([0, 1, 2]),
    })
  );

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_POINT_DATA,
    colorByArrayName: 'PointCategories',
  });

  const { scalars, cellFlag } = mapper.getAbstractScalars(
    polydata,
    ScalarMode.USE_POINT_DATA,
    GetArray.BY_NAME,
    0,
    'PointCategories'
  );
  expect(scalars.getName()).toBe('PointCategories');
  expect(cellFlag).toBe(false);
});

it('falls back to active scalars when colorByArrayName is unset', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getCellData().setScalars(
    vtkDataArray.newInstance({
      name: 'CellScalars',
      values: new Float32Array([0.0, 0.5, 1.0, 0.25]),
    })
  );

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_CELL_DATA,
  });

  const { scalars } = mapper.getAbstractScalars(
    polydata,
    ScalarMode.USE_CELL_DATA,
    GetArray.BY_NAME,
    0,
    null
  );
  expect(scalars.getName()).toBe('CellScalars');
});

it('vtkMapper (3D) uses vertex coloring for point data by default (interpolateScalarsBeforeMapping = false)', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'data',
      values: new Float32Array([0.0, 0.5, 1.0]),
    })
  );

  const mapper = vtkMapper.newInstance({
    scalarMode: ScalarMode.USE_POINT_DATA,
    scalarVisibility: true,
  });
  mapper.setInputData(polydata);
  mapper.setLookupTable(vtkLookupTable.newInstance());

  expect(mapper.getInterpolateScalarsBeforeMapping()).toBe(false);
  mapper.mapScalars(polydata, 1.0);
  expect(mapper.getColorMapColors()).not.toBeNull();
  expect(mapper.getColorTextureMap()).toBeNull();
});

it('vtkMapper2D preserves the texture path for point data (interpolateScalarsBeforeMapping defaults to true)', () => {
  const polydata = vtkPolyData.newInstance();
  polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'data',
      values: new Float32Array([0.0, 0.5, 1.0]),
    })
  );

  const mapper = vtkMapper2D.newInstance({
    scalarMode: ScalarMode.USE_POINT_DATA,
    scalarVisibility: true,
  });
  mapper.setLookupTable(vtkLookupTable.newInstance());

  // vtkMapper2D historically always textured point data; the mixin keeps that
  // via a true default for interpolateScalarsBeforeMapping.
  expect(mapper.getInterpolateScalarsBeforeMapping()).toBe(true);
  mapper.mapScalars(polydata, 1.0);
  expect(mapper.getColorTextureMap()).not.toBeNull();
  expect(mapper.getColorMapColors()).toBeNull();
});
