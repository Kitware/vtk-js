import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPLYWriter from 'vtk.js/Sources/IO/Geometry/PLYWriter';

function makeTriangle() {
  const polyData = vtkPolyData.newInstance();
  polyData
    .getPoints()
    .setData(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3);
  polyData.getPolys().setData(new Uint32Array([3, 0, 1, 2]));
  return polyData;
}

function getHeader(text) {
  return text.split('end_header')[0].split('\n');
}

function getBody(text) {
  return text.split('end_header\n')[1].trim().split('\n');
}

it('vtkPLYWriter does not change the header comments option', () => {
  const polyData = makeTriangle();
  const writer = vtkPLYWriter.newInstance({ headerComments: ['my comment'] });
  const output = [];
  writer.requestData([polyData], output);
  writer.requestData([polyData], output);

  expect(writer.getHeaderComments()).toEqual(['my comment']);
  const comments = getHeader(output[0]).filter((l) => l.startsWith('comment'));
  expect(comments).toEqual([
    'comment VTK.js generated PLY File',
    'comment my comment',
  ]);
});

it('vtkPLYWriter does not write UVs and colors when the options are false', () => {
  const polyData = makeTriangle();
  polyData.getPointData().setTCoords(
    vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: new Float32Array([0, 0, 1, 0, 0, 1]),
    })
  );
  polyData.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]),
    })
  );

  const writer = vtkPLYWriter.newInstance({
    withNormals: false,
    withUVs: false,
    withColors: false,
  });
  writer.setInputData(polyData);
  const text = writer.getOutputData();
  const header = getHeader(text);
  ['u', 'v', 'red', 'green', 'blue'].forEach((name) => {
    expect(header).not.toContain(`property float ${name}`);
    expect(header).not.toContain(`property uchar ${name}`);
  });
  expect(getBody(text)[0]).toBe('0 0 0');
});

it('vtkPLYWriter declares normals only when the polydata has normals', () => {
  const polyData = makeTriangle();
  const writer = vtkPLYWriter.newInstance();
  writer.setInputData(polyData);
  let text = writer.getOutputData();
  expect(getHeader(text)).not.toContain('property float nx');
  expect(getBody(text)[0]).toBe('0 0 0');

  polyData.getPointData().setNormals(
    vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    })
  );
  const writerWithNormals = vtkPLYWriter.newInstance();
  writerWithNormals.setInputData(polyData);
  text = writerWithNormals.getOutputData();
  expect(getHeader(text)).toContain('property float nx');
  expect(getBody(text)[0]).toBe('0 0 0 0 0 1');

  const binaryWriter = vtkPLYWriter.newInstance({ format: 'binary' });
  binaryWriter.setInputData(makeTriangle());
  const view = binaryWriter.getOutputData();
  const header = new TextDecoder().decode(view.buffer).split('end_header\n')[0];
  const headerLength = header.length + 'end_header\n'.length;
  // 3 points with 3 floats, and 1 face with 1 count byte and 3 indices.
  expect(view.byteLength - headerLength).toBe(3 * 3 * 4 + 1 + 3 * 4);
});

it('vtkPLYWriter reads colors with the number of components of the scalars', () => {
  const polyData = makeTriangle();
  polyData.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 4,
      values: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
    })
  );
  const writer = vtkPLYWriter.newInstance({ withNormals: false });
  writer.setInputData(polyData);
  expect(getBody(writer.getOutputData()).slice(0, 3)).toEqual([
    '0 0 0 255 0 0',
    '1 0 0 0 255 0',
    '0 1 0 0 0 255',
  ]);
});

it('vtkPLYWriter does not write float scalars as colors', () => {
  const polyData = makeTriangle();
  polyData.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: new Float32Array([0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5]),
    })
  );
  const writer = vtkPLYWriter.newInstance({ withNormals: false });
  writer.setInputData(polyData);
  const text = writer.getOutputData();
  expect(getHeader(text)).not.toContain('property uchar red');
  expect(getBody(text)[0]).toBe('0 0 0');
});
