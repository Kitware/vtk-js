import { vec3, mat4 } from 'gl-matrix';
import * as d3 from 'd3-scale';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// vtkCubeAxesActor
// ----------------------------------------------------------------------------
// faces are -x x -y y -z z
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

//
// Developer note: This class is broken into the main class and a helper
// class. The main class holds view independent properties (those properties
// that do not change as the view's resolution/aspect ratio change). The
// helper class is instantiated one per view and holds properties that can
// depend on view specific values such as resolution. The helper class code
// could have been left to the View specific implementation (such as
// vtkWebGPUCubeAxesActor) but is instead placed here to it can be shared by
// multiple rendering backends.
//

// some shared temp variables to reduce heap allocs
const ptv3 = new Float64Array(3);
const pt2v3 = new Float64Array(3);
const tmpv3 = new Float64Array(3);
const tmp2v3 = new Float64Array(3);
const xDir = new Float64Array(3);
const yDir = new Float64Array(3);
const invmat = new Float64Array(16);

function applyTextStyle(ctx, style) {
  ctx.strokeStyle = style.strokeColor;
  ctx.lineWidth = style.strokeSize;
  ctx.fillStyle = style.fontColor;
  ctx.font = `${style.fontStyle} ${style.fontSize}px ${style.fontFamily}`;
}

