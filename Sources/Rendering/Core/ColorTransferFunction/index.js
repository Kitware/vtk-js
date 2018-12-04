import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';
import Constants from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/Constants';

const { ColorSpace, Scale } = Constants;
const { ScalarMappingTarget } = vtkScalarsToColors;
const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------
/* eslint-disable no-continue                                                */

// Convert to and from a special polar version of CIELAB (useful for creating
// continuous diverging color maps).
function vtkColorTransferFunctionLabToMsh(lab, msh) {
  const L = lab[0];
  const a = lab[1];
  const b = lab[2];
  const M = Math.sqrt(L * L + a * a + b * b);
  const s = M > 0.001 ? Math.acos(L / M) : 0.0;
  const h = s > 0.001 ? Math.atan2(b, a) : 0.0;
  msh[0] = M;
  msh[1] = s;
  msh[2] = h;
}

function vtkColorTransferFunctionMshToLab(msh, lab) {
  const M = msh[0];
  const s = msh[1];
  const h = msh[2];

  lab[0] = M * Math.cos(s);
  lab[1] = M * Math.sin(s) * Math.cos(h);
  lab[2] = M * Math.sin(s) * Math.sin(h);
}

// For the case when interpolating from a saturated color to an unsaturated
// color, find a hue for the unsaturated color that makes sense.
function vtkColorTransferFunctionAdjustHue(msh, unsatM) {
  if (msh[0] >= unsatM - 0.1) {
    // The best we can do is hold hue constant.
    return msh[2];
  }

  // This equation is designed to make the perceptual change of the
  // interpolation to be close to constant.
  const hueSpin =
    (msh[1] * Math.sqrt(unsatM * unsatM - msh[0] * msh[0])) /
    (msh[0] * Math.sin(msh[1]));
  // Spin hue away from 0 except in purple hues.
  if (msh[2] > -0.3 * Math.PI) {
    return msh[2] + hueSpin;
  }

  return msh[2] - hueSpin;
}

function vtkColorTransferFunctionAngleDiff(a1, a2) {
  let adiff = a1 - a2;
  if (adiff < 0.0) {
    adiff = -adiff;
  }
  while (adiff >= 2.0 * Math.PI) {
    adiff -= 2.0 * Math.PI;
  }
  if (adiff > Math.PI) {
    adiff = 2.0 * Math.PI - adiff;
  }
  return adiff;
}

// Interpolate a diverging color map.
function vtkColorTransferFunctionInterpolateDiverging(s, rgb1, rgb2, result) {
  const lab1 = [];
  const lab2 = [];
  vtkMath.rgb2lab(rgb1, lab1);
  vtkMath.rgb2lab(rgb2, lab2);

  const msh1 = [];
  const msh2 = [];
  vtkColorTransferFunctionLabToMsh(lab1, msh1);
  vtkColorTransferFunctionLabToMsh(lab2, msh2);

  // If the endpoints are distinct saturated colors, then place white in between
  // them.
  let localS = s;
  if (
    msh1[1] > 0.05 &&
    msh2[1] > 0.05 &&
    vtkColorTransferFunctionAngleDiff(msh1[2], msh2[2]) > 0.33 * Math.PI
  ) {
    // Insert the white midpoint by setting one end to white and adjusting the
    // scalar value.
    let Mmid = Math.max(msh1[0], msh2[0]);
    Mmid = Math.max(88.0, Mmid);
    if (s < 0.5) {
      msh2[0] = Mmid;
      msh2[1] = 0.0;
      msh2[2] = 0.0;
      localS *= 2.0;
    } else {
      msh1[0] = Mmid;
      msh1[1] = 0.0;
      msh1[2] = 0.0;
      localS = 2.0 * localS - 1.0;
    }
  }

  // If one color has no saturation, then its hue value is invalid.  In this
  // case, we want to set it to something logical so that the interpolation of
  // hue makes sense.
  if (msh1[1] < 0.05 && msh2[1] > 0.05) {
    msh1[2] = vtkColorTransferFunctionAdjustHue(msh2, msh1[0]);
  } else if (msh2[1] < 0.05 && msh1[1] > 0.05) {
    msh2[2] = vtkColorTransferFunctionAdjustHue(msh1, msh2[0]);
  }

  const mshTmp = [];
  mshTmp[0] = (1 - localS) * msh1[0] + localS * msh2[0];
  mshTmp[1] = (1 - localS) * msh1[1] + localS * msh2[1];
  mshTmp[2] = (1 - localS) * msh1[2] + localS * msh2[2];

  // Now convert back to RGB
  const labTmp = [];
  vtkColorTransferFunctionMshToLab(mshTmp, labTmp);
  vtkMath.lab2rgb(labTmp, result);
}

// ----------------------------------------------------------------------------
// vtkColorTransferFunction methods
// ----------------------------------------------------------------------------

