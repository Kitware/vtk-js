import macro from 'vtk.js/Sources/macros';
import vtkSpline1D from 'vtk.js/Sources/Common/DataModel/Spline1D';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkKochanekSpline1D methods
// ----------------------------------------------------------------------------

function vtkKochanekSpline1D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkKochanekSpline1D');

  // --------------------------------------------------------------------------

  publicAPI.computeCloseCoefficients = (size, work, x, y) => {
    if (!model.coefficients || model.coefficients.length !== 4 * size) {
      model.coefficients = new Float32Array(4 * size);
    }
    const N = size - 1;

    for (let i = 1; i < N; i++) {
      const cs = y[i] - y[i - 1];
      const cd = y[i + 1] - y[i];

      let ds =
        cs * ((1 - model.tension) * (1 - model.continuity) * (1 + model.bias)) +
        cd * ((1 - model.tension) * (1 + model.continuity) * (1 - model.bias));

      let dd =
        cs * ((1 - model.tension) * (1 + model.continuity) * (1 + model.bias)) +
        cd * ((1 - model.tension) * (1 - model.continuity) * (1 - model.bias));

      // adjust deriviatives for non uniform spacing between nodes
      const n1 = x[i + 1] - x[i];
      const n0 = x[i] - x[i - 1];

      ds *= n0 / (n0 + n1);
      dd *= n1 / (n0 + n1);

      model.coefficients[4 * i + 0] = y[i];
      model.coefficients[4 * i + 1] = dd;
      model.coefficients[4 * i + 2] = ds;
    }

    // Calculate the deriviatives at the end points
    model.coefficients[4 * 0 + 0] = y[0];
    model.coefficients[4 * N + 0] = y[N];
    model.coefficients[4 * N + 1] = 0;
    model.coefficients[4 * N + 2] = 0;
    model.coefficients[4 * N + 3] = 0;

    // The curve is continuous and closed at P0=Pn
    const cs = y[N] - y[N - 1];
    const cd = y[1] - y[0];

    let ds =
      cs * ((1 - model.tension) * (1 - model.continuity) * (1 + model.bias)) +
      cd * ((1 - model.tension) * (1 + model.continuity) * (1 - model.bias));

    let dd =
      cs * ((1 - model.tension) * (1 + model.continuity) * (1 + model.bias)) +
      cd * ((1 - model.tension) * (1 - model.continuity) * (1 - model.bias));

    // adjust deriviatives for non uniform spacing between nodes
    const n1 = x[1] - x[0];
    const n0 = x[N] - x[N - 1];

    ds *= n0 / (n0 + n1);
    dd *= n1 / (n0 + n1);

    model.coefficients[4 * 0 + 1] = dd;
    model.coefficients[4 * 0 + 2] = ds;
    model.coefficients[4 * N + 1] = dd;
    model.coefficients[4 * N + 2] = ds;

    for (let i = 0; i < N; i++) {
      //
      // c0    = P ;    c1    = DD ;
      //   i      i       i       i
      //
      // c1    = P   ;  c2    = DS   ;
      //   i+1    i+1     i+1     i+1
      //
      // c2  = -3P  + 3P    - 2DD  - DS   ;
      //   i      i     i+1      i     i+1
      //
      // c3  =  2P  - 2P    +  DD  + DS   ;
      //   i      i     i+1      i     i+1
      //
      model.coefficients[4 * i + 2] =
        -3 * y[i] +
        3 * y[i + 1] +
        -2 * model.coefficients[4 * i + 1] +
        -1 * model.coefficients[4 * (i + 1) + 2];
      model.coefficients[4 * i + 3] =
        2 * y[i] +
        -2 * y[i + 1] +
        1 * model.coefficients[4 * i + 1] +
        1 * model.coefficients[4 * (i + 1) + 2];
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.computeOpenCoefficients = (size, work, x, y) => {
    vtkErrorMacro('Open splines are not implemented yet!');
  };

  // --------------------------------------------------------------------------

  publicAPI.getValue = (intervalIndex, t) => {
    const t2 = t * t;
    const t3 = t * t * t;

    return (
      model.coefficients[4 * intervalIndex + 3] * t3 +
      model.coefficients[4 * intervalIndex + 2] * t2 +
      model.coefficients[4 * intervalIndex + 1] * t +
      model.coefficients[4 * intervalIndex + 0]
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  tension: 0,
  bias: 0,
  continuity: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkSpline1D.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkKochanekSpline1D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkKochanekSpline1D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