// many properties of this actor depend on the API specific view The main
// dependency being the resolution as that drives what font sizes to use.
// Bacause of this we need to do some of the calculations in a API specific
// subclass. But... we don't want a lot of duplicated code between WebGL and
// WebGPU for example so we have this helper class, that is designed to be
// fairly API independent so that API specific views can call this to do
// most of the work.
function vtkCubeAxesActorHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeAxesActorHelper');

  publicAPI.setRenderable = (renderable) => {
    if (model.renderable === renderable) {
      return;
    }
    model.renderable = renderable;
    model.tmActor.addTexture(model.renderable.getTmTexture());
    model.tmActor.setProperty(renderable.getProperty());
    model.tmActor.setParentProp(renderable);

    publicAPI.modified();
  };

  // called by updateTexturePolyData
  publicAPI.createPolyDataForOneLabel = (
    text,
    pos,
    cmat,
    imat,
    dir,
    offset,
    results
  ) => {
    const value = model.renderable.get_tmAtlas().get(text);
    if (!value) {
      return;
    }
    const coords = model.renderable.getTextPolyData().getPoints().getData();

    // compute pixel to distance factors
    const size = model.lastSize;
    ptv3[0] = coords[pos * 3];
    ptv3[1] = coords[pos * 3 + 1];
    ptv3[2] = coords[pos * 3 + 2];
    vec3.transformMat4(tmpv3, ptv3, cmat);
    // moving 0.1 in NDC
    tmpv3[0] += 0.1;
    vec3.transformMat4(pt2v3, tmpv3, imat);
    // results in WC move of
    vec3.subtract(xDir, pt2v3, ptv3);
    tmpv3[0] -= 0.1;
    tmpv3[1] += 0.1;
    vec3.transformMat4(pt2v3, tmpv3, imat);
    // results in WC move of
    vec3.subtract(yDir, pt2v3, ptv3);
    for (let i = 0; i < 3; i++) {
      xDir[i] /= 0.5 * 0.1 * size[0];
      yDir[i] /= 0.5 * 0.1 * size[1];
    }

    // have to find the four corners of the texture polygon for this label
    // convert anchor point to View Coords
    let ptIdx = results.ptIdx;
    let cellIdx = results.cellIdx;
    ptv3[0] = coords[pos * 3];
    ptv3[1] = coords[pos * 3 + 1];
    ptv3[2] = coords[pos * 3 + 2];
    // horizontal left, right, or middle alignment based on dir[0]
    if (dir[0] < -0.5) {
      vec3.scale(tmpv3, xDir, dir[0] * offset - value.width);
    } else if (dir[0] > 0.5) {
      vec3.scale(tmpv3, xDir, dir[0] * offset);
    } else {
      vec3.scale(tmpv3, xDir, dir[0] * offset - value.width / 2.0);
    }
    vec3.add(ptv3, ptv3, tmpv3);
    vec3.scale(tmpv3, yDir, dir[1] * offset - value.height / 2.0);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[0];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[1];
    ptIdx++;
    vec3.scale(tmpv3, xDir, value.width);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[2];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[3];
    ptIdx++;
    vec3.scale(tmpv3, yDir, value.height);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[4];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[5];
    ptIdx++;
    vec3.scale(tmpv3, xDir, value.width);
    vec3.subtract(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[6];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[7];
    ptIdx++;

    // add the two triangles to represent the quad
    results.polys[cellIdx * 4] = 3;
    results.polys[cellIdx * 4 + 1] = ptIdx - 4;
    results.polys[cellIdx * 4 + 2] = ptIdx - 3;
    results.polys[cellIdx * 4 + 3] = ptIdx - 2;
    cellIdx++;
    results.polys[cellIdx * 4] = 3;
    results.polys[cellIdx * 4 + 1] = ptIdx - 4;
    results.polys[cellIdx * 4 + 2] = ptIdx - 2;
    results.polys[cellIdx * 4 + 3] = ptIdx - 1;

    results.ptIdx += 4;
    results.cellIdx += 2;
  };

  // update the polydata associated with drawing the text labels
  // specifically the quads used for each label and their associated tcoords
  // etc. This changes every time the camera viewpoint changes
  publicAPI.updateTexturePolyData = () => {
    const cmat = model.camera.getCompositeProjectionMatrix(
      model.lastAspectRatio,
      -1,
      1
    );
    mat4.transpose(cmat, cmat);

    // update the polydata
    const numLabels = model.renderable.getTextValues().length;
    const numPts = numLabels * 4;
    const numTris = numLabels * 2;
    const points = new Float64Array(numPts * 3);
    const polys = new Uint16Array(numTris * 4);
    const tcoords = new Float32Array(numPts * 2);

    mat4.invert(invmat, cmat);

    const results = {
      ptIdx: 0,
      cellIdx: 0,
      polys,
      points,
      tcoords,
    };
    let ptIdx = 0;
    let textIdx = 0;
    let axisIdx = 0;
    const coords = model.renderable.getTextPolyData().getPoints().getData();
    const textValues = model.renderable.getTextValues();
    while (ptIdx < coords.length / 3) {
      // compute the direction to move out
      ptv3[0] = coords[ptIdx * 3];
      ptv3[1] = coords[ptIdx * 3 + 1];
      ptv3[2] = coords[ptIdx * 3 + 2];
      vec3.transformMat4(tmpv3, ptv3, cmat);
      ptv3[0] = coords[ptIdx * 3 + 3];
      ptv3[1] = coords[ptIdx * 3 + 4];
      ptv3[2] = coords[ptIdx * 3 + 5];
      vec3.transformMat4(tmp2v3, ptv3, cmat);
      vec3.subtract(tmpv3, tmpv3, tmp2v3);
      const dir = [tmpv3[0], tmpv3[1]];
      vtkMath.normalize2D(dir);

      // write the axis label
      publicAPI.createPolyDataForOneLabel(
        textValues[textIdx],
        ptIdx,
        cmat,
        invmat,
        dir,
        model.renderable.getAxisTitlePixelOffset(),
        results
      );
      ptIdx += 2;
      textIdx++;

      // write the tick labels
      for (let t = 0; t < model.renderable.getTickCounts()[axisIdx]; t++) {
        publicAPI.createPolyDataForOneLabel(
          textValues[textIdx],
          ptIdx,
          cmat,
          invmat,
          dir,
          model.renderable.getTickLabelPixelOffset(),
          results
        );
        ptIdx++;
        textIdx++;
      }
      axisIdx++;
    }

    const tcoordDA = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: tcoords,
      name: 'TextureCoordinates',
    });
    model.tmPolyData.getPointData().setTCoords(tcoordDA);
    model.tmPolyData.getPoints().setData(points, 3);
    model.tmPolyData.getPoints().modified();
    model.tmPolyData.getPolys().setData(polys, 1);
    model.tmPolyData.getPolys().modified();
    model.tmPolyData.modified();
  };

  publicAPI.updateAPISpecificData = (size, camera, renderWindow) => {
    // has the size changed?
    if (model.lastSize[0] !== size[0] || model.lastSize[1] !== size[1]) {
      model.lastSize[0] = size[0];
      model.lastSize[1] = size[1];
      model.lastAspectRatio = size[0] / size[1];
      model.forceUpdate = true;
    }

    model.camera = camera;

    // compute bounds for label quads whenever the camera changes
    publicAPI.updateTexturePolyData();
  };
}

