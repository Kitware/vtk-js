import { it, expect } from 'vitest';
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
