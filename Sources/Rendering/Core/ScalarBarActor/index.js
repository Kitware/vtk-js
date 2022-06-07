import { vec3, mat4 } from 'gl-matrix';
import * as d3 from 'd3-scale';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

const { VectorMode } = vtkScalarsToColors;

// ----------------------------------------------------------------------------
// vtkScalarBarActor
//
// Note log scales are currently not supported
//
// Developer note: This class is broken into the main class and a helper
// class. The main class holds view independent properties (those properties
// that do not change as the view's resolution/aspect ratio change). The
// helper class is instantiated one per view and holds properties that can
// depend on view specific values such as resolution. The helper class code
// could have been left to the View specific implementation (such as
// vtkWebGPUScalarBarActor) but is instead placed here to it can be shared by
// multiple rendering backends.
//
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Default autoLayout function
// ----------------------------------------------------------------------------

// compute good values to use based on window size etc a bunch of heuristics
// here with hand tuned constants These values worked for me but really this
// method could be redically changed. The basic gist is
// 1) compute a resonable font size
// 2) render the text atlas using those font sizes
// 3) pick horizontal or vertical bsed on window size
// 4) based on the size of the title and tick labels rendered
//    compute the box size and position such that
//    the text will all fit nicely and the bar will be a resonable size
// 5) compute the bar segments based on the above settings
//
// Note that this function can and should read values from the
// ScalarBarActor but should only write values to the view dependent helper
// instance that is provided as those values are the ones that will be used
// for rendering.
//
function defaultAutoLayout(publicAPI, model) {
  return (helper) => {
    // we don't do a linear scale, the proportions for
    // a 700 pixel window differ from a 1400
    const lastSize = helper.getLastSize();
    const xAxisAdjust = (lastSize[0] / 700) ** 0.8;
    const yAxisAdjust = (lastSize[1] / 700) ** 0.8;
    const minAdjust = Math.min(xAxisAdjust, yAxisAdjust);

    const axisTextStyle = helper.getAxisTextStyle();
    const tickTextStyle = helper.getTickTextStyle();
    Object.assign(axisTextStyle, model.axisTextStyle);
    Object.assign(tickTextStyle, model.tickTextStyle);

    // compute a reasonable font size first
    axisTextStyle.fontSize = Math.max(24 * minAdjust, 12);
    if (helper.getLastAspectRatio() > 1.0) {
      tickTextStyle.fontSize = Math.max(20 * minAdjust, 10);
    } else {
      tickTextStyle.fontSize = Math.max(16 * minAdjust, 10);
    }

    // rebuild the text atlas
    const textSizes = helper.updateTextureAtlas();

    // now compute the boxSize and pixel offsets, different algorithm
    // for horizonal versus vertical
    helper.setTopTitle(false);

    const boxSize = helper.getBoxSizeByReference();

    // if vertical
    if (helper.getLastAspectRatio() > 1.0) {
      helper.setTickLabelPixelOffset(0.4 * tickTextStyle.fontSize);
      const tickWidth =
        (2.0 * (textSizes.tickWidth + helper.getTickLabelPixelOffset())) /
        lastSize[0];
      helper.setAxisTitlePixelOffset(0.8 * axisTextStyle.fontSize);
      // width required if the title is vertical
      const titleWidth =
        (2.0 * (textSizes.titleHeight + helper.getAxisTitlePixelOffset())) /
        lastSize[0];

      // if the title will fit within the width of the bar then that looks
      // nicer to put it at the top (helper.topTitle), otherwise rotate it
      // and place it sideways
      if (
        tickWidth + 0.4 * titleWidth >
        (2.0 * textSizes.titleWidth) / lastSize[0]
      ) {
        helper.setTopTitle(true);
        boxSize[0] = tickWidth + 0.4 * titleWidth;
        helper.setBoxPosition([0.98 - boxSize[0], -0.92]);
      } else {
        boxSize[0] = tickWidth + 1.4 * titleWidth;
        helper.setBoxPosition([0.99 - boxSize[0], -0.92]);
      }
      boxSize[1] = Math.max(1.2, Math.min(1.84 / yAxisAdjust, 1.84));
    } else {
      // horizontal
      helper.setAxisTitlePixelOffset(2.0 * tickTextStyle.fontSize);
      helper.setTickLabelPixelOffset(0.5 * tickTextStyle.fontSize);
      const tickHeight =
        (2.0 * (textSizes.tickHeight + helper.getTickLabelPixelOffset())) /
        lastSize[1];
      const titleHeight =
        (2.0 * (textSizes.titleHeight + helper.getAxisTitlePixelOffset())) /
        lastSize[1];
      const tickWidth = (2.0 * textSizes.tickWidth) / lastSize[0];
      boxSize[0] = Math.min(
        1.9,
        Math.max(1.4, 1.4 * tickWidth * (helper.getTicks().length + 3))
      );
      boxSize[1] = tickHeight + titleHeight;
      helper.setBoxPosition([-0.5 * boxSize[0], -0.97]);
    }

    // recomute bar segments based on positioning
    helper.recomputeBarSegments(textSizes);
  };
}

