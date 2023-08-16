import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// prettier-ignore
const LINE_ARRAY = [
  2, 0, 1,
  2, 2, 3,
  2, 4, 5,
  2, 6, 7,
  2, 0, 2,
  2, 1, 3,
  2, 4, 6,
  2, 5, 7,
  2, 0, 4,
  2, 1, 5,
  2, 2, 6,
  2, 3, 7,
];

// prettier-ignore
const POLY_ARRAY = [
  4, 0, 1, 3, 2,
  4, 4, 6, 7, 5,
  4, 8, 10, 11, 9,
  4, 12, 13, 15, 14,
  4, 16, 18, 19, 17,
  4, 20, 21, 23, 22,
];

// ----------------------------------------------------------------------------
// vtkCubeSource methods
// ----------------------------------------------------------------------------

function vtkCubeSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    const polyData = vtkPolyData.newInstance();
    outData[0] = polyData;

    const numberOfPoints = 24;

    // Define points
    const points = macro.newTypedArray(model.pointType, numberOfPoints * 3);
    polyData.getPoints().setData(points, 3);

    const normals = macro.newTypedArray(model.pointType, numberOfPoints * 3);
    const normalArray = vtkDataArray.newInstance({
      name: 'Normals',
      values: normals,
      numberOfComponents: 3,
    });
    polyData.getPointData().setNormals(normalArray);

    let tcdim = 2;
    if (model.generate3DTextureCoordinates === true) {
      tcdim = 3;
    }

    const textureCoords = macro.newTypedArray(
      model.pointType,
      numberOfPoints * tcdim
    );
    const tcoords = vtkDataArray.newInstance({
      name: 'TextureCoordinates',
      values: textureCoords,
      numberOfComponents: tcdim,
    });
    polyData.getPointData().setTCoords(tcoords);

    const x = [0.0, 0.0, 0.0];
    const n = [0.0, 0.0, 0.0];
    const tc = [0.0, 0.0];

    let pointIndex = 0;

    x[0] = -model.xLength / 2.0;
    n[0] = -1.0;
    n[1] = 0.0;
    n[2] = 0.0;
    for (let i = 0; i < 2; i++) {
      x[1] = -model.yLength / 2.0;

      for (let j = 0; j < 2; j++) {
        tc[1] = x[1] + 0.5;
        x[2] = -model.zLength / 2.0;

        for (let k = 0; k < 2; k++) {
          tc[0] = (x[2] + 0.5) * (1 - 2 * i);
          points[pointIndex * 3] = x[0];
          points[pointIndex * 3 + 1] = x[1];
          points[pointIndex * 3 + 2] = x[2];

          normals[pointIndex * 3] = n[0];
          normals[pointIndex * 3 + 1] = n[1];
          normals[pointIndex * 3 + 2] = n[2];

          if (tcdim === 2) {
            textureCoords[pointIndex * tcdim] = tc[0];
            textureCoords[pointIndex * tcdim + 1] = tc[1];
          } else {
            textureCoords[pointIndex * tcdim] = 2 * i - 1;
            textureCoords[pointIndex * tcdim + 1] = 2 * j - 1;
            textureCoords[pointIndex * tcdim + 2] = 2 * k - 1;
          }

          pointIndex++;

          x[2] += model.zLength;
        }
        x[1] += model.yLength;
      }
      x[0] += model.xLength;
      n[0] += 2.0;
    }

    x[1] = -model.yLength / 2.0;
    n[1] = -1.0;
    n[0] = 0.0;
    n[2] = 0.0;
    for (let i = 0; i < 2; i++) {
      x[0] = -model.xLength / 2.0;

      for (let j = 0; j < 2; j++) {
        tc[0] = (x[0] + 0.5) * (2 * i - 1);
        x[2] = -model.zLength / 2.0;

        for (let k = 0; k < 2; k++) {
          tc[1] = (x[2] + 0.5) * -1;

          points[pointIndex * 3] = x[0];
          points[pointIndex * 3 + 1] = x[1];
          points[pointIndex * 3 + 2] = x[2];

          normals[pointIndex * 3] = n[0];
          normals[pointIndex * 3 + 1] = n[1];
          normals[pointIndex * 3 + 2] = n[2];

          if (tcdim === 2) {
            textureCoords[pointIndex * tcdim] = tc[0];
            textureCoords[pointIndex * tcdim + 1] = tc[1];
          } else {
            textureCoords[pointIndex * tcdim] = 2 * j - 1;
            textureCoords[pointIndex * tcdim + 1] = 2 * i - 1;
            textureCoords[pointIndex * tcdim + 2] = 2 * k - 1;
          }

          pointIndex++;
          x[2] += model.zLength;
        }
        x[0] += model.xLength;
      }
      x[1] += model.yLength;
      n[1] += 2.0;
    }

    x[2] = -model.zLength / 2.0;
    n[2] = -1.0;
    n[0] = 0.0;
    n[1] = 0.0;
    for (let i = 0; i < 2; i++) {
      x[1] = -model.yLength / 2.0;

      for (let j = 0; j < 2; j++) {
        tc[1] = x[1] + 0.5;
        x[0] = -model.xLength / 2.0;

        for (let k = 0; k < 2; k++) {
          tc[0] = (x[0] + 0.5) * (2 * i - 1);

          points[pointIndex * 3] = x[0];
          points[pointIndex * 3 + 1] = x[1];
          points[pointIndex * 3 + 2] = x[2];

          normals[pointIndex * 3] = n[0];
          normals[pointIndex * 3 + 1] = n[1];
          normals[pointIndex * 3 + 2] = n[2];

          if (tcdim === 2) {
            textureCoords[pointIndex * tcdim] = tc[0];
            textureCoords[pointIndex * tcdim + 1] = tc[1];
          } else {
            textureCoords[pointIndex * tcdim] = 2 * k - 1;
            textureCoords[pointIndex * tcdim + 1] = 2 * j - 1;
            textureCoords[pointIndex * tcdim + 2] = 2 * i - 1;
          }

          pointIndex++;
          x[0] += model.xLength;
        }
        x[1] += model.yLength;
      }
      x[2] += model.zLength;
      n[2] += 2.0;
    }

    // Apply rotation to the points coordinates and normals
    if (model.rotations) {
      vtkMatrixBuilder
        .buildFromDegree()
        .rotateX(model.rotations[0])
        .rotateY(model.rotations[1])
        .rotateZ(model.rotations[2])
        .apply(points)
        .apply(normals);
    }

    // Apply transformation to the points coordinates
    if (model.center) {
      vtkMatrixBuilder
        .buildFromRadian()
        .translate(...model.center)
        .apply(points);
    }

    // Apply optional additionally specified matrix transformation
    if (model.matrix) {
      vtkMatrixBuilder.buildFromRadian().setMatrix(model.matrix).apply(points);

      // prettier-ignore
      const rotMatrix = [
        model.matrix[0], model.matrix[1], model.matrix[2], 0,
        model.matrix[4], model.matrix[5], model.matrix[6], 0,
        model.matrix[8], model.matrix[9], model.matrix[10], 0,
        0, 0, 0, 1
      ];
      vtkMatrixBuilder.buildFromRadian().setMatrix(rotMatrix).apply(normals);
    }

    // Lastly, generate the necessary cell arrays.
    if (model.generateFaces) {
      polyData.getPolys().deepCopy(model._polys);
    } else {
      polyData.getPolys().initialize();
    }
    if (model.generateLines) {
      polyData.getLines().deepCopy(model._lineCells);
      // only set normals for faces, not for lines.
      polyData.getPointData().setNormals(null);
    } else {
      polyData.getLines().initialize();
    }
    polyData.modified();
  }

  publicAPI.setBounds = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    publicAPI.setXLength(boundsArray[1] - boundsArray[0]);
    publicAPI.setYLength(boundsArray[3] - boundsArray[2]);
    publicAPI.setZLength(boundsArray[5] - boundsArray[4]);
    publicAPI.setCenter([
      (boundsArray[0] + boundsArray[1]) / 2.0,
      (boundsArray[2] + boundsArray[3]) / 2.0,
      (boundsArray[4] + boundsArray[5]) / 2.0,
    ]);
  };

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  xLength: 1.0,
  yLength: 1.0,
  zLength: 1.0,
  pointType: 'Float64Array',
  generate3DTextureCoordinates: false,
  generateFaces: true,
  generateLines: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'xLength',
    'yLength',
    'zLength',
    'generate3DTextureCoordinates',
    'generateFaces',
    'generateLines',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'rotations'], 3);
  macro.setGetArray(publicAPI, model, ['matrix'], 16);

  // Internal persistent/static objects
  model._polys = vtkCellArray.newInstance({
    values: Uint16Array.from(POLY_ARRAY),
  });
  model._lineCells = vtkCellArray.newInstance({
    values: Uint16Array.from(LINE_ARRAY),
  });
  macro.moveToProtected(publicAPI, model, ['polys', 'lineCells']);

  macro.algo(publicAPI, model, 0, 1);
  vtkCubeSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