function vtkColorTransferFunction(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkColorTransferFunction');

  // Return the number of points which specify this function
  publicAPI.getSize = () => model.nodes.length;

  //----------------------------------------------------------------------------
  // Add a point defined in RGB
  publicAPI.addRGBPoint = (x, r, g, b) =>
    publicAPI.addRGBPointLong(x, r, g, b, 0.5, 0.0);

  //----------------------------------------------------------------------------
  // Add a point defined in RGB
  publicAPI.addRGBPointLong = (x, r, g, b, midpoint, sharpness) => {
    // Error check
    if (midpoint < 0.0 || midpoint > 1.0) {
      vtkErrorMacro('Midpoint outside range [0.0, 1.0]');
      return -1;
    }

    if (sharpness < 0.0 || sharpness > 1.0) {
      vtkErrorMacro('Sharpness outside range [0.0, 1.0]');
      return -1;
    }

    // remove any node already at this X location
    if (!model.allowDuplicateScalars) {
      publicAPI.removePoint(x);
    }

    // Create the new node
    const node = { x, r, g, b, midpoint, sharpness };

    // Add it, then sort to get everything in order
    model.nodes.push(node);
    publicAPI.sortAndUpdateRange();

    // We need to find the index of the node we just added in order
    // to return this value
    let i = 0;
    for (; i < model.nodes.length; i++) {
      if (model.nodes[i].x === x) {
        break;
      }
    }

    // If we didn't find it, something went horribly wrong so
    // return -1
    if (i < model.nodes.length) {
      return i;
    }

    return -1;
  };

  //----------------------------------------------------------------------------
  // Add a point defined in HSV
  publicAPI.addHSVPoint = (x, h, s, v) =>
    publicAPI.addHSVPointLong(x, h, s, v, 0.5, 0.0);

  //----------------------------------------------------------------------------
  // Add a point defined in HSV
  publicAPI.addHSVPointLong = (x, h, s, v, midpoint, sharpness) => {
    const rgb = [];
    const hsv = [h, s, v];

    vtkMath.hsv2rgb(hsv, rgb);
    return publicAPI.addRGBPoint(
      x,
      rgb[0],
      rgb[1],
      rgb[2],
      midpoint,
      sharpness
    );
  };

  //----------------------------------------------------------------------------
  // Set nodes directly
  publicAPI.setNodes = (nodes) => {
    if (model.nodes !== nodes) {
      model.nodes = nodes;
      publicAPI.sortAndUpdateRange();
    }
  };

  //----------------------------------------------------------------------------
  // Sort the vector in increasing order, then fill in
  // the Range
  publicAPI.sortAndUpdateRange = () => {
    model.nodes.sort((a, b) => a.x - b.x);

    const modifiedInvoked = publicAPI.updateRange();
    // If range is updated, Modified() has been called, don't call it again.
    if (!modifiedInvoked) {
      publicAPI.modified();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.updateRange = () => {
    const oldRange = [2];
    oldRange[0] = model.mappingRange[0];
    oldRange[1] = model.mappingRange[1];

    const size = model.nodes.length;
    if (size) {
      model.mappingRange[0] = model.nodes[0].x;
      model.mappingRange[1] = model.nodes[size - 1].x;
    } else {
      model.mappingRange[0] = 0;
      model.mappingRange[1] = 0;
    }

    // If the range is the same, then no need to call Modified()
    if (
      oldRange[0] === model.mappingRange[0] &&
      oldRange[1] === model.mappingRange[1]
    ) {
      return false;
    }

    publicAPI.modified();
    return true;
  };

  //----------------------------------------------------------------------------
  // Remove a point
  publicAPI.removePoint = (x) => {
    // First find the node since we need to know its
    // index as our return value
    let i = 0;
    for (; i < model.nodes.length; i++) {
      if (model.nodes[i].x === x) {
        break;
      }
    }

    const retVal = i;

    // If the node doesn't exist, we return -1
    if (i >= model.nodes.length) {
      return -1;
    }

    // If the first or last point has been removed, then we update the range
    // No need to sort here as the order of points hasn't changed.
    let modifiedInvoked = false;
    model.nodes.splice(i, 1);
    if (i === 0 || i === model.nodes.length) {
      modifiedInvoked = publicAPI.updateRange();
    }
    if (!modifiedInvoked) {
      publicAPI.modified();
    }

    return retVal;
  };

  //----------------------------------------------------------------------------
  publicAPI.movePoint = (oldX, newX) => {
    if (oldX === newX) {
      // Nothing to do.
      return;
    }

    publicAPI.removePoint(newX);
    for (let i = 0; i < model.nodes.length; i++) {
      if (model.nodes[i].x === oldX) {
        model.nodes[i].x = newX;
        publicAPI.sortAndUpdateRange();
        break;
      }
    }
  };

  //----------------------------------------------------------------------------
  // Remove all points
  publicAPI.removeAllPoints = () => {
    model.nodes = [];
    publicAPI.sortAndUpdateRange();
  };

  //----------------------------------------------------------------------------
  // Add a line defined in RGB
  publicAPI.addRGBSegment = (x1, r1, g1, b1, x2, r2, g2, b2) => {
    // First, find all points in this range and remove them
    publicAPI.sortAndUpdateRange();
    for (let i = 0; i < model.nodes.length; ) {
      if (model.nodes[i].x >= x1 && model.nodes[i].x <= x2) {
        model.nodes.splice(i, 1);
      } else {
        i++;
      }
    }

    // Now add the points
    publicAPI.addRGBPointLong(x1, r1, g1, b1, 0.5, 0.0);
    publicAPI.addRGBPointLong(x2, r2, g2, b2, 0.5, 0.0);
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  // Add a line defined in HSV
  publicAPI.addHSVSegment = (x1, h1, s1, v1, x2, h2, s2, v2) => {
    const hsv1 = [h1, s1, v1];
    const hsv2 = [h2, s2, v2];
    const rgb1 = [];
    const rgb2 = [];

    vtkMath.hsv2rgb(hsv1, rgb1);
    vtkMath.hsv2rgb(hsv2, rgb2);
    publicAPI.addRGBSegment(
      x1,
      rgb1[0],
      rgb1[1],
      rgb1[2],
      x2,
      rgb2[0],
      rgb2[1],
      rgb2[2]
    );
  };

  //----------------------------------------------------------------------------
  // Returns the RGBA color evaluated at the specified location
  publicAPI.mapValue = (x) => {
    const rgb = [];
    publicAPI.getColor(x, rgb);

    return [
      Math.floor(255.0 * rgb[0] + 0.5),
      Math.floor(255.0 * rgb[1] + 0.5),
      Math.floor(255.0 * rgb[2] + 0.5),
      255,
    ];
  };

  //----------------------------------------------------------------------------
  // Returns the RGB color evaluated at the specified location
  publicAPI.getColor = (x, rgb) => {
    if (model.indexedLookup) {
      const numNodes = publicAPI.getSize();
      // todo
      const idx = publicAPI.getAnnotatedValueIndexInternal(x);
      if (idx < 0 || numNodes === 0) {
        publicAPI.getNanColor(rgb);
      } else {
        const nodeVal = [];
        publicAPI.getNodeValue(idx % numNodes, nodeVal);
        rgb[0] = nodeVal.r;
        rgb[1] = nodeVal.g;
        rgb[2] = nodeVal.b;
      }
      return;
    }
    publicAPI.getTable(x, x, 1, rgb);
  };

  //----------------------------------------------------------------------------
  // Returns the red color evaluated at the specified location
  publicAPI.getRedValue = (x) => {
    const rgb = [];
    publicAPI.getColor(x, rgb);
    return rgb[0];
  };

  //----------------------------------------------------------------------------
  // Returns the green color evaluated at the specified location
  publicAPI.getGreenValue = (x) => {
    const rgb = [];
    publicAPI.getColor(x, rgb);
    return rgb[1];
  };

  //----------------------------------------------------------------------------
  // Returns the blue color evaluated at the specified location
  publicAPI.getBlueValue = (x) => {
    const rgb = [];
    publicAPI.getColor(x, rgb);
    return rgb[2];
  };

  //----------------------------------------------------------------------------
  // Returns a table of RGB colors at regular intervals along the function
  publicAPI.getTable = (xStart, xEnd, size, table) => {
    // Special case: If either the start or end is a NaN, then all any
    // interpolation done on them is also a NaN.  Therefore, fill the table with
    // the NaN color.
    if (vtkMath.isNan(xStart) || vtkMath.isNan(xEnd)) {
      for (let i = 0; i < size; i++) {
        table[i * 3 + 0] = model.nanColor[0];
        table[i * 3 + 1] = model.nanColor[1];
        table[i * 3 + 2] = model.nanColor[2];
      }
      return;
    }

    let idx = 0;
    const numNodes = model.nodes.length;

    // Need to keep track of the last value so that
    // we can fill in table locations past this with
    // this value if Clamping is On.
    let lastR = 0.0;
    let lastG = 0.0;
    let lastB = 0.0;
    if (numNodes !== 0) {
      lastR = model.nodes[numNodes - 1].r;
      lastG = model.nodes[numNodes - 1].g;
      lastB = model.nodes[numNodes - 1].b;
    }

    let x = 0.0;
    let x1 = 0.0;
    let x2 = 0.0;
    const rgb1 = [0.0, 0.0, 0.0];
    const rgb2 = [0.0, 0.0, 0.0];
    let midpoint = 0.0;
    let sharpness = 0.0;

    const tmpVec = [];

    // If the scale is logarithmic, make sure the range is valid.
    let usingLogScale = model.scale === Scale.LOG10;
    if (usingLogScale) {
      // Note: This requires range[0] <= range[1].
      usingLogScale = model.mappingRange[0] > 0.0;
    }

    let logStart = 0.0;
    let logEnd = 0.0;
    let logX = 0.0;
    if (usingLogScale) {
      logStart = Math.log10(xStart);
      logEnd = Math.log10(xEnd);
    }

    // For each table entry
    for (let i = 0; i < size; i++) {
      // Find our location in the table
      const tidx = 3 * i;

      // Find our X location. If we are taking only 1 sample, make
      // it halfway between start and end (usually start and end will
      // be the same in this case)
      if (size > 1) {
        if (usingLogScale) {
          logX = logStart + (i / (size - 1.0)) * (logEnd - logStart);
          x = 10.0 ** logX;
        } else {
          x = xStart + (i / (size - 1.0)) * (xEnd - xStart);
        }
      } else if (usingLogScale) {
        logX = 0.5 * (logStart + logEnd);
        x = 10.0 ** logX;
      } else {
        x = 0.5 * (xStart + xEnd);
      }

      // Do we need to move to the next node?
      while (idx < numNodes && x > model.nodes[idx].x) {
        idx++;
        // If we are at a valid point index, fill in
        // the value at this node, and the one before (the
        // two that surround our current sample location)
        // idx cannot be 0 since we just incremented it.
        if (idx < numNodes) {
          x1 = model.nodes[idx - 1].x;
          x2 = model.nodes[idx].x;
          if (usingLogScale) {
            x1 = Math.log10(x1);
            x2 = Math.log10(x2);
          }

          rgb1[0] = model.nodes[idx - 1].r;
          rgb2[0] = model.nodes[idx].r;

          rgb1[1] = model.nodes[idx - 1].g;
          rgb2[1] = model.nodes[idx].g;

          rgb1[2] = model.nodes[idx - 1].b;
          rgb2[2] = model.nodes[idx].b;

          // We only need the previous midpoint and sharpness
          // since these control this region
          midpoint = model.nodes[idx - 1].midpoint;
          sharpness = model.nodes[idx - 1].sharpness;

          // Move midpoint away from extreme ends of range to avoid
          // degenerate math
          if (midpoint < 0.00001) {
            midpoint = 0.00001;
          }

          if (midpoint > 0.99999) {
            midpoint = 0.99999;
          }
        }
      }

      // Are we at or past the end? If so, just use the last value
      if (x > model.mappingRange[1]) {
        table[tidx] = 0.0;
        table[tidx + 1] = 0.0;
        table[tidx + 2] = 0.0;
        if (model.clamping) {
          if (publicAPI.getUseAboveRangeColor()) {
            table[tidx] = model.aboveRangeColor[0];
            table[tidx + 1] = model.aboveRangeColor[1];
            table[tidx + 2] = model.aboveRangeColor[2];
          } else {
            table[tidx] = lastR;
            table[tidx + 1] = lastG;
            table[tidx + 2] = lastB;
          }
        }
      } else if (x < model.mappingRange[0] || (vtkMath.isInf(x) && x < 0)) {
        // we are before the first node? If so, duplicate this node's values.
        // We have to deal with -inf here
        table[tidx] = 0.0;
        table[tidx + 1] = 0.0;
        table[tidx + 2] = 0.0;
        if (model.clamping) {
          if (publicAPI.getUseBelowRangeColor()) {
            table[tidx] = model.belowRangeColor[0];
            table[tidx + 1] = model.belowRangeColor[1];
            table[tidx + 2] = model.belowRangeColor[2];
          } else if (numNodes > 0) {
            table[tidx] = model.nodes[0].r;
            table[tidx + 1] = model.nodes[0].g;
            table[tidx + 2] = model.nodes[0].b;
          }
        }
      } else if (idx === 0 && Math.abs(x - xStart) < 1e-6) {
        if (numNodes > 0) {
          table[tidx] = model.nodes[0].r;
          table[tidx + 1] = model.nodes[0].g;
          table[tidx + 2] = model.nodes[0].b;
        } else {
          table[tidx] = 0.0;
          table[tidx + 1] = 0.0;
          table[tidx + 2] = 0.0;
        }
      } else {
        // OK, we are between two nodes - interpolate
        // Our first attempt at a normalized location [0,1] -
        // we will be modifying this based on midpoint and
        // sharpness to get the curve shape we want and to have
        // it pass through (y1+y2)/2 at the midpoint.
        let s = 0.0;
        if (usingLogScale) {
          s = (logX - x1) / (x2 - x1);
        } else {
          s = (x - x1) / (x2 - x1);
        }

        // Readjust based on the midpoint - linear adjustment
        if (s < midpoint) {
          s = (0.5 * s) / midpoint;
        } else {
          s = 0.5 + (0.5 * (s - midpoint)) / (1.0 - midpoint);
        }

        // override for sharpness > 0.99
        // In this case we just want piecewise constant
        if (sharpness > 0.99) {
          // Use the first value since we are below the midpoint
          if (s < 0.5) {
            table[tidx] = rgb1[0];
            table[tidx + 1] = rgb1[1];
            table[tidx + 2] = rgb1[2];
            continue;
          } else {
            // Use the second value at or above the midpoint
            table[tidx] = rgb2[0];
            table[tidx + 1] = rgb2[1];
            table[tidx + 2] = rgb2[2];
            continue;
          }
        }

        // Override for sharpness < 0.01
        // In this case we want piecewise linear
        if (sharpness < 0.01) {
          // Simple linear interpolation
          if (model.colorSpace === ColorSpace.RGB) {
            table[tidx] = (1 - s) * rgb1[0] + s * rgb2[0];
            table[tidx + 1] = (1 - s) * rgb1[1] + s * rgb2[1];
            table[tidx + 2] = (1 - s) * rgb1[2] + s * rgb2[2];
          } else if (model.colorSpace === ColorSpace.HSV) {
            const hsv1 = [];
            const hsv2 = [];
            vtkMath.rgb2hsv(rgb1, hsv1);
            vtkMath.rgb2hsv(rgb2, hsv2);

            if (
              model.hSVWrap &&
              (hsv1[0] - hsv2[0] > 0.5 || hsv2[0] - hsv1[0] > 0.5)
            ) {
              if (hsv1[0] > hsv2[0]) {
                hsv1[0] -= 1.0;
              } else {
                hsv2[0] -= 1.0;
              }
            }

            const hsvTmp = [];
            hsvTmp[0] = (1.0 - s) * hsv1[0] + s * hsv2[0];
            if (hsvTmp[0] < 0.0) {
              hsvTmp[0] += 1.0;
            }
            hsvTmp[1] = (1.0 - s) * hsv1[1] + s * hsv2[1];
            hsvTmp[2] = (1.0 - s) * hsv1[2] + s * hsv2[2];

            // Now convert this back to RGB
            vtkMath.hsv2rgb(hsvTmp, tmpVec);
            table[tidx] = tmpVec[0];
            table[tidx + 1] = tmpVec[1];
            table[tidx + 2] = tmpVec[2];
          } else if (model.colorSpace === ColorSpace.LAB) {
            const lab1 = [];
            const lab2 = [];
            vtkMath.rgb2lab(rgb1, lab1);
            vtkMath.rgb2lab(rgb2, lab2);

            const labTmp = [];
            labTmp[0] = (1 - s) * lab1[0] + s * lab2[0];
            labTmp[1] = (1 - s) * lab1[1] + s * lab2[1];
            labTmp[2] = (1 - s) * lab1[2] + s * lab2[2];

            // Now convert back to RGB
            vtkMath.lab2rgb(labTmp, tmpVec);
            table[tidx] = tmpVec[0];
            table[tidx + 1] = tmpVec[1];
            table[tidx + 2] = tmpVec[2];
          } else if (model.colorSpace === ColorSpace.DIVERGING) {
            vtkColorTransferFunctionInterpolateDiverging(s, rgb1, rgb2, tmpVec);
            table[tidx] = tmpVec[0];
            table[tidx + 1] = tmpVec[1];
            table[tidx + 2] = tmpVec[2];
          } else {
            vtkErrorMacro('ColorSpace set to invalid value.', model.colorSpace);
          }
          continue;
        }

        // We have a sharpness between [0.01, 0.99] - we will
        // used a modified hermite curve interpolation where we
        // derive the slope based on the sharpness, and we compress
        // the curve non-linearly based on the sharpness

        // First, we will adjust our position based on sharpness in
        // order to make the curve sharper (closer to piecewise constant)
        if (s < 0.5) {
          s = 0.5 * (s * 2.0) ** (1.0 + 10.0 * sharpness);
        } else if (s > 0.5) {
          s = 1.0 - 0.5 * ((1.0 - s) * 2) ** (1 + 10.0 * sharpness);
        }

        // Compute some coefficients we will need for the hermite curve
        const ss = s * s;
        const sss = ss * s;

        const h1 = 2.0 * sss - 3 * ss + 1;
        const h2 = -2 * sss + 3 * ss;
        const h3 = sss - 2 * ss + s;
        const h4 = sss - ss;

        let slope;
        let t;

        if (model.colorSpace === ColorSpace.RGB) {
          for (let j = 0; j < 3; j++) {
            // Use one slope for both end points
            slope = rgb2[j] - rgb1[j];
            t = (1.0 - sharpness) * slope;

            // Compute the value
            table[tidx + j] = h1 * rgb1[j] + h2 * rgb2[j] + h3 * t + h4 * t;
          }
        } else if (model.colorSpace === ColorSpace.HSV) {
          const hsv1 = [];
          const hsv2 = [];
          vtkMath.rgb2hsv(rgb1, hsv1);
          vtkMath.rgb2hsv(rgb2, hsv2);

          if (
            model.hSVWrap &&
            (hsv1[0] - hsv2[0] > 0.5 || hsv2[0] - hsv1[0] > 0.5)
          ) {
            if (hsv1[0] > hsv2[0]) {
              hsv1[0] -= 1.0;
            } else {
              hsv2[0] -= 1.0;
            }
          }

          const hsvTmp = [];

          for (let j = 0; j < 3; j++) {
            // Use one slope for both end points
            slope = hsv2[j] - hsv1[j];
            t = (1.0 - sharpness) * slope;

            // Compute the value
            hsvTmp[j] = h1 * hsv1[j] + h2 * hsv2[j] + h3 * t + h4 * t;
            if (j === 0 && hsvTmp[j] < 0.0) {
              hsvTmp[j] += 1.0;
            }
          }
          // Now convert this back to RGB
          vtkMath.hsv2rgb = (hsvTmp, tmpVec);
          table[tidx] = tmpVec[0];
          table[tidx + 1] = tmpVec[1];
          table[tidx + 2] = tmpVec[2];
        } else if (model.colorSpace === ColorSpace.LAB) {
          const lab1 = [];
          const lab2 = [];
          vtkMath.rgb2lab(rgb1, lab1);
          vtkMath.rgb2lab(rgb2, lab2);

          const labTmp = [];
          for (let j = 0; j < 3; j++) {
            // Use one slope for both end points
            slope = lab2[j] - lab1[j];
            t = (1.0 - sharpness) * slope;

            // Compute the value
            labTmp[j] = h1 * lab1[j] + h2 * lab2[j] + h3 * t + h4 * t;
          }
          // Now convert this back to RGB
          vtkMath.lab2rgb(labTmp, tmpVec);
          table[tidx] = tmpVec[0];
          table[tidx + 1] = tmpVec[1];
          table[tidx + 2] = tmpVec[2];
        } else if (model.colorSpace === ColorSpace.DIVERGING) {
          // I have not implemented proper interpolation by a hermite curve for
          // the diverging color map, but I cannot think of a good use case for
          // that anyway.
          vtkColorTransferFunctionInterpolateDiverging(s, rgb1, rgb2, tmpVec);
          table[tidx] = tmpVec[0];
          table[tidx + 1] = tmpVec[1];
          table[tidx + 2] = tmpVec[2];
        } else {
          vtkErrorMacro('ColorSpace set to invalid value.');
        }

        // Final error check to make sure we don't go outside [0,1]
        for (let j = 0; j < 3; j++) {
          table[tidx + j] = table[tidx + j] < 0.0 ? 0.0 : table[tidx + j];
          table[tidx + j] = table[tidx + j] > 1.0 ? 1.0 : table[tidx + j];
        }
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.getUint8Table = (xStart, xEnd, size, withAlpha = false) => {
    if (
      publicAPI.getMTime() <= model.buildTime &&
      model.tableSize === size &&
      model.tableWithAlpha !== withAlpha
    ) {
      return model.table;
    }

    if (model.nodes.length === 0) {
      vtkErrorMacro(
        'Attempting to lookup a value with no points in the function'
      );
      return model.table;
    }

    const nbChannels = withAlpha ? 4 : 3;
    if (model.tableSize !== size || model.tableWithAlpha !== withAlpha) {
      model.table = new Uint8Array(size * nbChannels);
      model.tableSize = size;
      model.tableWithAlpha = withAlpha;
    }

    const tmpTable = [];
    publicAPI.getTable(xStart, xEnd, size, tmpTable);

    for (let i = 0; i < size; i++) {
      model.table[i * nbChannels + 0] = Math.floor(
        tmpTable[i * 3 + 0] * 255.0 + 0.5
      );
      model.table[i * nbChannels + 1] = Math.floor(
        tmpTable[i * 3 + 1] * 255.0 + 0.5
      );
      model.table[i * nbChannels + 2] = Math.floor(
        tmpTable[i * 3 + 2] * 255.0 + 0.5
      );
      if (withAlpha) {
        model.table[i * nbChannels + 3] = 255;
      }
    }

    model.buildTime.modified();
    return model.table;
  };

  //----------------------------------------------------------------------------
  publicAPI.buildFunctionFromTable = (xStart, xEnd, size, table) => {
    let inc = 0.0;

    publicAPI.removeAllPoints();

    if (size > 1) {
      inc = (xEnd - xStart) / (size - 1.0);
    }

    for (let i = 0; i < size; i++) {
      const node = {
        x: xStart + inc * i,
        r: table[i * 3],
        g: table[i * 3 + 1],
        b: table[i * 3 + 2],
        sharpness: 0.0,
        midpoint: 0.5,
      };
      model.nodes.push(node);
    }

    publicAPI.sortAndUpdateRange();
  };

  //----------------------------------------------------------------------------
  // For a specified index value, get the node parameters
  publicAPI.getNodeValue = (index, val) => {
    if (index < 0 || index >= model.nodes.length) {
      vtkErrorMacro('Index out of range!');
      return -1;
    }

    val[0] = model.nodes[index].x;
    val[1] = model.nodes[index].r;
    val[2] = model.nodes[index].g;
    val[3] = model.nodes[index].b;
    val[4] = model.nodes[index].midpoint;
    val[5] = model.nodes[index].sharpness;

    return 1;
  };

  //----------------------------------------------------------------------------
  // For a specified index value, get the node parameters
  publicAPI.setNodeValue = (index, val) => {
    if (index < 0 || index >= model.nodes.length) {
      vtkErrorMacro('Index out of range!');
      return -1;
    }

    const oldX = model.nodes[index].x;
    model.nodes[index].x = val[0];
    model.nodes[index].r = val[1];
    model.nodes[index].g = val[2];
    model.nodes[index].b = val[3];
    model.nodes[index].midpoint = val[4];
    model.nodes[index].sharpness = val[5];

    if (oldX !== val[0]) {
      // The point has been moved, the order of points or the range might have
      // been modified.
      publicAPI.sortAndUpdateRange();
      // No need to call Modified() here because SortAndUpdateRange() has done it
      // already.
    } else {
      publicAPI.modified();
    }

    return 1;
  };

  //----------------------------------------------------------------------------
  publicAPI.getNumberOfAvailableColors = () => {
    if (model.indexedLookup && publicAPI.getSize()) {
      return publicAPI.getSize();
    }
    if (model.tableSize) {
      // Not sure if this is correct since it is only set if
      // "const unsigned char *::GetTable(double xStart, double xEnd,int size)"
      // has been called.
      return model.tableSize;
    }
    return 16777216; // 2^24
  };

  //----------------------------------------------------------------------------
  publicAPI.getIndexedColor = (idx, rgba) => {
    const n = publicAPI.getSize();
    if (n > 0 && idx >= 0) {
      const nodeValue = [];
      publicAPI.getNodeValue(idx % n, nodeValue);
      for (let j = 0; j < 3; ++j) {
        rgba[j] = nodeValue[j + 1];
      }
      rgba[3] = 1.0; // NodeColor is RGB-only.
      return;
    }
    publicAPI.getNanColor(rgba);
    rgba[3] = 1.0; // NanColor is RGB-only.
  };

  //----------------------------------------------------------------------------
  publicAPI.fillFromDataPointer = (nb, ptr) => {
    if (nb <= 0 || !ptr) {
      return;
    }

    publicAPI.removeAllPoints();

    for (let i = 0; i < nb; i++) {
      publicAPI.addRGBPoint(
        ptr[i * 4],
        ptr[i * 4 + 1],
        ptr[i * 4 + 2],
        ptr[i * 4 + 3]
      );
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.setMappingRange = (min, max) => {
    const range = [min, max];
    const originalRange = publicAPI.getRange();
    if (originalRange[1] === range[1] && originalRange[0] === range[0]) {
      return;
    }

    if (range[1] === range[0]) {
      vtkErrorMacro('attempt to set zero width color range');
      return;
    }

    const scale = (range[1] - range[0]) / (originalRange[1] - originalRange[0]);
    const shift = range[0] - originalRange[0] * scale;

    for (let i = 0; i < model.nodes.length; ++i) {
      model.nodes[i].x = model.nodes[i].x * scale + shift;
    }

    model.mappingRange[0] = range[0];
    model.mappingRange[1] = range[1];
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.adjustRange = (range) => {
    const functionRange = publicAPI.getRange();

    // Make sure we have points at each end of the range
    const rgb = [];
    if (functionRange[0] < range[0]) {
      publicAPI.getColor(range[0], rgb);
      publicAPI.addRGBPoint(range[0], rgb[0], rgb[1], rgb[2]);
    } else {
      publicAPI.getColor(functionRange[0], rgb);
      publicAPI.addRGBPoint(range[0], rgb[0], rgb[1], rgb[2]);
    }

    if (functionRange[1] > range[1]) {
      publicAPI.getColor(range[1], rgb);
      publicAPI.addRGBPoint(range[1], rgb[0], rgb[1], rgb[2]);
    } else {
      publicAPI.getColor(functionRange[1], rgb);
      publicAPI.addRGBPoint(range[1], rgb[0], rgb[1], rgb[2]);
    }

    // Remove all points out-of-range
    publicAPI.sortAndUpdateRange();
    for (let i = 0; i < model.nodes.length; ) {
      if (model.nodes[i].x >= range[0] && model.nodes[i].x <= range[1]) {
        model.nodes.splice(i, 1);
      } else {
        ++i;
      }
    }

    return 1;
  };

  //--------------------------------------------------------------------------
  publicAPI.estimateMinNumberOfSamples = (x1, x2) => {
    const d = publicAPI.findMinimumXDistance();
    return Math.ceil((x2 - x1) / d);
  };

  //----------------------------------------------------------------------------
  publicAPI.findMinimumXDistance = () => {
    if (model.nodes.length < 2) {
      return -1.0;
    }

    let distance = Number.MAX_VALUE;
    for (let i = 0; i < model.nodes.length - 1; i++) {
      const currentDist = model.nodes[i + 1].x - model.nodes[i].x;
      if (currentDist < distance) {
        distance = currentDist;
      }
    }

    return distance;
  };

  publicAPI.mapScalarsThroughTable = (
    input,
    output,
    outFormat,
    inputOffset
  ) => {
    if (publicAPI.getSize() === 0) {
      vtkDebugMacro('Transfer Function Has No Points!');
      return;
    }

    if (model.indexedLookup) {
      publicAPI.mapDataIndexed(input, output, outFormat, inputOffset);
    } else {
      publicAPI.mapData(input, output, outFormat, inputOffset);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.mapData = (input, output, outFormat, inputOffset) => {
    if (publicAPI.getSize() === 0) {
      vtkWarningMacro('Transfer Function Has No Points!');
      return;
    }

    const alpha = Math.floor(publicAPI.getAlpha() * 255.0 + 0.5);
    const length = input.getNumberOfTuples();
    const inIncr = input.getNumberOfComponents();

    const outputV = output.getData();
    const inputV = input.getData();
    const rgb = [];

    if (outFormat === ScalarMappingTarget.RGBA) {
      for (let i = 0; i < length; i++) {
        const x = inputV[i * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[i * 4] = Math.floor(rgb[0] * 255.0 + 0.5);
        outputV[i * 4 + 1] = Math.floor(rgb[1] * 255.0 + 0.5);
        outputV[i * 4 + 2] = Math.floor(rgb[2] * 255.0 + 0.5);
        outputV[i * 4 + 3] = alpha;
      }
    }

    if (outFormat === ScalarMappingTarget.RGB) {
      for (let i = 0; i < length; i++) {
        const x = inputV[i * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[i * 3] = Math.floor(rgb[0] * 255.0 + 0.5);
        outputV[i * 3 + 1] = Math.floor(rgb[1] * 255.0 + 0.5);
        outputV[i * 3 + 2] = Math.floor(rgb[2] * 255.0 + 0.5);
      }
    }

    if (outFormat === ScalarMappingTarget.LUMINANCE) {
      for (let i = 0; i < length; i++) {
        const x = inputV[i * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[i] = Math.floor(
          rgb[0] * 76.5 + rgb[1] * 150.45 + rgb[2] * 28.05 + 0.5
        );
      }
    }

    if (outFormat === ScalarMappingTarget.LUMINANCE_ALPHA) {
      for (let i = 0; i < length; i++) {
        const x = inputV[i * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[i * 2] = Math.floor(
          rgb[0] * 76.5 + rgb[1] * 150.45 + rgb[2] * 28.05 + 0.5
        );
        outputV[i * 2 + 1] = alpha;
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.applyColorMap = (colorMap) => {
    if (colorMap.ColorSpace) {
      model.colorSpace = ColorSpace[colorMap.ColorSpace.toUpperCase()];
      if (model.colorSpace === undefined) {
        vtkErrorMacro(
          `ColorSpace ${colorMap.ColorSpace} not supported, using RGB instead`
        );
        model.colorSpace = ColorSpace.RGB;
      }
    }
    if (colorMap.NanColor) {
      model.nanColor = [].concat(colorMap.NanColor);
      while (model.nanColor.length < 4) {
        model.nanColor.push(1.0);
      }
    }
    if (colorMap.RGBPoints) {
      const size = colorMap.RGBPoints.length;
      model.nodes = [];
      const midpoint = 0.5;
      const sharpness = 0.0;
      for (let i = 0; i < size; i += 4) {
        model.nodes.push({
          x: colorMap.RGBPoints[i],
          r: colorMap.RGBPoints[i + 1],
          g: colorMap.RGBPoints[i + 2],
          b: colorMap.RGBPoints[i + 3],
          midpoint,
          sharpness,
        });
      }
    }
    // FIXME: not supported ?
    // if (colorMap.IndexedColors) {
    // }
    // if (colorMap.Annotations) {
    // }

    publicAPI.sortAndUpdateRange();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  clamping: true,
  colorSpace: ColorSpace.RGB,
  hSVWrap: true,
  scale: Scale.LINEAR,

  nanColor: null,
  belowRangeColor: null,
  aboveRangeColor: null,
  useAboveRangeColor: false,
  useBelowRangeColor: false,

  allowDuplicateScalars: false,

  table: null,
  tableSize: 0,
  buildTime: null,

  nodes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkScalarsToColors.extend(publicAPI, model, initialValues);

  // Internal objects initialization
  model.table = [];
  model.nodes = [];

  model.nanColor = [0.5, 0.0, 0.0, 1.0];
  model.belowRangeColor = [0.0, 0.0, 0.0, 1.0];
  model.aboveRangeColor = [1.0, 1.0, 1.0, 1.0];

  model.buildTime = {};
  macro.obj(model.buildTime);

  // Create get-only macros
  macro.get(publicAPI, model, ['buildTime', 'mappingRange']);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'useAboveRangeColor',
    'useBelowRangeColor',
    'colorSpace',
  ]);

  macro.setArray(
    publicAPI,
    model,
    ['nanColor', 'belowRangeColor', 'aboveRangeColor'],
    4
  );

  // Create get macros for array
  macro.getArray(publicAPI, model, [
    'nanColor',
    'belowRangeColor',
    'aboveRangeColor',
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkColorTransferFunction(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkColorTransferFunction'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
