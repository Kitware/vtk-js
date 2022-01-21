import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

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

    const numberOfPolys = 6;
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
    vtkMatrixBuilder
      .buildFromDegree()
      .rotateX(model.rotations[0])
      .rotateY(model.rotations[1])
      .rotateZ(model.rotations[2])
      .apply(points)
      .apply(normals);

    // Apply transformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .apply(points);

    // Define quads
    const polys = new Uint16Array(numberOfPolys * 5);
    polyData.getPolys().setData(polys, 1);

    let polyIndex = 0;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 0;
    polys[polyIndex++] = 1;
    polys[polyIndex++] = 3;
    polys[polyIndex++] = 2;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 4;
    polys[polyIndex++] = 6;
    polys[polyIndex++] = 7;
    polys[polyIndex++] = 5;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 8;
    polys[polyIndex++] = 10;
    polys[polyIndex++] = 11;
    polys[polyIndex++] = 9;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 12;
    polys[polyIndex++] = 13;
    polys[polyIndex++] = 15;
    polys[polyIndex++] = 14;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 16;
    polys[polyIndex++] = 18;
    polys[polyIndex++] = 19;
    polys[polyIndex++] = 17;

    polys[polyIndex++] = 4;
    polys[polyIndex++] = 20;
    polys[polyIndex++] = 21;
    polys[polyIndex++] = 23;
    polys[polyIndex] = 22;
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

    model.xLength = boundsArray[1] - boundsArray[0];
    model.yLength = boundsArray[3] - boundsArray[2];
    model.zLength = boundsArray[5] - boundsArray[4];
    model.center = [
      (boundsArray[0] + boundsArray[1]) / 2.0,
      (boundsArray[2] + boundsArray[3]) / 2.0,
      (boundsArray[4] + boundsArray[5]) / 2.0,
    ];
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
  center: [0.0, 0.0, 0.0],
  rotations: [0.0, 0.0, 0.0],
  pointType: 'Float64Array',
  generate3DTextureCoordinates: false,
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
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'rotations'], 3);

  macro.algo(publicAPI, model, 0, 1);
  vtkCubeSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
