import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkDiskSource methods
// ----------------------------------------------------------------------------

function vtkDiskSource(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkDiskSource');

  publicAPI.requestData = (inData, outData) => {
    const {
      innerRadius,
      outerRadius,
      center,
      normal,
      radialResolution,
      circumferentialResolution,
      pointType,
    } = model;

    // Points
    const points = vtkPoints.newInstance({
      dataType: pointType,
    });

    const n = [normal[0], normal[1], normal[2]];
    const length = Math.hypot(n[0], n[1], n[2]);
    if (length === 0) {
      vtkErrorMacro('Normal vector cannot be zero-length');
      return;
    }
    n[0] /= length;
    n[1] /= length;
    n[2] /= length;

    const matrix = vtkMatrixBuilder
      .buildFromDegree()
      .identity()
      .translate(-center[0], -center[1], -center[2])
      .rotateFromDirections([0, 0, 1], n)
      .translate(center[0], center[1], center[2])
      .getMatrix();

    const polys = vtkCellArray.newInstance();

    // Generate points
    const deltaR = (outerRadius - innerRadius) / radialResolution;
    const thetaStep = (2.0 * Math.PI) / circumferentialResolution;
    for (let i = 0; i < circumferentialResolution; i++) {
      const theta = i * thetaStep;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      for (let j = 0; j <= radialResolution; j++) {
        const r = innerRadius + j * deltaR;
        // point in XY plane before transform
        const localPoint = [
          center[0] + r * cosT,
          center[1] + r * sinT,
          center[2],
        ];
        // apply matrix transform
        const x =
          matrix[0] * localPoint[0] +
          matrix[4] * localPoint[1] +
          matrix[8] * localPoint[2] +
          matrix[12];
        const y =
          matrix[1] * localPoint[0] +
          matrix[5] * localPoint[1] +
          matrix[9] * localPoint[2] +
          matrix[13];
        const z =
          matrix[2] * localPoint[0] +
          matrix[6] * localPoint[1] +
          matrix[10] * localPoint[2] +
          matrix[14];
        points.insertNextPoint(x, y, z);
      }
    }

    // Generate cell connectivity (quads)
    const cellCount = radialResolution * circumferentialResolution;
    const cellData = new Uint8Array(cellCount * 5);
    let offset = 0;
    for (let i = 0; i < model.circumferentialResolution; i++) {
      for (let j = 0; j < model.radialResolution; j++) {
        const p0 = i * (model.radialResolution + 1) + j;
        const p1 = p0 + 1;
        const p2 =
          i < model.circumferentialResolution - 1
            ? p1 + (model.radialResolution + 1)
            : j + 1; // wrap around
        const p3 = p2 - 1;

        cellData[offset++] = 4;
        cellData[offset++] = p0;
        cellData[offset++] = p1;
        cellData[offset++] = p2;
        cellData[offset++] = p3;
      }
    }
    polys.setData(cellData, cellCount, 1);

    const dataset = outData[0]?.initialize() || vtkPolyData.newInstance();
    dataset.setPoints(points);
    dataset.setPolys(polys);

    // Update output
    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    innerRadius: 0.25,
    outerRadius: 0.5,
    center: [0, 0, 0],
    normal: [0, 0, 1],
    radialResolution: 1,
    circumferentialResolution: 6,
    pointType: 'Float64Array',
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'innerRadius',
    'outerRadius',
    'radialResolution',
    'circumferentialResolution',
    'pointType',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'normal'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkDiskSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDiskSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