const newCubeAxesActorHelper = macro.newInstance(
  (publicAPI, model, initialValues = { renderable: null }) => {
    Object.assign(model, {}, initialValues);

    // Inheritance
    macro.obj(publicAPI, model);

    model.tmPolyData = vtkPolyData.newInstance();
    model.tmMapper = vtkMapper.newInstance();
    model.tmMapper.setInputData(model.tmPolyData);
    model.tmActor = vtkActor.newInstance({ parentProp: publicAPI });
    model.tmActor.setMapper(model.tmMapper);

    macro.setGet(publicAPI, model, ['renderable']);
    macro.get(publicAPI, model, [
      'lastSize',
      'lastAspectRatio',
      'axisTextStyle',
      'tickTextStyle',
      'tmActor',
      'ticks',
    ]);

    model.forceUpdate = false;
    model.lastRedrawTime = {};
    macro.obj(model.lastRedrawTime, { mtime: 0 });
    model.lastRebuildTime = {};
    macro.obj(model.lastRebuildTime, { mtime: 0 });
    model.lastSize = [-1, -1];

    // internal variables
    model.lastTickBounds = [];

    vtkCubeAxesActorHelper(publicAPI, model);
  },
  'vtkCubeAxesActorHelper'
);

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
  // return true if the list of faces to draw has changed
  publicAPI.computeFacesToDraw = () => {
    const cmat = model.camera.getViewMatrix();
    mat4.transpose(cmat, cmat);

    let changed = false;
    const length = vtkBoundingBox.getDiagonalLength(model.dataBounds);
    const faceDot = Math.sin((model.faceVisibilityAngle * Math.PI) / 180.0);
    for (let f = 0; f < 6; f++) {
      let drawit = false;
      const faceAxis = Math.floor(f / 2);
      const otherAxis1 = (faceAxis + 1) % 3;
      const otherAxis2 = (faceAxis + 2) % 3;
      // only for non degenerate axes
      if (
        model.dataBounds[otherAxis1 * 2] !==
          model.dataBounds[otherAxis1 * 2 + 1] &&
        model.dataBounds[otherAxis2 * 2] !==
          model.dataBounds[otherAxis2 * 2 + 1]
      ) {
        // for each face transform the center and off center to get a direction vector
        ptv3[faceAxis] =
          model.dataBounds[f] - 0.1 * length * faceNormals[f][faceAxis];
        ptv3[otherAxis1] =
          0.5 *
          (model.dataBounds[otherAxis1 * 2] +
            model.dataBounds[otherAxis1 * 2 + 1]);
        ptv3[otherAxis2] =
          0.5 *
          (model.dataBounds[otherAxis2 * 2] +
            model.dataBounds[otherAxis2 * 2 + 1]);
        vec3.transformMat4(tmpv3, ptv3, cmat);
        ptv3[faceAxis] = model.dataBounds[f];
        vec3.transformMat4(tmp2v3, ptv3, cmat);
        vec3.subtract(tmpv3, tmp2v3, tmpv3);
        vec3.normalize(tmpv3, tmpv3);
        // tmpv3 now holds the face normal vector
        drawit = tmpv3[2] > faceDot;
        // for perspctive we need the view direction to the plane
        if (!model.camera.getParallelProjection()) {
          vec3.normalize(tmp2v3, tmp2v3);
          drawit = vec3.dot(tmp2v3, tmpv3) > faceDot;
        }
      }
      if (drawit !== model.lastFacesToDraw[f]) {
        model.lastFacesToDraw[f] = drawit;
        changed = true;
      }
    }
    return changed;
  };

  // update the polydata that represents the boundingd edges and gridlines
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

  // update the data that represents where to put the labels
  // in world coordinates. This only changes when faces to draw changes
  // of dataBounds changes
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
            model.textValues[textIdx] = model.axisLabels[edgeAxis];
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

  // main method to rebuild the cube axes, gets called on camera modify
  // and changes to key members
  publicAPI.update = () => {
    // Can't do anything if we don't have a camera...
    if (!model.camera) {
      return;
    }

    // compute what faces to draw
    const facesChanged = publicAPI.computeFacesToDraw();
    const facesToDraw = model.lastFacesToDraw;

    // have the bounds changed?
    let boundsChanged = false;
    for (let i = 0; i < 6; i++) {
      if (model.dataBounds[i] !== model.lastTickBounds[i]) {
        boundsChanged = true;
        model.lastTickBounds[i] = model.dataBounds[i];
      }
    }

    // did something significant change? If so rebuild a lot of things
    if (facesChanged || boundsChanged || model.forceUpdate) {
      // compute the edges to draw
      // for each drawn face, mark edges, all single mark edges we draw
      const edgesToDraw = new Array(12).fill(0);
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

      // update gridlines / edge lines
      publicAPI.updatePolyData(facesToDraw, edgesToDraw, ticks);

      // compute label world coords and text
      publicAPI.updateTextData(facesToDraw, edgesToDraw, ticks, tickStrings);

      // rebuild the texture only when force or changed bounds, face
      // visibility changes do to change the atlas
      if (boundsChanged || model.forceUpdate) {
        publicAPI.updateTextureAtlas(tickStrings);
      }
    }

    model.forceUpdate = false;
  };

  // create the texture map atlas that contains the rendering of
  // all the text strings. Only needs to be called when the text strings
  // have changed (labels and ticks)
  publicAPI.updateTextureAtlas = (tickStrings) => {
    // compute the width and height we need

    // set the text properties
    model.tmContext.textBaseline = 'bottom';
    model.tmContext.textAlign = 'left';

    // first the three labels
    model._tmAtlas.clear();
    let maxWidth = 0;
    let totalHeight = 1; // start one pixel in so we have a border
    for (let i = 0; i < 3; i++) {
      if (!model._tmAtlas.has(model.axisLabels[i])) {
        applyTextStyle(model.tmContext, model.axisTextStyle);
        const metrics = model.tmContext.measureText(model.axisLabels[i]);
        const entry = {
          height: metrics.actualBoundingBoxAscent + 2,
          startingHeight: totalHeight,
          width: metrics.width + 2,
          textStyle: model.axisTextStyle,
        };
        model._tmAtlas.set(model.axisLabels[i], entry);
        totalHeight += entry.height;
        if (maxWidth < entry.width) {
          maxWidth = entry.width;
        }
      }
      // and the ticks
      applyTextStyle(model.tmContext, model.tickTextStyle);
      for (let t = 0; t < tickStrings[i].length; t++) {
        if (!model._tmAtlas.has(tickStrings[i][t])) {
          const metrics = model.tmContext.measureText(tickStrings[i][t]);
          const entry = {
            height: metrics.actualBoundingBoxAscent + 2,
            startingHeight: totalHeight,
            width: metrics.width + 2,
            textStyle: model.tickTextStyle,
          };
          model._tmAtlas.set(tickStrings[i][t], entry);
          totalHeight += entry.height;
          if (maxWidth < entry.width) {
            maxWidth = entry.width;
          }
        }
      }
    }

    // always use power of two to avoid interpolation
    // in cases where PO2 is required
    maxWidth = vtkMath.nearestPowerOfTwo(maxWidth);
    totalHeight = vtkMath.nearestPowerOfTwo(totalHeight);

    // set the tcoord values
    model._tmAtlas.forEach((value) => {
      value.tcoords = [
        0.0,
        (totalHeight - value.startingHeight - value.height) / totalHeight,
        value.width / maxWidth,
        (totalHeight - value.startingHeight - value.height) / totalHeight,
        value.width / maxWidth,
        (totalHeight - value.startingHeight) / totalHeight,
        0.0,
        (totalHeight - value.startingHeight) / totalHeight,
      ];
    });

    // make sure we have power of two dimensions
    model.tmCanvas.width = maxWidth;
    model.tmCanvas.height = totalHeight;
    model.tmContext.textBaseline = 'bottom';
    model.tmContext.textAlign = 'left';
    model.tmContext.clearRect(0, 0, maxWidth, totalHeight);

    // draw the text onto the texture
    model._tmAtlas.forEach((value, key) => {
      applyTextStyle(model.tmContext, value.textStyle);
      model.tmContext.fillText(key, 1, value.startingHeight + value.height - 1);
    });

    model.tmTexture.setCanvas(model.tmCanvas);
    model.tmTexture.modified();
  };

  // Make sure the data is correct
  publicAPI.onModified(() => {
    model.forceUpdate = true;
    publicAPI.update();
  });

  publicAPI.setTickTextStyle = (tickStyle) => {
    model.tickTextStyle = { ...model.tickTextStyle, ...tickStyle };
    publicAPI.modified();
  };

  publicAPI.setAxisTextStyle = (axisStyle) => {
    model.axisTextStyle = { ...model.axisTextStyle, ...axisStyle };
    publicAPI.modified();
  };

  publicAPI.get_tmAtlas = () => model._tmAtlas;

  // try to get the bounds for the annotation. This is complicated
  // as it relies on the pixel size of the window. Every time the camera
  // changes the bounds change. This method simplifies by just expanding
  // the grid bounds by a user specified factor.
  publicAPI.getBounds = () => {
    publicAPI.update();
    vtkBoundingBox.setBounds(model.bounds, model.gridActor.getBounds());
    vtkBoundingBox.scaleAboutCenter(
      model.bounds,
      model.boundsScaleFactor,
      model.boundsScaleFactor,
      model.boundsScaleFactor
    );
    return model.bounds;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    boundsScaleFactor: 1.3,
    camera: null,
    dataBounds: [...vtkBoundingBox.INIT_BOUNDS],
    faceVisibilityAngle: 8,
    gridLines: true,
    axisLabels: null,
    axisTitlePixelOffset: 35.0,
    axisTextStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 18,
      fontFamily: 'serif',
    },
    tickLabelPixelOffset: 12.0,
    tickTextStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 14,
      fontFamily: 'serif',
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  // internal variables
  model.lastFacesToDraw = [false, false, false, false, false, false];
  model.axisLabels = ['X-Axis', 'Y-Axis', 'Z-Axis'];
  model.tickCounts = [];
  model.textValues = [];
  model.lastTickBounds = [];

  model.tmCanvas = document.createElement('canvas');
  model.tmContext = model.tmCanvas.getContext('2d');
  model._tmAtlas = new Map();

  // for texture atlas
  model.tmTexture = vtkTexture.newInstance();
  model.tmTexture.setInterpolate(false);

  publicAPI.getProperty().setDiffuse(0.0);
  publicAPI.getProperty().setAmbient(1.0);

  model.gridMapper = vtkMapper.newInstance();
  model.polyData = vtkPolyData.newInstance();
  model.gridMapper.setInputData(model.polyData);
  model.gridActor = vtkActor.newInstance();
  model.gridActor.setMapper(model.gridMapper);
  model.gridActor.setProperty(publicAPI.getProperty());
  model.gridActor.setParentProp(publicAPI);

  model.textPolyData = vtkPolyData.newInstance();

  macro.setGet(publicAPI, model, [
    'axisTitlePixelOffset',
    'boundsScaleFactor',
    'faceVisibilityAngle',
    'gridLines',
    'tickLabelPixelOffset',
  ]);

  macro.setGetArray(publicAPI, model, ['dataBounds'], 6);
  macro.setGetArray(publicAPI, model, ['axisLabels'], 3);
  macro.get(publicAPI, model, [
    'axisTextStyle',
    'tickTextStyle',
    'camera',
    'tmTexture',
    'textValues',
    'textPolyData',
    'tickCounts',
    'gridActor',
  ]);

  // Object methods
  vtkCubeAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend, newCubeAxesActorHelper };
