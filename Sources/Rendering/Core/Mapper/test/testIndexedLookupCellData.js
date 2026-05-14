import test from 'tape';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

// Bug: https://github.com/Kitware/vtk-js/issues/3509
// canUseTextureMapForColoring returns true for cell data + indexed LUT.
// The indexed lookup check was placed after the cell data shortcut, so cell
// data with an indexed LUT incorrectly took the texture path, which produces
// NaN (red) colors because the texture samples continuous float values that
// don't match any annotations.
test('Test canUseTextureMapForColoring returns false for indexed LUT with cell data', (t) => {
  const numCells = 16;
  const numPoints = 25;

  const points = new Float32Array(3 * numPoints);
  const polys = new Uint32Array(5 * numCells);
  const cellCategories = new Uint8Array(numCells);

  for (let i = 0; i < numPoints; i++) {
    points[i * 3] = i % 5;
    points[i * 3 + 1] = Math.floor(i / 5);
  }
  let idx = 0;
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      const p0 = j * 5 + i;
      polys[idx++] = 4;
      polys[idx++] = p0;
      polys[idx++] = p0 + 1;
      polys[idx++] = p0 + 6;
      polys[idx++] = p0 + 5;
      cellCategories[j * 4 + i] = (i + j) % 4;
    }
  }

  const polydata = vtkPolyData.newInstance();
  polydata.getPoints().setData(points, 3);
  polydata.getPolys().setData(polys, 1);

  polydata.getCellData().setScalars(
    vtkDataArray.newInstance({
      name: 'CellCategories',
      numberOfComponents: 1,
      values: cellCategories,
    })
  );

  const lut = vtkLookupTable.newInstance();
  lut.setNumberOfColors(4);
  lut.setHueRange(0.0, 0.66);
  lut.build();
  lut.setIndexedLookup(true);
  lut.setAnnotations(['0', '1', '2', '3'], ['Cat0', 'Cat1', 'Cat2', 'Cat3']);

  const mapper = vtkMapper.newInstance({
    scalarVisibility: true,
    colorMode: ColorMode.MAP_SCALARS,
    scalarMode: ScalarMode.USE_CELL_DATA,
    interpolateScalarsBeforeMapping: false,
  });
  mapper.setInputData(polydata);
  mapper.setLookupTable(lut);

  const scalars = polydata.getCellData().getScalars();

  const canUseTexture = mapper.canUseTextureMapForColoring(scalars, true);
  t.notOk(
    canUseTexture,
    'canUseTextureMapForColoring should return false for cell data + indexed LUT'
  );

  // Verify mapScalars produces correct colorMapColors (not null from texture path)
  mapper.mapScalars(polydata, 1.0);
  const colorMapColors = mapper.getColorMapColors();
  t.ok(colorMapColors, 'colorMapColors should not be null for indexed LUT');
  if (!colorMapColors) {
    t.end();
    return;
  }
  t.equal(
    colorMapColors.getNumberOfTuples(),
    numCells,
    'colorMapColors should have one tuple per cell'
  );

  // Verify no NaN colors (the red [128,0,0,255] pattern)
  const cdata = colorMapColors.getData();

  let hasNanColor = false;
  for (let i = 0; i < numCells; i++) {
    const r = cdata[i * 4];
    const g = cdata[i * 4 + 1];
    const b = cdata[i * 4 + 2];
    // NaN color is exactly [128, 0, 0, 255] (nanColor = [0.5, 0, 0, 1])
    if (r === 128 && g === 0 && b === 0) {
      hasNanColor = true;
      break;
    }
  }
  t.notOk(
    hasNanColor,
    'No cells should have NaN color - all categories have valid annotations'
  );

  // Also verify colorTextureMap is null (texture path was not taken)
  const textureMap = mapper.getColorTextureMap();
  t.notOk(
    textureMap,
    'colorTextureMap should be null when indexed LUT is used'
  );

  t.end();
});
