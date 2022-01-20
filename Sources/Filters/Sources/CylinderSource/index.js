import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// ----------------------------------------------------------------------------
// vtkCylinderSource methods
// ----------------------------------------------------------------------------

function vtkCylinderSource(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkCylinderSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    let dataset = outData[0];

    const angle = (2.0 * Math.PI) / model.resolution;
    let numberOfPoints = 2 * model.resolution;
    let numberOfPolys = 5 * model.resolution;

    if (model.capping) {
      numberOfPoints = 4 * model.resolution;
      numberOfPolys = 7 * model.resolution + 2;
    }

    // Points
    const points = macro.newTypedArray(model.pointType, numberOfPoints * 3);

    // Cells
    let cellLocation = 0;
    const polys = new Uint32Array(numberOfPolys);

    // Normals
    const normalsData = new Float32Array(numberOfPoints * 3);
    const normals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: normalsData,
      name: 'Normals',
    });

    // Texture coords
    const tcData = new Float32Array(numberOfPoints * 2);
    const tcoords = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: tcData,
      name: 'TCoords',
    });

    // Generate points for all sides
    const nbot = [0.0, 0.0, 0.0];
    const ntop = [0.0, 0.0, 0.0];
    const xbot = [0.0, 0.0, 0.0];
    const xtop = [0.0, 0.0, 0.0];
    const tcbot = [0.0, 0.0];
    const tctop = [0.0, 0.0];
    const otherRadius =
      model.otherRadius == null ? model.radius : model.otherRadius;
    for (let i = 0; i < model.resolution; i++) {
      // x coordinate
      nbot[0] = Math.cos(i * angle + model.initAngle);
      ntop[0] = nbot[0];
      xbot[0] = model.radius * nbot[0] + model.center[0];
      xtop[0] = xbot[0];
      tcbot[0] = Math.abs((2.0 * i) / model.resolution - 1.0);
      tctop[0] = tcbot[0];

      // y coordinate
      xbot[1] = 0.5 * model.height + model.center[1];
      xtop[1] = -0.5 * model.height + model.center[1];
      tcbot[1] = 0.0;
      tctop[1] = 1.0;

      // z coordinate
      nbot[2] = -Math.sin(i * angle + model.initAngle);
      ntop[2] = nbot[2];
      xbot[2] = otherRadius * nbot[2] + model.center[2];
      xtop[2] = xbot[2];

      const pointIdx = 2 * i;
      for (let j = 0; j < 3; j++) {
        normalsData[pointIdx * 3 + j] = nbot[j];
        normalsData[(pointIdx + 1) * 3 + j] = ntop[j];
        points[pointIdx * 3 + j] = xbot[j];
        points[(pointIdx + 1) * 3 + j] = xtop[j];
        if (j < 2) {
          tcData[pointIdx * 2 + j] = tcbot[j];
          tcData[(pointIdx + 1) * 2 + j] = tctop[j];
        }
      }
    }

    // Generate polygons for sides
    for (let i = 0; i < model.resolution; i++) {
      polys[cellLocation++] = 4;
      polys[cellLocation++] = 2 * i;
      polys[cellLocation++] = 2 * i + 1;
      const pt = (2 * i + 3) % (2 * model.resolution);
      polys[cellLocation++] = pt;
      polys[cellLocation++] = pt - 1;
    }

    if (model.capping) {
      // Generate points for top/bottom polygons
      for (let i = 0; i < model.resolution; i++) {
        // x coordinate
        xbot[0] = model.radius * Math.cos(i * angle + model.initAngle);
        xtop[0] = xbot[0];
        tcbot[0] = xbot[0];
        tctop[0] = xbot[0];
        xbot[0] += model.center[0];
        xtop[0] += model.center[0];

        // y coordinate
        nbot[1] = 1.0;
        ntop[1] = -1.0;
        xbot[1] = 0.5 * model.height + model.center[1];
        xtop[1] = -0.5 * model.height + model.center[1];

        // z coordinate
        xbot[2] = -otherRadius * Math.sin(i * angle + model.initAngle);
        xtop[2] = xbot[2];
        tcbot[1] = xbot[2];
        tctop[1] = xbot[2];
        xbot[2] += model.center[2];
        xtop[2] += model.center[2];
        const botIdx = 2 * model.resolution + i;
        const topIdx = 3 * model.resolution + model.resolution - i - 1;
        for (let j = 0; j < 3; j++) {
          normalsData[3 * botIdx + j] = nbot[j];
          normalsData[3 * topIdx + j] = ntop[j];
          points[3 * botIdx + j] = xbot[j];
          points[3 * topIdx + j] = xtop[j];
          if (j < 2) {
            tcData[2 * botIdx + j] = tcbot[j];
            tcData[2 * topIdx + j] = tctop[j];
          }
        }
      }

      // Generate polygons for top/bottom
      polys[cellLocation++] = model.resolution;
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 2 * model.resolution + i;
      }
      polys[cellLocation++] = model.resolution;
      for (let i = 0; i < model.resolution; i++) {
        polys[cellLocation++] = 3 * model.resolution + i;
      }
    }

    // Apply transformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([0, 1, 0], model.direction)
      .translate(...model.center.map((c) => c * -1))
      .apply(points);

    dataset = vtkPolyData.newInstance();
    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(polys, 1);
    dataset.getPointData().setNormals(normals);
    dataset.getPointData().setTCoords(tcoords);

    // Update output
    outData[0] = dataset;
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  height: 1.0,
  initAngle: 0,
  radius: 1.0,
  resolution: 6,
  center: [0, 0, 0],
  direction: [0.0, 1.0, 0.0],
  capping: true,
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'height',
    'initAngle',
    'otherRadius',
    'radius',
    'resolution',
    'capping',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'direction'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkCylinderSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCylinderSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
