import { describe, expect, it } from 'vitest';

import macro from 'vtk.js/Sources/macros';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkSelectionNode from 'vtk.js/Sources/Common/DataModel/SelectionNode';
import vtkWebGPUHardwareSelector from 'vtk.js/Sources/Rendering/WebGPU/HardwareSelector';

const { FieldAssociations } = vtkDataSet;

// An area of 4 x 3 pixels at display (10, 20). The pixel (11, 21) shows
// prop 0, with attribute 5 (written as 6).
function makeData() {
  const area = [10, 20, 13, 22];
  const colorBufferWidth = 16;
  const colorValues = new Uint32Array(colorBufferWidth * 3 * 4);
  const index = (area[3] - 21) * colorBufferWidth + (11 - area[0]);
  colorValues[index * 4] = 1;
  colorValues[index * 4 + 2] = 6;
  return vtkWebGPUHardwareSelector.newSourceData({
    area,
    width: 100,
    height: 100,
    colorValues,
    colorBufferWidth,
    props: ['prop0'],
    fieldAssociation: FieldAssociations.FIELD_ASSOCIATION_CELLS,
    captureZValues: false,
  });
}

// A selector that returns the given source data instead of rendering.
function newStubSelector(sourceData, calls) {
  return macro.newInstance((publicAPI, model, initialValues) => {
    vtkWebGPUHardwareSelector.extend(publicAPI, model, initialValues);
    publicAPI.getSourceDataAsync = async (...args) => {
      calls.push(args);
      return sourceData;
    };
  }, 'vtkStubSelector')();
}

describe('Test WebGPU HardwareSelector', () => {
  it('reads pixels relative to the area', () => {
    const data = makeData();
    const info = data.getPixelInformation([11, 21], 0, [0, 0]);
    expect(info.valid).toBe(true);
    expect(info.prop).toBe('prop0');
    expect(info.attributeID).toBe(5);
    expect(data.getPixelInformation([12, 21], 0, [0, 0])).toBe(null);
    expect(data.getPixelInformation([5, 21], 0, [0, 0])).toBe(null);
  });

  it('finds the nearest pixel within a distance', () => {
    const out = [0, 0];
    const info = makeData().getPixelInformation([12, 22], 3, out);
    expect(info.attributeID).toBe(5);
    expect(out).toEqual([11, 21]);
  });

  it('generates a selection in the area', () => {
    const sel = makeData().generateSelection(10, 20, 13, 22);
    expect(sel.length).toBe(1);
    expect(sel[0].getFieldType()).toBe(vtkSelectionNode.SelectionField.CELL);
    expect(Array.from(sel[0].getSelectionList())).toEqual([5]);
    expect(sel[0].getProperties().pixelCount).toBe(1);
  });

  it('tells which props are hit', () => {
    const data = makeData();
    expect(data.isPropHit(0)).toBe(true);
    expect(data.isPropHit(1)).toBe(false);
  });

  it('captures the area and keeps the data', async () => {
    const calls = [];
    const selector = newStubSelector(makeData(), calls);
    expect(selector.getPixelInformation([11, 21], 0, [0, 0])).toBe(null);
    selector.setArea(10.7, 20.2, 13.9, 22.5);
    expect(selector.getArea()).toEqual([10, 20, 13, 22]);
    expect(await selector.captureBuffersAsync()).toBe(true);
    expect(calls[0].slice(1)).toEqual([10, 20, 13, 22]);

    expect(selector.getPixelInformation([11, 21], 0, [0, 0]).attributeID).toBe(
      5
    );
    expect(selector.generateSelection(10, 20, 13, 22).length).toBe(1);
    expect(selector.isPropHit(0)).toBe(true);

    selector.releasePixBuffers();
    expect(selector.getCapturedData()).toBe(null);
    expect(selector.isPropHit(0)).toBe(false);
  });

  it('reads all the window when no area is set', async () => {
    const calls = [];
    const selector = newStubSelector(false, calls);
    expect(await selector.captureBuffersAsync()).toBe(false);
    expect(calls[0].length).toBe(1);
  });
});
