import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { SolidType } from 'vtk.js/Sources/Filters/Sources/PlatonicSolidSource/Constants';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const a = 0.61803398875;
const b = 0.38196601125;
const c = 0.5;
const d = 0.30901699;
const e = Math.sqrt(2);
const f = Math.sqrt(3.0);

const geometries = {
  tetrahedron: {
    points: [1, 1, 1, -1, 1, -1, 1, -1, -1, -1, -1, 1],
    cells: [0, 2, 1, 1, 2, 3, 0, 3, 2, 0, 1, 3],
    numPoints: 4,
    cellSize: 3,
    numCells: 4,
    scale: 1.0 / f,
  },

  cube: {
    points: [
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
      -1, 1, 1,
    ],
    cells: [
      0, 1, 5, 4, 0, 4, 7, 3, 4, 5, 6, 7, 3, 7, 6, 2, 1, 2, 6, 5, 0, 3, 2, 1,
    ],
    numPoints: 8,
    cellSize: 4,
    numCells: 6,
    scale: 1.0 / f,
  },

  octahedron: {
    points: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, 0, 0, -e, 0, 0, e],
    cells: [
      4, 1, 0, 4, 2, 1, 4, 3, 2, 4, 0, 3, 0, 1, 5, 1, 2, 5, 2, 3, 5, 3, 0, 5,
    ],
    numPoints: 6,
    cellSize: 3,
    numCells: 8,
    scale: 1.0 / e,
  },

  icosahedron: {
    points: [
      0,
      d,
      -c,
      0,
      d,
      c,
      0,
      -d,
      c,
      -d,
      c,
      0,
      -d,
      -c,
      0,
      d,
      c,
      0,
      d,
      -c,
      0,
      0,
      -d,
      -c,
      c,
      0,
      d,
      -c,
      0,
      d,
      -c,
      0,
      -d,
      c,
      0,
      -d,
    ],
    cells: [
      0, 3, 5, 1, 5, 3, 1, 9, 2, 1, 2, 8, 0, 11, 7, 0, 7, 10, 2, 4, 6, 7, 6, 4,
      3, 10, 9, 4, 9, 10, 5, 8, 11, 6, 11, 8, 1, 3, 9, 1, 8, 5, 0, 10, 3, 0, 5,
      11, 7, 4, 10, 7, 11, 6, 2, 9, 4, 2, 6, 8,
    ],
    numPoints: 12,
    cellSize: 3,
    numCells: 20,
    scale: 1.0 / 0.58778524999243,
  },

  dodecahedron: {
    points: [
      b,
      0,
      1,
      -b,
      0,
      1,
      b,
      0,
      -1,
      -b,
      0,
      -1,
      0,
      1,
      -b,
      0,
      1,
      b,
      0,
      -1,
      -b,
      0,
      -1,
      b,
      1,
      b,
      0,
      1,
      -b,
      0,
      -1,
      b,
      0,
      -1,
      -b,
      0,
      -a,
      a,
      a,
      a,
      -a,
      a,
      -a,
      -a,
      -a,
      a,
      a,
      -a,
      a,
      a,
      a,
      -a,
      a,
      -a,
      -a,
      -a,
      a,
      a,
      -a,
      -a,
    ],
    cells: [
      0, 16, 5, 12, 1, 1, 18, 7, 13, 0, 2, 19, 6, 14, 3, 3, 17, 4, 15, 2, 4, 5,
      16, 8, 15, 5, 4, 17, 10, 12, 6, 7, 18, 11, 14, 7, 6, 19, 9, 13, 8, 16, 0,
      13, 9, 9, 19, 2, 15, 8, 10, 17, 3, 14, 11, 11, 18, 1, 12, 10,
    ],
    numPoints: 20,
    cellSize: 5,
    numCells: 12,
    scale: 1.0 / 1.070466269319,
  },
};

// ----------------------------------------------------------------------------
// vtkPlatonicSolidSource methods
// ----------------------------------------------------------------------------

function vtkPlatonicSolidSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlatonicSolidSource');

  publicAPI.requestData = (inData, outData) => {
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    let solidData;
    switch (model.solidType) {
      case SolidType.VTK_SOLID_TETRAHEDRON:
        solidData = geometries.tetrahedron;
        break;
      case SolidType.VTK_SOLID_CUBE:
        solidData = geometries.cube;
        break;
      case SolidType.VTK_SOLID_OCTAHEDRON:
        solidData = geometries.octahedron;
        break;
      case SolidType.VTK_SOLID_ICOSAHEDRON:
        solidData = geometries.icosahedron;
        break;
      case SolidType.VTK_SOLID_DODECAHEDRON:
        solidData = geometries.dodecahedron;
        break;
      default:
        solidData = geometries.tetrahedron;
        break;
    }

    let pointType;
    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointType = VtkDataTypes.DOUBLE;
    }

    const points = vtkPoints.newInstance({
      dataType: pointType,
      numberOfPoints: solidData.numPoints,
    });

    for (let i = 0; i < solidData.points.length; i += 3) {
      points.insertNextPoint(
        solidData.scale * solidData.points[i] * model.scale,
        solidData.scale * solidData.points[i + 1] * model.scale,
        solidData.scale * solidData.points[i + 2] * model.scale
      );
    }

    const polys = vtkCellArray.newInstance();
    for (let i = 0; i < solidData.cells.length; i += solidData.cellSize) {
      const cell = solidData.cells.slice(i, i + solidData.cellSize);
      polys.insertNextCell(cell);
    }

    output.setPoints(points);
    output.setPolys(polys);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  solidType: SolidType.VTK_SOLID_TETRAHEDRON,
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
  scale: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'solidType',
    'outputPointsPrecision',
    'scale',
  ]);
  macro.algo(publicAPI, model, 0, 1);

  // Object methods
  vtkPlatonicSolidSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlatonicSolidSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend, SolidType };
