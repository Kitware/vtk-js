import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTextureMapToSphere methods
// ----------------------------------------------------------------------------

function vtkTextureMapToSphere(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTextureMapToSphere');

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }
    const input = inData[0];

    const nbPoints = input.getPoints().getNumberOfPoints();
    if (nbPoints <= 1) {
      vtkErrorMacro("Can't generate texture coordinates without points");
      return;
    }

    const piOverTwo = Math.PI / 2;
    const x = [];
    const points = input.getPoints();
    if (model.automaticSphereGeneration) {
      model.center = [0, 0, 0];
      for (let i = 0; i < nbPoints; i++) {
        points.getPoint(i, x);
        model.center[0] += x[0];
        model.center[1] += x[1];
        model.center[2] += x[2];
      }
      model.center[0] /= nbPoints;
      model.center[1] /= nbPoints;
      model.center[2] /= nbPoints;
    }

    let rho = 0;
    let diff = 0;
    let phi = 0;
    const tc = [0, 0];
    let r = 0;
    let thetaX = 0;
    let thetaY = 0;
    const tcoordsData = [];
    for (let i = 0; i < nbPoints; i++) {
      points.getPoint(i, x);
      rho = Math.sqrt(vtkMath.distance2BetweenPoints(x, model.center));
      if (rho !== 0) {
        diff = x[2] - model.center[2];
        if (Math.abs(diff) > rho) {
          phi = 0;
          if (diff > 0) {
            tc[1] = 0;
          } else {
            tc[1] = 1;
          }
        } else {
          phi = Math.acos(diff / rho);
          tc[1] = phi / Math.PI;
        }
      } else {
        tc[1] = 0;
      }

      r = rho * Math.sin(phi);
      if (r !== 0) {
        diff = x[0] - model.center[0];
        if (Math.abs(diff) > r) {
          if (diff > 0) {
            thetaX = 0;
          } else {
            thetaX = Math.PI;
          }
        } else {
          thetaX = Math.acos(diff / r);
        }

        diff = x[1] - model.center[1];
        if (Math.abs(diff) > r) {
          if (diff > 0) {
            thetaY = piOverTwo;
          } else {
            thetaY = -piOverTwo;
          }
        } else {
          thetaY = Math.asin(diff / r);
        }
      } else {
        thetaX = 0;
        thetaY = 0;
      }

      if (model.preventSeam) {
        tc[0] = thetaX / Math.PI;
      } else {
        tc[0] = thetaX / (2 * Math.PI);
        if (thetaY < 0) {
          tc[0] = 1 - tc[0];
        }
      }
      tcoordsData.push(...tc);
    }

    const tCoords = vtkDataArray.newInstance({
      name: 'Texture Coordinates',
      numberOfComponents: 2,
      size: nbPoints,
      values: tcoordsData,
    });

    const output = vtkPolyData.newInstance();
    output
      .getPoints()
      .setData(new Float32Array(input.getPoints().getData()), 3);
    output.getPolys().setData(new Uint32Array(input.getPolys().getData()));
    output.getPointData().setTCoords(tCoords);

    // Update output
    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  center: [0, 0, 0],
  automaticSphereGeneration: 1,
  preventSeam: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGetArray(publicAPI, model, ['center']);
  macro.setGet(publicAPI, model, ['automaticSphereGeneration', 'preventSeam']);

  macro.algo(publicAPI, model, 1, 1);
  vtkTextureMapToSphere(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTextureMapToSphere');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
