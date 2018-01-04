import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// Factory imports
import vtk from 'vtk.js/Sources/vtk';
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/CellArray';
import 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import 'vtk.js/Sources/Common/DataModel/PolyData';

export default function createScalarMap(
  offsetX,
  offsetY,
  preset,
  gc,
  min = 0,
  max = 1
) {
  const polydata = vtk({
    vtkClass: 'vtkPolyData',
    points: {
      vtkClass: 'vtkPoints',
      dataType: 'Float32Array',
      numberOfComponents: 3,
      values: [
        offsetX,
        offsetY,
        0,
        offsetX + 0.25,
        offsetY,
        0,
        offsetX + 0.25,
        offsetY + 1,
        0,
        offsetX,
        offsetY + 1,
        0,
      ],
    },
    polys: {
      vtkClass: 'vtkCellArray',
      dataType: 'Uint16Array',
      values: [4, 0, 1, 2, 3],
    },
    pointData: {
      vtkClass: 'vtkDataSetAttributes',
      activeScalars: 0,
      arrays: [
        {
          data: {
            vtkClass: 'vtkDataArray',
            name: 'pointScalars',
            dataType: 'Float32Array',
            values: [min, min, max, max],
          },
        },
      ],
    },
  });

  const actor = gc.registerResource(vtkActor.newInstance());
  const mapper = gc.registerResource(
    vtkMapper.newInstance({ interpolateScalarsBeforeMapping: true })
  );
  actor.setMapper(mapper);
  mapper.setInputData(polydata);
  actor.getProperty().set({ edgeVisibility: true, edgeColor: [1, 1, 1] });

  if (preset) {
    const lut = gc.registerResource(vtkColorTransferFunction.newInstance());
    lut.applyColorMap(preset);
    mapper.setLookupTable(lut);
  }

  return actor;
}
