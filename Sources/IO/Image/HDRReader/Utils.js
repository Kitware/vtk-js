import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

/**
 * Read a line from a Uint8Array
 * @param {Uint8Array} uint8array
 * @param {number} startIndex
 * @returns string
 */
function readLine(uint8array, startIndex) {
  let line = '';
  let character = '';
  for (let i = startIndex; i < uint8array.length - startIndex; i++) {
    character = String.fromCharCode(uint8array[i]);
    if (character === '\n') {
      break;
    }
    line += character;
  }
  return line;
}

/**
 * Convert rgbe to float
 * @param {Array} rgbe The rgbe array
 * @param {Array} floats The output array
 * @param {number} exposure The exposure value
 */
function rgbe2float(rgbe, exposure, floats = []) {
  if (rgbe[3] > 0) {
    /* nonzero pixel */
    const f = vtkMath.ldexp(1.0, rgbe[3] - (128 + 8)) / exposure;
    floats[0] = rgbe[0] * f;
    floats[1] = rgbe[1] * f;
    floats[2] = rgbe[2] * f;
  } else {
    floats[0] = 0;
    floats[1] = 0;
    floats[2] = 0;
  }
  return floats;
}

export { readLine, rgbe2float };
