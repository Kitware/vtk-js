import { vec3, mat3 } from 'gl-matrix';
import * as d3 from 'd3-scale';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// vtkCubeAxesActor
// ----------------------------------------------------------------------------
// faces are +x -x +y -y +z -z
// point 0 is 0,0,0 and then +x fastest changing, +y then +z
const faceNormals = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
];
const faceEdges = [
  [8, 7, 11, 3],
  [9, 1, 10, 5],
  [4, 9, 0, 8],
  [2, 11, 6, 10],
  [0, 3, 2, 1],
  [4, 5, 6, 7],
];
const edgePoints = [
  [0, 1],
  [1, 3],
  [2, 3],
  [0, 2],
  [4, 5],
  [5, 7],
  [6, 7],
  [4, 6],
  [0, 4],
  [1, 5],
  [3, 7],
  [2, 6],
];
const edgeAxes = [0, 1, 0, 1, 0, 1, 0, 1, 2, 2, 2, 2];
const faceAxes = [
  [1, 2],
  [1, 2],
  [0, 2],
  [0, 2],
  [0, 1],
  [0, 1],
];

function vtkCubeAxesActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeAxesActor');

  publicAPI.setCamera = (cam) => {
    if (model.camera === cam) {
      return;
    }
    if (model.cameraModifiedSub) {
      model.cameraModifiedSub.unsubscribe();
      model.cameraModifiedSub = null;
    }
    model.camera = cam;
    if (cam) {
      model.cameraModifiedSub = cam.onModified(publicAPI.update);
    }
    publicAPI.update();
    publicAPI.modified();
  };

  // estimate from a camera model what faces to draw
  // return true if the list of faces to draw hads changed
  publicAPI.computeFacesToDraw = () => {
    let changed = false;
    const length = vtkBoundingBox.getDiagonalLength(model.dataBounds);
    const center = vec3.create();
    const tmpv3 = vec3.create();
    const tmp2v3 = vec3.create();
    const cmat = model.camera.getCompositeProjectionMatrix(1, -1, 1);
    for (let f = 0; f < 6; f++) {
      // for each face transform the center and off center
      const faceAxis = Math.floor(f / 2);
      const otherAxis1 = (faceAxis + 1) % 3;
      const otherAxis2 = (faceAxis + 2) % 3;
      center[faceAxis] = model.dataBounds[f];
      center[otherAxis1] =
        0.5 *
        (model.dataBounds[otherAxis1 * 2] +
          model.dataBounds[otherAxis1 * 2 + 1]);
      center[otherAxis2] =
        0.5 *
        (model.dataBounds[otherAxis2 * 2] +
          model.dataBounds[otherAxis2 * 2 + 1]);
      vec3.transformMat4(tmpv3, center, cmat);
      center[faceAxis] += 0.1 * length * faceNormals[f][faceAxis];
      vec3.transformMat4(tmp2v3, center, cmat);
      vec3.subtract(tmpv3, tmp2v3, tmpv3);
      vec3.normalize(tmpv3, tmpv3);
      const drawit = tmpv3[2] > 0.05;
      if (drawit !== model.lastFacesToDraw[f]) {
        model.lastFacesToDraw[f] = drawit;
        changed = true;
      }
    }
    return changed;
  };

  publicAPI.updatePolyData = (facesToDraw, edgesToDraw, ticks) => {
    // compute the number of points and lines required
    let numPts = 0;
    let numLines = 0;
    numPts += 8; // always start with the 8 cube points

    // count edgesToDraw
    let numEdgesToDraw = 0;
    for (let e = 0; e < 12; e++) {
      if (edgesToDraw[e] > 0) {
        numEdgesToDraw++;
      }
    }
    numLines += numEdgesToDraw;

    // add values for gridlines
    if (model.gridLines) {
      for (let f = 0; f < 6; f++) {
        if (facesToDraw[f]) {
          numPts +=
            ticks[faceAxes[f][0]].length * 2 + ticks[faceAxes[f][1]].length * 2;
          numLines +=
            ticks[faceAxes[f][0]].length + ticks[faceAxes[f][1]].length;
        }
      }
    }

    // now allocate the memory
    const points = new Float64Array(numPts * 3);
    const lines = new Uint32Array(numLines * 3);

    let ptIdx = 0;
    let lineIdx = 0;

    // add the 8 corner points
    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          points[ptIdx * 3] = model.dataBounds[x];
          points[ptIdx * 3 + 1] = model.dataBounds[2 + y];
          points[ptIdx * 3 + 2] = model.dataBounds[4 + z];
          ptIdx++;
        }
      }
    }

    // draw the edges
    for (let e = 0; e < 12; e++) {
      if (edgesToDraw[e] > 0) {
        lines[lineIdx * 3] = 2;
        lines[lineIdx * 3 + 1] = edgePoints[e][0];
        lines[lineIdx * 3 + 2] = edgePoints[e][1];
        lineIdx++;
      }
    }

    // now handle gridlines
    // grid lines are tick[axis1] + ticks[axes2] lines each having two points
    // for simplicity we don;t worry about duplicating points, this is tiny

    if (model.gridLines) {
      // for each visible face
      // add the points
      for (let f = 0; f < 6; f++) {
        if (facesToDraw[f]) {
          const faceIdx = Math.floor(f / 2);
          let aticks = ticks[faceAxes[f][0]];
          for (let t = 0; t < aticks.length; t++) {
            points[ptIdx * 3 + faceIdx] = model.dataBounds[f];
            points[ptIdx * 3 + faceAxes[f][0]] = aticks[t];
            points[ptIdx * 3 + faceAxes[f][1]] =
              model.dataBounds[faceAxes[f][1] * 2];
            ptIdx++;
            points[ptIdx * 3 + faceIdx] = model.dataBounds[f];
            points[ptIdx * 3 + faceAxes[f][0]] = aticks[t];
            points[ptIdx * 3 + faceAxes[f][1]] =
              model.dataBounds[faceAxes[f][1] * 2 + 1];
            ptIdx++;
            lines[lineIdx * 3] = 2;
            lines[lineIdx * 3 + 1] = ptIdx - 2;
            lines[lineIdx * 3 + 2] = ptIdx - 1;
            lineIdx++;
          }
          aticks = ticks[faceAxes[f][1]];
          for (let t = 0; t < aticks.length; t++) {
            points[ptIdx * 3 + faceIdx] = model.dataBounds[f];
            points[ptIdx * 3 + faceAxes[f][1]] = aticks[t];
            points[ptIdx * 3 + faceAxes[f][0]] =
              model.dataBounds[faceAxes[f][0] * 2];
            ptIdx++;
            points[ptIdx * 3 + faceIdx] = model.dataBounds[f];
            points[ptIdx * 3 + faceAxes[f][1]] = aticks[t];
            points[ptIdx * 3 + faceAxes[f][0]] =
              model.dataBounds[faceAxes[f][0] * 2 + 1];
            ptIdx++;
            lines[lineIdx * 3] = 2;
            lines[lineIdx * 3 + 1] = ptIdx - 2;
            lines[lineIdx * 3 + 2] = ptIdx - 1;
            lineIdx++;
          }
        }
      }
    }
    model.polyData.getPoints().setData(points, 3);
    model.polyData.getPoints().modified();
    model.polyData.getLines().setData(lines, 1);
    model.polyData.getLines().modified();
    model.polyData.modified();
  };

  publicAPI.updateTextData = (facesToDraw, edgesToDraw, ticks, tickStrings) => {
    // count outside edgesToDraw
    let textPointCount = 0;
    for (let e = 0; e < 12; e++) {
      if (edgesToDraw[e] === 1) {
        textPointCount += 2;
        textPointCount += ticks[edgeAxes[e]].length;
      }
    }

    const points = model.polyData.getPoints().getData();
    const textPoints = new Float64Array(textPointCount * 3);

    let ptIdx = 0;
    let textIdx = 0;
    let axisCount = 0;
    for (let f = 0; f < 6; f++) {
      if (facesToDraw[f]) {
        for (let e = 0; e < 4; e++) {
          const edgeIdx = faceEdges[f][e];
          if (edgesToDraw[edgeIdx] === 1) {
            const edgeAxis = edgeAxes[edgeIdx];
            // add a middle point on the edge
            const ptIdx1 = edgePoints[edgeIdx][0] * 3;
            const ptIdx2 = edgePoints[edgeIdx][1] * 3;
            textPoints[ptIdx * 3] = 0.5 * (points[ptIdx1] + points[ptIdx2]);
            textPoints[ptIdx * 3 + 1] =
              0.5 * (points[ptIdx1 + 1] + points[ptIdx2 + 1]);
            textPoints[ptIdx * 3 + 2] =
              0.5 * (points[ptIdx1 + 2] + points[ptIdx2 + 2]);
            ptIdx++;
            // add a middle face point, we use this to
            // move the labels away from the edge in the right direction
            const faceIdx = Math.floor(f / 2);
            textPoints[ptIdx * 3 + faceIdx] = model.dataBounds[f];
            textPoints[ptIdx * 3 + faceAxes[f][0]] =
              0.5 *
              (model.dataBounds[faceAxes[f][0] * 2] +
                model.dataBounds[faceAxes[f][0] * 2 + 1]);
            textPoints[ptIdx * 3 + faceAxes[f][1]] =
              0.5 *
              (model.dataBounds[faceAxes[f][1] * 2] +
                model.dataBounds[faceAxes[f][1] * 2 + 1]);
            ptIdx++;
            // set the text
            model.textValues[textIdx] = model.axesLabels[edgeAxis];
            textIdx++;

            // now add the tick marks along the edgeAxis
            const otherAxis1 = (edgeAxis + 1) % 3;
            const otherAxis2 = (edgeAxis + 2) % 3;
            const aticks = ticks[edgeAxis];
            const atickStrings = tickStrings[edgeAxis];
            model.tickCounts[axisCount] = aticks.length;
            for (let t = 0; t < aticks.length; t++) {
              textPoints[ptIdx * 3 + edgeAxis] = aticks[t];
              textPoints[ptIdx * 3 + otherAxis1] = points[ptIdx1 + otherAxis1];
              textPoints[ptIdx * 3 + otherAxis2] = points[ptIdx1 + otherAxis2];
              ptIdx++;
              // set the text
              model.textValues[textIdx] = atickStrings[t];
              textIdx++;
            }
            axisCount++;
          }
        }
      }
    }
    model.textPolyData.getPoints().setData(textPoints, 3);
    model.textPolyData.modified();
  };

  publicAPI.update = (force = false) => {
    // compute what faces to draw
    const changed = publicAPI.computeFacesToDraw();
    if (!changed && !force) {
      return;
    }

    const facesToDraw = model.lastFacesToDraw;

    // compute the edges to draw
    // for each drawn face, mark edges, all single mark edges we draw
    const edgesToDraw = [];
    for (let e = 0; e < 12; e++) {
      edgesToDraw[e] = 0;
    }
    for (let f = 0; f < 6; f++) {
      if (facesToDraw[f]) {
        for (let e = 0; e < 4; e++) {
          edgesToDraw[faceEdges[f][e]]++;
        }
      }
    }

    // compute tick marks for axes
    const ticks = [];
    const tickStrings = [];
    for (let i = 0; i < 3; i++) {
      const scale = d3
        .scaleLinear()
        .domain([model.dataBounds[i * 2], model.dataBounds[i * 2 + 1]]);
      ticks[i] = scale.ticks(5);
      const format = scale.tickFormat(5);
      tickStrings[i] = ticks[i].map(format);
    }

    // build the polydata
    publicAPI.updatePolyData(facesToDraw, edgesToDraw, ticks);

    // setup text labels
    publicAPI.updateTextData(facesToDraw, edgesToDraw, ticks, tickStrings);
  };

  publicAPI.getActors = () => {
    const actors = [];
    actors.push(model.actor);
    actors.push(model.pixelActor);
    return actors;
  };

  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.setContainer = (container) => {
    if (model.container && model.container !== container) {
      model.container.removeChild(model.textCanvas);
    }

    if (model.container !== container) {
      model.container = container;

      if (model.container) {
        model.container.appendChild(model.textCanvas);
      }

      publicAPI.modified();
    }
  };

  publicAPI.setGridLines = (val) => {
    if (model.gridLines === val) {
      return;
    }
    model.gridLines = val;
    publicAPI.update(true);
    publicAPI.modified();
  };

  publicAPI.setAxesLabels = (...args) => {
    let array = args;
    // allow an array passed as a single arg.
    if (array.length === 1 && Array.isArray(array[0])) {
      /* eslint-disable prefer-destructuring */
      array = array[0];
      /* eslint-enable prefer-destructuring */
    }

    if (array.length !== 3) {
      throw new RangeError(
        `Invalid number of values for array setter (AxesLabels)`
      );
    }

    let changeDetected = false;
    model.axesLabels.forEach((item, index) => {
      if (item !== array[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected || model.axesLabels.length !== array.length) {
      model.axelLabels = [].concat(array);
      publicAPI.update(true);
      publicAPI.modified();
      return true;
    }
    return false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  camera: null,
  container: null,
  dataBounds: null,
  gridLines: true,
  axesLabels: null,
};

function setTextPropertyBasedOnDirection(ctx, dir) {
  if (dir[0] < -0.5) {
    ctx.textAlign = 'right';
  } else if (dir[0] > 0.5) {
    ctx.textAlign = 'left';
  } else {
    ctx.textAlign = 'center';
  }
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  model.normalMatrix = mat3.create();
  model.dataBounds = [1, -1, 1, -1, 1, -1];

  model.lastFacesToDraw = [false, false, false, false, false, false];
  model.axesLabels = ['X-Axis', 'Y-Axis', 'Z-Axis'];
  model.tickCounts = [];
  model.textValues = [];

  model.mapper = vtkMapper.newInstance();
  model.polyData = vtkPolyData.newInstance();
  model.mapper.setInputData(model.polyData);
  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);

  publicAPI.getProperty().setDiffuse(0.0);
  publicAPI.getProperty().setAmbient(1.0);

  model.textCanvas = document.createElement('canvas');
  model.textCanvas.style.position = 'absolute';
  model.textCtx = model.textCanvas.getContext('2d');
  model.textPolyData = vtkPolyData.newInstance();

  // PixelSpaceCallbackMapper
  model.pixelMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.pixelMapper.setInputData(model.textPolyData);
  model.pixelMapper.setCallback((coords, camera, aspect, depthValues, size) => {
    if (model.textCanvas) {
      // const yOffset = 0;

      // if (model.verticalAlign === VerticalAlign.BOTTOM) {
      //   yOffset = -model.textCanvas.height;
      // } else if (model.verticalAlign === VerticalAlign.CENTER) {
      //   yOffset = -0.5 * model.textCanvas.height;
      // }

      // const dpr = window.devicePixelRatio;

      model.textCanvas.width = size[0];
      model.textCanvas.height = size[1];
      model.textCanvas.style.left = `8px`;
      model.textCanvas.style.top = `8px`;
      // model.textCanvas.style.bottom = `${size[1] / dpr}px`;
      // model.textCtx.fillRect(0, 0, size[0], size[1]);
      model.textCtx.clearRect(0, 0, size[0], size[1]);
      model.textCtx.fillStyle = 'rgb(255,180,100)';
      model.textCtx.font = '15px serif';
      model.textCtx.textBaseline = 'middle';
      let ptIdx = 0;
      let textIdx = 0;
      let axisIdx = 0;
      while (ptIdx < coords.length) {
        // compute the direction to move out
        const dir = [
          coords[ptIdx][0] - coords[ptIdx + 1][0],
          coords[ptIdx][1] - coords[ptIdx + 1][1],
        ];
        vtkMath.normalize2D(dir);
        setTextPropertyBasedOnDirection(model.textCtx, dir);

        // write the axis label
        model.textCtx.fillText(
          model.textValues[textIdx],
          coords[ptIdx][0] + 35.0 * dir[0],
          size[1] - coords[ptIdx][1] - 35.0 * dir[1]
        );
        ptIdx += 2;
        textIdx++;

        // write the tick labels
        for (let t = 0; t < model.tickCounts[axisIdx]; t++) {
          model.textCtx.fillText(
            model.textValues[textIdx],
            coords[ptIdx][0] + 12.0 * dir[0],
            size[1] - coords[ptIdx][1] - 12.0 * dir[1]
          );
          ptIdx++;
          textIdx++;
        }
        axisIdx++;
      }
      publicAPI.modified();
    }
  });

  model.pixelActor = vtkActor.newInstance();
  model.pixelActor.setMapper(model.pixelMapper);

  macro.setGet(publicAPI, model, ['cornerOffset']);

  macro.setGetArray(publicAPI, model, ['dataBounds'], 6);
  macro.getArray(publicAPI, model, ['axesLabels'], 3);
  macro.get(publicAPI, model, ['camera', 'container', 'gridLines']);

  // Object methods
  vtkCubeAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