// ----------------------------------------------------------------------------
// Default generateTicks function
// ----------------------------------------------------------------------------

// This function returns the default function used to generate vtkScalarBarActor ticks.
// The default function makes use of d3.scaleLinear() to generate 5 tick marks between
// the minimum and maximum values of the scalar bar. Customize this behavior by passing
// a function to vtkScalarBarActor.newInstance({ generateTicks: customGenerateTicks })
// or by calling scalarBarActor.setGenerateTicks(customGenerateTicks).
function defaultGenerateTicks(publicApi, model) {
  return (helper) => {
    const lastTickBounds = helper.getLastTickBounds();
    const scale = d3
      .scaleLinear()
      .domain([lastTickBounds[0], lastTickBounds[1]]);
    const ticks = scale.ticks(5);
    const format = scale.tickFormat(5);

    helper.setTicks(ticks);
    helper.setTickStrings(ticks.map(format));
  };
}

// many properties of this actor depend on the API specific view The main
// dependency being the resolution as that drives what font sizes to use.
// Bacause of this we need to do some of the calculations in a API specific
// subclass. But... we don't want a lot of duplicated code between WebGL and
// WebGPU for example so we have this helper class, that is designed to be
// fairly API independent so that API specific views can call this to do
// most of the work.
function vtkScalarBarActorHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScalarBarActorHelper');

  publicAPI.setRenderable = (renderable) => {
    if (model.renderable === renderable) {
      return;
    }
    model.renderable = renderable;
    model.barActor.setProperty(renderable.getProperty());
    model.barActor.setParentProp(renderable);
    model.tmActor.setProperty(renderable.getProperty());
    model.tmActor.setParentProp(renderable);

    model.generateTicks = renderable.generateTicks;
    model.axisTextStyle = { ...renderable.getAxisTextStyle() };
    model.tickTextStyle = { ...renderable.getTickTextStyle() };

    publicAPI.modified();
  };

  publicAPI.updateAPISpecificData = (size, camera, renderWindow) => {
    // has the size changed?
    if (model.lastSize[0] !== size[0] || model.lastSize[1] !== size[1]) {
      model.lastSize[0] = size[0];
      model.lastSize[1] = size[1];
      model.lastAspectRatio = size[0] / size[1];
      model.forceUpdate = true;
    }

    const scalarsToColors = model.renderable.getScalarsToColors();
    if (!scalarsToColors || !model.renderable.getVisibility()) {
      return;
    }

    // make sure the lut is assigned to our mapper
    model.barMapper.setLookupTable(scalarsToColors);

    // camera should be the same for all views
    model.camera = camera;

    model.renderWindow = renderWindow;

    // did something significant change? If so rebuild a lot of things
    if (
      model.forceUpdate ||
      Math.max(
        scalarsToColors.getMTime(),
        publicAPI.getMTime(),
        model.renderable.getMTime()
      ) > model.lastRebuildTime.getMTime()
    ) {
      const range = scalarsToColors.getMappingRange();
      model.lastTickBounds = [...range];

      // compute tick marks for axes (update for log scale)
      model.renderable.getGenerateTicks()(publicAPI);

      if (model.renderable.getAutomated()) {
        model.renderable.getAutoLayout()(publicAPI);
      } else {
        // copy values from renderable
        model.axisTextStyle = { ...model.renderable.getAxisTextStyle() };
        model.tickTextStyle = { ...model.renderable.getTickTextStyle() };
        model.barPosition = [...model.renderable.getBarPosition()];
        model.barSize = [...model.renderable.getBarSize()];
        model.boxPosition = [...model.renderable.getBoxPosition()];
        model.boxSize = [...model.renderable.getBoxSize()];
        model.axisTitlePixelOffset = model.renderable.getAxisTitlePixelOffset();
        model.tickLabelPixelOffset = model.renderable.getTickLabelPixelOffset();

        // rebuild the texture only when force or changed bounds, face
        // visibility changes do to change the atlas
        const textSizes = publicAPI.updateTextureAtlas();

        // recompute bar segments based on positioning
        publicAPI.recomputeBarSegments(textSizes);
      }
      model.forceViewUpdate = true;
      model.lastRebuildTime.modified();
      model.forceUpdate = false;
    }

    // compute bounds for label quads whenever the camera changes or forced
    // the polydata mapper could be modified to accept NDC coords then this
    // would be called far less often
    if (
      model.forceViewUpdate ||
      model.camera.getMTime() > model.lastRedrawTime.getMTime()
    ) {
      publicAPI.updatePolyDataForLabels();
      publicAPI.updatePolyDataForBarSegments();
      model.lastRedrawTime.modified();
      model.forceViewUpdate = false;
    }
  };

  // create the texture map atlas that contains the rendering of
  // all the text strings. Only needs to be called when the text strings
  // have changed (labels and ticks)
  publicAPI.updateTextureAtlas = () => {
    // set the text properties
    model.tmContext.textBaseline = 'bottom';
    model.tmContext.textAlign = 'left';

    // return some factors about the text atlas
    const results = {};

    // first the axislabel
    const newTmAtlas = new Map();
    let maxWidth = 0;
    let totalHeight = 1; // start one pixel in so we have a border
    applyTextStyle(model.tmContext, model.axisTextStyle);
    let metrics = model.tmContext.measureText(model.renderable.getAxisLabel());
    let entry = {
      height: metrics.actualBoundingBoxAscent + 2,
      startingHeight: totalHeight,
      width: metrics.width + 2,
      textStyle: model.axisTextStyle,
    };
    newTmAtlas.set(model.renderable.getAxisLabel(), entry);
    totalHeight += entry.height;
    maxWidth = entry.width;
    results.titleWidth = entry.width;
    results.titleHeight = entry.height;

    // and the ticks, NaN Below and Above
    results.tickWidth = 0;
    results.tickHeight = 0;
    applyTextStyle(model.tmContext, model.tickTextStyle);
    const strings = [...publicAPI.getTickStrings(), 'NaN', 'Below', 'Above'];
    for (let t = 0; t < strings.length; t++) {
      if (!newTmAtlas.has(strings[t])) {
        metrics = model.tmContext.measureText(strings[t]);
        entry = {
          height: metrics.actualBoundingBoxAscent + 2,
          startingHeight: totalHeight,
          width: metrics.width + 2,
          textStyle: model.tickTextStyle,
        };
        newTmAtlas.set(strings[t], entry);
        totalHeight += entry.height;
        if (maxWidth < entry.width) {
          maxWidth = entry.width;
        }
        if (results.tickWidth < entry.width) {
          results.tickWidth = entry.width;
        }
        if (results.tickHeight < entry.height) {
          results.tickHeight = entry.height;
        }
      }
    }

    // always use power of two to avoid interpolation
    // in cases where PO2 is required
    maxWidth = vtkMath.nearestPowerOfTwo(maxWidth);
    totalHeight = vtkMath.nearestPowerOfTwo(totalHeight);

    // set the tcoord values
    newTmAtlas.forEach((value) => {
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
    newTmAtlas.forEach((value, key) => {
      applyTextStyle(model.tmContext, value.textStyle);
      model.tmContext.fillText(key, 1, value.startingHeight + value.height - 1);
    });

    model.tmTexture.setCanvas(model.tmCanvas);
    // mark as modified since the canvas typically doesn't change
    model.tmTexture.modified();
    model._tmAtlas = newTmAtlas;

    return results;
  };

  publicAPI.computeBarSize = (textSizes) => {
    // compute orientation
    model.vertical = model.boxSize[1] > model.boxSize[0];

    const tickHeight = (2.0 * textSizes.tickHeight) / model.lastSize[1];

    const segSize = [1, 1];

    // horizontal and vertical have different astetics so adjust based on
    // orientation
    if (model.vertical) {
      const tickWidth =
        (2.0 * (textSizes.tickWidth + model.tickLabelPixelOffset)) /
        model.lastSize[0];
      if (model.topTitle) {
        const titleHeight =
          (2.0 * (textSizes.titleHeight + model.axisTitlePixelOffset)) /
          model.lastSize[1];
        model.barSize[0] = model.boxSize[0] - tickWidth;
        model.barSize[1] = model.boxSize[1] - titleHeight;
      } else {
        // rotated title so width is based off height
        const titleWidth =
          (2.0 * (textSizes.titleHeight + model.axisTitlePixelOffset)) /
          model.lastSize[0];
        model.barSize[0] = model.boxSize[0] - titleWidth - tickWidth;
        model.barSize[1] = model.boxSize[1];
      }
      model.barPosition[0] = model.boxPosition[0] + tickWidth;
      model.barPosition[1] = model.boxPosition[1];
      segSize[1] = tickHeight;
    } else {
      const tickWidth = (2.0 * textSizes.tickWidth - 8) / model.lastSize[0];
      const titleHeight =
        (2.0 * (textSizes.titleHeight + model.axisTitlePixelOffset)) /
        model.lastSize[1];
      model.barSize[0] = model.boxSize[0];
      model.barPosition[0] = model.boxPosition[0];
      model.barSize[1] = model.boxSize[1] - titleHeight - tickHeight;
      model.barPosition[1] = model.boxPosition[1];
      segSize[0] = tickWidth;
    }
    return segSize;
  };

  // based on all the settins compute a barSegments array
  // containing the segments opf the scalar bar
  // each segment contains
  //   corners[4][2]
  //   title - e.g. NaN, Above, ticks
  //   scalars - the normalized scalars values to use for that segment
  //
  // Note that the bar consumes the space in the box that remains after
  // leaving room for the text labels
  publicAPI.recomputeBarSegments = (textSizes) => {
    // first compute the barSize/Position
    const segSize = publicAPI.computeBarSize(textSizes);

    model.barSegments = [];

    const startPos = [0.0, 0.0];

    // horizontal and vertical have different astetics so adjust based on
    // orientation
    const barAxis = model.vertical ? 1 : 0;
    const segSpace = model.vertical ? 0.01 : 0.02;

    function pushSeg(title, scalars) {
      model.barSegments.push({
        corners: [
          [...startPos],
          [startPos[0] + segSize[0], startPos[1]],
          [startPos[0] + segSize[0], startPos[1] + segSize[1]],
          [startPos[0], startPos[1] + segSize[1]],
        ],
        scalars,
        title,
      });
      startPos[barAxis] += segSize[barAxis] + segSpace;
    }
    if (
      model.renderable.getDrawNanAnnotation() &&
      model.renderable.getScalarsToColors().getNanColor()
    ) {
      pushSeg('NaN', [NaN, NaN, NaN, NaN]);
    }

    if (
      model.renderable.getDrawBelowRangeSwatch() &&
      model.renderable.getScalarsToColors().getUseBelowRangeColor?.()
    ) {
      pushSeg('Below', [-0.1, -0.1, -0.1, -0.1]);
    }

    const haveAbove = model.renderable
      .getScalarsToColors()
      .getUseAboveRangeColor?.();

    // extra space around the ticks section
    startPos[barAxis] += segSpace;

    const oldSegSize = segSize[barAxis];
    segSize[barAxis] = haveAbove
      ? 1.0 - 2.0 * segSpace - segSize[barAxis] - startPos[barAxis]
      : 1.0 - segSpace - startPos[barAxis];

    pushSeg(
      'ticks',
      model.vertical ? [0, 0, 0.995, 0.995] : [0, 0.995, 0.995, 0]
    );

    if (model.renderable.getDrawAboveRangeSwatch() && haveAbove) {
      segSize[barAxis] = oldSegSize;
      startPos[barAxis] += segSpace;
      pushSeg('Above', [1.1, 1.1, 1.1, 1.1]);
    }
  };

  // called by updatePolyDataForLabels
  // modifies class constants ptv3, tmpv3
  publicAPI.createPolyDataForOneLabel = (
    text,
    pos,
    xdir,
    ydir,
    dir,
    offset,
    results
  ) => {
    const value = model._tmAtlas.get(text);
    if (!value) {
      return;
    }
    // have to find the four corners of the texture polygon for this label
    // convert anchor point to View Coords
    let ptIdx = results.ptIdx;
    let cellIdx = results.cellIdx;
    ptv3[0] = pos[0];
    ptv3[1] = pos[1];
    ptv3[2] = pos[2];
    // horizontal left, right, or middle alignment based on dir[0]
    if (dir[0] < -0.5) {
      vec3.scale(tmpv3, xdir, dir[0] * offset - value.width);
    } else if (dir[0] > 0.5) {
      vec3.scale(tmpv3, xdir, dir[0] * offset);
    } else {
      vec3.scale(tmpv3, xdir, dir[0] * offset - value.width / 2.0);
    }
    vec3.add(ptv3, ptv3, tmpv3);
    vec3.scale(tmpv3, ydir, dir[1] * offset - value.height / 2.0);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[0];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[1];
    ptIdx++;
    vec3.scale(tmpv3, xdir, value.width);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[2];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[3];
    ptIdx++;
    vec3.scale(tmpv3, ydir, value.height);
    vec3.add(ptv3, ptv3, tmpv3);
    results.points[ptIdx * 3] = ptv3[0];
    results.points[ptIdx * 3 + 1] = ptv3[1];
    results.points[ptIdx * 3 + 2] = ptv3[2];
    results.tcoords[ptIdx * 2] = value.tcoords[4];
    results.tcoords[ptIdx * 2 + 1] = value.tcoords[5];
    ptIdx++;
    vec3.scale(tmpv3, xdir, value.width);
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
  publicAPI.updatePolyDataForLabels = () => {
    const cmat = model.camera.getCompositeProjectionMatrix(
      model.lastAspectRatio,
      -1,
      1
    );
    mat4.transpose(cmat, cmat);
    mat4.invert(invmat, cmat);

    const size = model.lastSize;

    // compute pixel to distance factors
    tmpv3[0] = 0.0;
    tmpv3[1] = 0.0;
    tmpv3[2] = -0.99; // near plane
    vec3.transformMat4(ptv3, tmpv3, invmat);
    // moving 0.1 in NDC
    tmpv3[0] += 0.1;
    vec3.transformMat4(pt2v3, tmpv3, invmat);
    // results in WC move of
    vec3.subtract(xDir, pt2v3, ptv3);
    tmpv3[0] -= 0.1;
    tmpv3[1] += 0.1;
    vec3.transformMat4(pt2v3, tmpv3, invmat);
    // results in WC move of
    vec3.subtract(yDir, pt2v3, ptv3);
    for (let i = 0; i < 3; i++) {
      xDir[i] /= 0.5 * 0.1 * size[0];
      yDir[i] /= 0.5 * 0.1 * size[1];
    }

    // update the polydata
    const numLabels =
      publicAPI.getTickStrings().length + model.barSegments.length;
    const numPts = numLabels * 4;
    const numTris = numLabels * 2;
    const points = new Float64Array(numPts * 3);
    const polys = new Uint16Array(numTris * 4);
    const tcoords = new Float32Array(numPts * 2);

    const results = {
      ptIdx: 0,
      cellIdx: 0,
      polys,
      points,
      tcoords,
    };

    // compute the direction vector, to make the code general we place text
    const offsetAxis = model.vertical ? 0 : 1;
    const spacedAxis = model.vertical ? 1 : 0;

    // draw the title
    let dir = [0, 1];
    if (model.vertical) {
      if (model.topTitle) {
        tmpv3[0] = model.boxPosition[0] + 0.5 * model.boxSize[0];
        tmpv3[1] = model.barPosition[1] + model.barSize[1];
        vec3.transformMat4(ptv3, tmpv3, invmat);

        // write the axis label
        publicAPI.createPolyDataForOneLabel(
          model.renderable.getAxisLabel(),
          ptv3,
          xDir,
          yDir,
          [0, 1],
          model.axisTitlePixelOffset,
          results
        );
      } else {
        tmpv3[0] = model.barPosition[0] + model.barSize[0];
        tmpv3[1] = model.barPosition[1] + 0.5 * model.barSize[1];
        vec3.transformMat4(ptv3, tmpv3, invmat);

        // write the axis label
        vec3.scale(xDir, xDir, -1);
        publicAPI.createPolyDataForOneLabel(
          model.renderable.getAxisLabel(),
          ptv3,
          yDir,
          xDir,
          [0, -1],
          model.axisTitlePixelOffset,
          results
        );
        vec3.scale(xDir, xDir, -1);
      }
      dir = [-1, 0];
    } else {
      tmpv3[0] = model.barPosition[0] + 0.5 * model.barSize[0];
      tmpv3[1] = model.barPosition[1] + model.barSize[1];
      vec3.transformMat4(ptv3, tmpv3, invmat);
      publicAPI.createPolyDataForOneLabel(
        model.renderable.getAxisLabel(),
        ptv3,
        xDir,
        yDir,
        dir,
        model.axisTitlePixelOffset,
        results
      );
    }

    tmp2v3[2] = -0.99; // near plane
    tmp2v3[offsetAxis] =
      model.barPosition[offsetAxis] +
      (0.5 * dir[offsetAxis] + 0.5) * model.barSize[offsetAxis];
    tmp2v3[spacedAxis] =
      model.barPosition[spacedAxis] + model.barSize[spacedAxis] * 0.5;

    // draw bar segment labels
    let tickSeg = null;
    for (let i = 0; i < model.barSegments.length; i++) {
      const seg = model.barSegments[i];
      if (seg.title === 'ticks') {
        // handle ticks below
        tickSeg = seg;
      } else {
        tmp2v3[spacedAxis] =
          model.barPosition[spacedAxis] +
          0.5 *
            model.barSize[spacedAxis] *
            (seg.corners[2][spacedAxis] + seg.corners[0][spacedAxis]);
        vec3.transformMat4(ptv3, tmp2v3, invmat);
        publicAPI.createPolyDataForOneLabel(
          seg.title,
          ptv3,
          xDir,
          yDir,
          dir,
          model.tickLabelPixelOffset,
          results
        );
      }
    }

    // write the tick labels
    const tickSegmentStart =
      model.barPosition[spacedAxis] +
      model.barSize[spacedAxis] * tickSeg.corners[0][spacedAxis];
    const tickSegmentSize =
      model.barSize[spacedAxis] *
      (tickSeg.corners[2][spacedAxis] - tickSeg.corners[0][spacedAxis]);
    const ticks = publicAPI.getTicks();
    const tickStrings = publicAPI.getTickStrings();
    for (let t = 0; t < ticks.length; t++) {
      const tickPos =
        (ticks[t] - model.lastTickBounds[0]) /
        (model.lastTickBounds[1] - model.lastTickBounds[0]);
      tmp2v3[spacedAxis] = tickSegmentStart + tickSegmentSize * tickPos;
      vec3.transformMat4(ptv3, tmp2v3, invmat);
      publicAPI.createPolyDataForOneLabel(
        tickStrings[t],
        ptv3,
        xDir,
        yDir,
        dir,
        model.tickLabelPixelOffset,
        results
      );
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

  publicAPI.updatePolyDataForBarSegments = () => {
    const cmat = model.camera.getCompositeProjectionMatrix(
      model.lastAspectRatio,
      -1,
      1
    );
    mat4.transpose(cmat, cmat);
    mat4.invert(invmat, cmat);

    const scalarsToColors = model.renderable.getScalarsToColors();
    let numberOfExtraColors = 0;
    if (
      model.renderable.getDrawNanAnnotation() &&
      scalarsToColors.getNanColor()
    ) {
      numberOfExtraColors += 1;
    }
    if (
      model.renderable.getDrawBelowRangeSwatch() &&
      scalarsToColors.getUseBelowRangeColor?.()
    ) {
      numberOfExtraColors += 1;
    }
    if (
      model.renderable.getDrawAboveRangeSwatch() &&
      scalarsToColors.getUseAboveRangeColor?.()
    ) {
      numberOfExtraColors += 1;
    }

    const numPts = 4 * (1 + numberOfExtraColors);
    const numQuads = numPts;

    // handle vector component mode
    let numComps = 1;
    if (scalarsToColors.getVectorMode() === VectorMode.COMPONENT) {
      numComps = scalarsToColors.getVectorComponent() + 1;
    }

    // create the colored bars
    const points = new Float64Array(numPts * 3);
    const cells = new Uint16Array(numQuads * 5);
    const scalars = new Float32Array(numPts * numComps);

    let ptIdx = 0;
    let cellIdx = 0;

    for (let i = 0; i < model.barSegments.length; i++) {
      const seg = model.barSegments[i];
      tmp2v3[1] = model.barPosition[1] + model.barSize[1] * 0.5;
      tmp2v3[2] = -0.99; // near plane
      for (let e = 0; e < 4; e++) {
        tmp2v3[0] = model.barPosition[0] + seg.corners[e][0] * model.barSize[0];
        tmp2v3[1] = model.barPosition[1] + seg.corners[e][1] * model.barSize[1];
        vec3.transformMat4(ptv3, tmp2v3, invmat);
        points[ptIdx * 3] = ptv3[0];
        points[ptIdx * 3 + 1] = ptv3[1];
        points[ptIdx * 3 + 2] = ptv3[2];
        for (let nc = 0; nc < numComps; nc++) {
          scalars[ptIdx * numComps + nc] =
            model.lastTickBounds[0] +
            seg.scalars[e] *
              (model.lastTickBounds[1] - model.lastTickBounds[0]);
        }
        ptIdx++;
      }
      cells[cellIdx * 5] = 4;
      cells[cellIdx * 5 + 1] = ptIdx - 4;
      cells[cellIdx * 5 + 2] = ptIdx - 3;
      cells[cellIdx * 5 + 3] = ptIdx - 2;
      cells[cellIdx * 5 + 4] = ptIdx - 1;
      cellIdx++;
    }

    const scalarsDA = vtkDataArray.newInstance({
      numberOfComponents: numComps,
      values: scalars,
      name: 'Scalars',
    });
    model.polyData.getPointData().setScalars(scalarsDA);
    model.polyData.getPoints().setData(points, 3);
    model.polyData.getPoints().modified();
    model.polyData.getPolys().setData(cells, 1);
    model.polyData.getPolys().modified();
    model.polyData.modified();
  };
}

const newScalarBarActorHelper = macro.newInstance(
  (publicAPI, model, initialValues = { renderable: null }) => {
    Object.assign(model, {}, initialValues);

    // Inheritance
    macro.obj(publicAPI, model);

    macro.setGet(publicAPI, model, [
      'axisTitlePixelOffset',
      'tickLabelPixelOffset',
      'renderable',
      'topTitle',
      'ticks',
      'tickStrings',
    ]);
    macro.get(publicAPI, model, [
      'lastSize',
      'lastAspectRatio',
      'lastTickBounds',
      'axisTextStyle',
      'tickTextStyle',
      'barActor',
      'tmActor',
    ]);
    macro.getArray(publicAPI, model, ['boxPosition', 'boxSize']);
    macro.setArray(publicAPI, model, ['boxPosition', 'boxSize'], 2);

    model.forceUpdate = false;
    model.lastRedrawTime = {};
    macro.obj(model.lastRedrawTime, { mtime: 0 });
    model.lastRebuildTime = {};
    macro.obj(model.lastRebuildTime, { mtime: 0 });
    model.lastSize = [-1, -1];

    model.tmCanvas = document.createElement('canvas');
    model.tmContext = model.tmCanvas.getContext('2d');
    model._tmAtlas = new Map();

    model.barMapper = vtkMapper.newInstance();
    model.barMapper.setInterpolateScalarsBeforeMapping(true);
    model.barMapper.setUseLookupTableScalarRange(true);
    model.polyData = vtkPolyData.newInstance();
    model.barMapper.setInputData(model.polyData);
    model.barActor = vtkActor.newInstance();
    model.barActor.setMapper(model.barMapper);

    // for texture atlas
    model.tmPolyData = vtkPolyData.newInstance();
    model.tmMapper = vtkMapper.newInstance();
    model.tmMapper.setInputData(model.tmPolyData);
    model.tmTexture = vtkTexture.newInstance();
    model.tmTexture.setInterpolate(false);
    model.tmActor = vtkActor.newInstance({ parentProp: publicAPI });
    model.tmActor.setMapper(model.tmMapper);
    model.tmActor.addTexture(model.tmTexture);

    model.barPosition = [0, 0];
    model.barSize = [0, 0];
    model.boxPosition = [0.88, -0.92];
    model.boxSize = [0.1, 1.1];

    // internal variables
    model.lastTickBounds = [];

    vtkScalarBarActorHelper(publicAPI, model);
  },
  'vtkScalarBarActorHelper'
);

//
// Now we define the public class that the application sets view independent
// properties on. This class is fairly small as it mainly just holds
// properties setter and getters leaving all calculations to the helper
// class.
//
function vtkScalarBarActor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScalarBarActor');

  publicAPI.setTickTextStyle = (tickStyle) => {
    model.tickTextStyle = { ...model.tickTextStyle, ...tickStyle };
    publicAPI.modified();
  };

  publicAPI.setAxisTextStyle = (axisStyle) => {
    model.axisTextStyle = { ...model.axisTextStyle, ...axisStyle };
    publicAPI.modified();
  };

  publicAPI.resetAutoLayoutToDefault = () => {
    publicAPI.setAutoLayout(defaultAutoLayout(publicAPI, model));
  };

  publicAPI.resetGenerateTicksToDefault = () => {
    publicAPI.setGenerateTicks(defaultGenerateTicks(publicAPI, model));
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    automated: true,
    autoLayout: null,
    axisLabel: 'Scalar Value',
    barPosition: [0, 0],
    barSize: [0, 0],
    boxPosition: [0.88, -0.92],
    boxSize: [0.1, 1.1],
    scalarToColors: null,
    axisTitlePixelOffset: 36.0,
    axisTextStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 18,
      fontFamily: 'serif',
    },
    tickLabelPixelOffset: 14.0,
    tickTextStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 14,
      fontFamily: 'serif',
    },
    generateTicks: null,
    drawNanAnnotation: true,
    drawBelowRangeSwatch: true,
    drawAboveRangeSwatch: true,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  if (!model.autoLayout) model.autoLayout = defaultAutoLayout(publicAPI, model);
  if (!model.generateTicks)
    model.generateTicks = defaultGenerateTicks(publicAPI, model);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  publicAPI.getProperty().setDiffuse(0.0);
  publicAPI.getProperty().setAmbient(1.0);

  macro.setGet(publicAPI, model, [
    'automated',
    'autoLayout',
    'axisTitlePixelOffset',
    'axisLabel',
    'scalarsToColors',
    'tickLabelPixelOffset',
    'generateTicks',
    'drawNanAnnotation',
    'drawBelowRangeSwatch',
    'drawAboveRangeSwatch',
  ]);
  macro.get(publicAPI, model, ['axisTextStyle', 'tickTextStyle']);
  macro.getArray(publicAPI, model, [
    'barPosition',
    'barSize',
    'boxPosition',
    'boxSize',
  ]);
  macro.setArray(
    publicAPI,
    model,
    ['barPosition', 'barSize', 'boxPosition', 'boxSize'],
    2
  );

  // Object methods
  vtkScalarBarActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkScalarBarActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend, newScalarBarActorHelper };
