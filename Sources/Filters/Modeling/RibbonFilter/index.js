/* eslint-disable no-continue */
import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math/index';

const { vtkWarningMacro } = macro;

// Texture coordinate generation modes
const GenerateTCoords = {
  TCOORDS_OFF: 0,
  TCOORDS_FROM_SCALARS: 1,
  TCOORDS_FROM_LENGTH: 2,
  TCOORDS_FROM_NORMALIZED_LENGTH: 3,
};

// ----------------------------------------------------------------------------
// vtkRibbonFilter methods
// ----------------------------------------------------------------------------

function vtkRibbonFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRibbonFilter');

  // Private methods
  function generateSlidingNormals(points, lines, normals) {
    // Simplified normal generation for polylines
    // This is a basic implementation - you might want to use the actual vtk.js implementation
    const lineArray = lines.getData();
    let offset = 0;

    for (let cellId = 0; cellId < lines.getNumberOfCells(); cellId++) {
      const npts = lineArray[offset++];
      const pts = lineArray.slice(offset, offset + npts);
      offset += npts;

      if (npts < 2) continue;

      for (let i = 0; i < npts; i++) {
        const v1 = [0, 0, 0];
        const v2 = [0, 0, 0];

        if (i === 0) {
          points.getPoint(pts[1], v2);
          points.getPoint(pts[0], v1);
        } else if (i === npts - 1) {
          points.getPoint(pts[i], v2);
          points.getPoint(pts[i - 1], v1);
        } else {
          points.getPoint(pts[i + 1], v2);
          points.getPoint(pts[i - 1], v1);
        }

        const tangent = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        vtkMath.normalize(tangent);

        // Generate a normal perpendicular to the tangent
        let normal = [0, 0, 1];
        if (Math.abs(vtkMath.dot(tangent, normal)) > 0.9) {
          normal = [1, 0, 0];
        }

        const binormal = [0, 0, 0];
        vtkMath.cross(tangent, normal, binormal);
        vtkMath.normalize(binormal);
        vtkMath.cross(binormal, tangent, normal);
        vtkMath.normalize(normal);

        normals.setTuple(pts[i], normal);
      }
    }
    return true;
  }

  function generatePoints(
    offset,
    npts,
    pts,
    inPts,
    newPts,
    inScalars,
    range,
    inNormals,
    outPD,
    pd,
    newNormals
  ) {
    const theta = (model.angle * Math.PI) / 180.0;
    let ptId = offset;
    const p = [0, 0, 0];
    const pNext = [0, 0, 0];
    const sNext = [0, 0, 0];
    const sPrev = [0, 0, 0];

    for (let j = 0; j < npts; j++) {
      if (j === 0) {
        inPts.getPoint(pts[0], p);
        inPts.getPoint(pts[1], pNext);
        for (let i = 0; i < 3; i++) {
          sNext[i] = pNext[i] - p[i];
          sPrev[i] = sNext[i];
        }
      } else if (j === npts - 1) {
        for (let i = 0; i < 3; i++) {
          sPrev[i] = sNext[i];
          p[i] = pNext[i];
        }
      } else {
        for (let i = 0; i < 3; i++) {
          p[i] = pNext[i];
        }
        inPts.getPoint(pts[j + 1], pNext);
        for (let i = 0; i < 3; i++) {
          sPrev[i] = sNext[i];
          sNext[i] = pNext[i] - p[i];
        }
      }

      const n = [0, 0, 0];
      inNormals.getTuple(pts[j], n);

      if (vtkMath.normalize(sNext) === 0.0) {
        vtkWarningMacro('Coincident points!');
        return false;
      }

      const s = [
        (sPrev[0] + sNext[0]) / 2.0,
        (sPrev[1] + sNext[1]) / 2.0,
        (sPrev[2] + sNext[2]) / 2.0,
      ];

      if (vtkMath.normalize(s) === 0.0) {
        vtkMath.cross(sPrev, n, s);
        if (vtkMath.normalize(s) === 0.0) {
          vtkWarningMacro('Using alternate bevel vector');
        }
      }

      const w = vtkMath.cross(s, n, []);
      if (vtkMath.normalize(w) === 0.0) {
        vtkWarningMacro(`Bad normal s = ${s} n = ${n}`);
        return false;
      }

      const nP = vtkMath.cross(w, s, []);
      vtkMath.normalize(nP);

      let sFactor = 1.0;
      if (inScalars && model.varyWidth) {
        sFactor =
          1.0 +
          ((model.widthFactor - 1.0) *
            (inScalars.getValue(pts[j]) - range[0])) /
            (range[1] - range[0]);
      }

      const v = [
        w[0] * Math.cos(theta) + nP[0] * Math.sin(theta),
        w[1] * Math.cos(theta) + nP[1] * Math.sin(theta),
        w[2] * Math.cos(theta) + nP[2] * Math.sin(theta),
      ];

      const sp = [
        p[0] + model.width * sFactor * v[0],
        p[1] + model.width * sFactor * v[1],
        p[2] + model.width * sFactor * v[2],
      ];

      const sm = [
        p[0] - model.width * sFactor * v[0],
        p[1] - model.width * sFactor * v[1],
        p[2] - model.width * sFactor * v[2],
      ];

      newPts.setPoint(ptId, ...sm);
      newNormals.setTuple(ptId, nP);
      outPD.passData(pd, pts[j], ptId);
      ptId++;

      newPts.setPoint(ptId, ...sp);
      newNormals.setTuple(ptId, nP);
      outPD.passData(pd, pts[j], ptId);
      ptId++;
    }

    return true;
  }

  function generateStrip(offset, npts, inCellId, outCD, cd, newStrips) {
    const stripData = [];
    for (let i = 0; i < npts; i++) {
      const idx = 2 * i;
      stripData.push(offset + idx);
      stripData.push(offset + idx + 1);
    }

    newStrips.insertNextCell(stripData);
    const outCellId = newStrips.getNumberOfCells() - 1;
    outCD.passData(cd, inCellId, outCellId);
  }

  function generateTextureCoords(
    offset,
    npts,
    pts,
    inPts,
    inScalars,
    newTCoords
  ) {
    // First texture coordinate is always 0
    for (let k = 0; k < 2; k++) {
      newTCoords.setTuple(offset + k, [0.0, 0.0]);
    }

    if (
      model.generateTCoords === GenerateTCoords.TCOORDS_FROM_SCALARS &&
      inScalars
    ) {
      const s0 = inScalars.getValue(pts[0]);
      for (let i = 1; i < npts; i++) {
        const s = inScalars.getValue(pts[i]);
        const tc = (s - s0) / model.textureLength;
        for (let k = 0; k < 2; k++) {
          newTCoords.setTuple(offset + i * 2 + k, [tc, 0.0]);
        }
      }
    } else if (model.generateTCoords === GenerateTCoords.TCOORDS_FROM_LENGTH) {
      const xPrev = [0, 0, 0];
      const x = [0, 0, 0];
      let len = 0.0;
      inPts.getPoint(pts[0], xPrev);

      for (let i = 1; i < npts; i++) {
        inPts.getPoint(pts[i], x);
        len += Math.sqrt(vtkMath.distance2BetweenPoints(x, xPrev));
        const tc = len / model.textureLength;
        for (let k = 0; k < 2; k++) {
          newTCoords.setTuple(offset + i * 2 + k, [tc, 0.0]);
        }
        xPrev[0] = x[0];
        xPrev[1] = x[1];
        xPrev[2] = x[2];
      }
    } else if (
      model.generateTCoords === GenerateTCoords.TCOORDS_FROM_NORMALIZED_LENGTH
    ) {
      const xPrev = [0, 0, 0];
      const x = [0, 0, 0];
      let length = 0.0;
      let len = 0.0;

      // Calculate total length
      inPts.getPoint(pts[0], xPrev);
      for (let i = 1; i < npts; i++) {
        inPts.getPoint(pts[i], x);
        length += Math.sqrt(vtkMath.distance2BetweenPoints(x, xPrev));
        xPrev[0] = x[0];
        xPrev[1] = x[1];
        xPrev[2] = x[2];
      }

      // Generate normalized coordinates
      inPts.getPoint(pts[0], xPrev);
      for (let i = 1; i < npts; i++) {
        inPts.getPoint(pts[i], x);
        len += Math.sqrt(vtkMath.distance2BetweenPoints(x, xPrev));
        const tc = len / length;
        for (let k = 0; k < 2; k++) {
          newTCoords.setTuple(offset + i * 2 + k, [tc, 0.0]);
        }
        xPrev[0] = x[0];
        xPrev[1] = x[1];
        xPrev[2] = x[2];
      }
    }
  }

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();
    outData[0] = output;

    if (!input || !input.getPoints() || !input.getLines()) {
      return;
    }

    const inPts = input.getPoints();
    const inLines = input.getLines();
    const pd = input.getPointData();
    const cd = input.getCellData();

    const numPts = inPts.getNumberOfPoints();
    const numLines = inLines.getNumberOfCells();

    if (numPts < 1 || numLines < 1) {
      return;
    }

    // Get scalar data if available
    let inScalars = null;
    const scalarsArray = pd.getScalars();
    if (scalarsArray) {
      inScalars = scalarsArray;
    }

    let inNormals = pd.getNormals();
    let generateNormals = false;

    if (!inNormals || model.useDefaultNormal) {
      inNormals = vtkDataArray.newInstance({
        numberOfComponents: 3,
        size: numPts * 3,
        dataType: 'Float32Array',
      });

      if (model.useDefaultNormal) {
        for (let i = 0; i < numPts; i++) {
          inNormals.setTuple(i, model.defaultNormal);
        }
      } else {
        generateNormals = true;
      }
    }

    // Calculate scalar range if varying width
    let range = [0, 1];
    if (model.varyWidth && inScalars) {
      range = inScalars.getRange();
      if (range[1] - range[0] === 0.0) {
        vtkWarningMacro('Scalar range is zero!');
        range[1] = range[0] + 1.0;
      }
    }

    const numNewPts = 2 * numPts;
    const newPts = vtkPoints.newInstance();
    newPts.setNumberOfPoints(numNewPts);

    const newNormals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      size: numNewPts * 3,
    });

    const newStrips = vtkCellArray.newInstance();

    const outPD = output.getPointData();
    outPD.copyStructure(pd);

    const outCD = output.getCellData();
    outCD.copyStructure(cd);

    let newTCoords = null;
    if (model.generateTCoords !== GenerateTCoords.TCOORDS_OFF) {
      newTCoords = vtkDataArray.newInstance({
        numberOfComponents: 2,
        size: numNewPts * 2,
      });
    }

    // Process each polyline
    const lineArray = inLines.getData();
    let offset = 0;
    let arrayOffset = 0;

    for (let inCellId = 0; inCellId < numLines; inCellId++) {
      const npts = lineArray[arrayOffset++];
      const pts = lineArray.slice(arrayOffset, arrayOffset + npts);
      arrayOffset += npts;

      if (npts < 2) {
        vtkWarningMacro('Less than two points in line!');
        continue;
      }

      // Generate normals if needed
      if (generateNormals) {
        const singlePolyline = vtkCellArray.newInstance();
        singlePolyline.insertNextCell(pts);
        if (!generateSlidingNormals(inPts, singlePolyline, inNormals)) {
          vtkWarningMacro('No normals for line!');
          continue;
        }
      }

      // Generate points for this polyline
      if (
        !generatePoints(
          offset,
          npts,
          pts,
          inPts,
          newPts,
          inScalars,
          range,
          inNormals,
          outPD,
          pd,
          newNormals
        )
      ) {
        vtkWarningMacro('Could not generate points!');
        continue;
      }

      // Generate strip for this polyline
      generateStrip(offset, npts, inCellId, outCD, cd, newStrips);

      // Generate texture coordinates if needed
      if (newTCoords) {
        generateTextureCoords(offset, npts, pts, inPts, inScalars, newTCoords);
      }

      // Update offset for next polyline
      offset += 2 * npts;
    }

    // Set output data
    output.setPoints(newPts);
    output.setStrips(newStrips);
    outPD.setNormals(newNormals);

    if (newTCoords) {
      outPD.setTCoords(newTCoords);
    }
  };

  publicAPI.getGenerateTCoordsAsString = () => {
    switch (model.generateTCoords) {
      case GenerateTCoords.TCOORDS_OFF:
        return 'GenerateTCoordsOff';
      case GenerateTCoords.TCOORDS_FROM_SCALARS:
        return 'GenerateTCoordsFromScalar';
      case GenerateTCoords.TCOORDS_FROM_LENGTH:
        return 'GenerateTCoordsFromLength';
      case GenerateTCoords.TCOORDS_FROM_NORMALIZED_LENGTH:
        return 'GenerateTCoordsFromNormalizedLength';
      default:
        return 'GenerateTCoordsOff';
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  width: 0.5,
  angle: 0.0,
  varyWidth: false,
  widthFactor: 2.0,
  defaultNormal: [0.0, 0.0, 1.0],
  useDefaultNormal: false,
  generateTCoords: GenerateTCoords.TCOORDS_OFF,
  textureLength: 1.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  // Set/Get methods
  macro.setGet(publicAPI, model, [
    'width',
    'angle',
    'varyWidth',
    'widthFactor',
    'useDefaultNormal',
    'generateTCoords',
    'textureLength',
  ]);

  macro.setGetArray(publicAPI, model, ['defaultNormal'], 3);

  // Object specific methods
  vtkRibbonFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRibbonFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend, GenerateTCoords };
