/* eslint-disable no-bitwise */

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import macro from 'vtk.js/Sources/macros';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { readLine, rgbe2float } from 'vtk.js/Sources/IO/Image/HDRReader/Utils';

const { vtkErrorMacro } = macro;

const FormatType = {
  FORMAT_32BIT_RLE_RGBE: 0,
  FORMAT_32BIT_RLE_XYZE: 1,
};

const Patterns = {
  magicToken: /^#\?(\S+)/,
  gamma: /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,
  exposure: /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,
  format: /^\s*FORMAT=(\S+)\s*$/,
  dimensions: /^\s*-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,
};

// ----------------------------------------------------------------------------
// vtkHDRReader methods
// ----------------------------------------------------------------------------

function vtkHDRReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHDRReader');

  /**
   * Reads header information from an RGBE texture stored in a native array.
   * More information on this format are available here:
   * https://en.wikipedia.org/wiki/RGBE_image_format
   *
   * @param {Uint8Array} uint8array The binary file stored in  native array.
   * @returns The header information.
   */
  function readHeader(uint8array) {
    // RGBE format header
    const header = {
      valid: 0,
      string: '',
      comments: '',
      programtype: 'RGBE',
      format: '',
      gamma: 1.0,
      exposure: 1.0,
      pixelAspect: 1.0,
      width: 0,
      height: 0,
      dataIndex: 0,
    };

    let match;
    let line = readLine(uint8array, 0);

    match = line.match(Patterns.magicToken);
    if (!match) {
      throw new Error('Bad HDR Format.');
    }

    header.programtype = match[1];
    header.string += `${line}\n`;

    let lineIndex = 0;

    do {
      lineIndex += line.length + 1;
      line = readLine(uint8array, lineIndex);
      header.string += `${line}\n`;

      if (line.charAt(0) === '#') {
        header.comments += `${line}\n`;
        // eslint-disable-next-line no-continue
        continue; // comment line
      }

      match = line.match(Patterns.gamma);
      if (match) {
        header.gamma = parseFloat(match[1]);
      }

      match = line.match(Patterns.exposure);
      if (match) {
        header.exposure = parseFloat(match[1]);
      }

      match = line.match(Patterns.format);
      if (match) {
        header.format = match[1];
      }
    } while (line.length !== 0);

    lineIndex += line.length + 1;
    line = readLine(uint8array, lineIndex);

    match = line.match(Patterns.dimensions);
    if (match) {
      header.height = parseInt(match[1], 10);
      header.width = parseInt(match[2], 10);
    }

    if (header.width < 8 || header.width > 0x7fff) {
      vtkErrorMacro('HDR Bad header format, unsupported size');
    }

    lineIndex += line.length + 1;
    header.dataIndex = lineIndex;
    return header;
  }

  /**
   *
   * @param {Uint8Array} uint8array
   * @param {*} header
   * @returns Float32Array
   */
  function readRGBEPixelsNotRLE(uint8array, header) {
    // this file is not run length encoded
    // read values sequentially

    let numScanlines = header.height;
    const scanlineWidth = header.width;

    let a;
    let b;
    let c;
    let d;
    let i;
    let dataIndex = header.dataIndex;

    // 3 channels of 4 bytes per pixel in float.
    const resultBuffer = new ArrayBuffer(header.width * header.height * 4 * 3);
    const resultArray = new Float32Array(resultBuffer);

    // read in each successive scanline
    while (numScanlines > 0) {
      for (i = 0; i < header.width; i++) {
        a = uint8array[dataIndex++];
        b = uint8array[dataIndex++];
        c = uint8array[dataIndex++];
        d = uint8array[dataIndex++];

        const offset = (numScanlines - 1) * scanlineWidth * 3 + i * 3;
        let output = [];
        const input = [a, b, c, d];
        if (model.format === FormatType.FORMAT_32BIT_RLE_XYZE) {
          // convert from XYZE to RGBE
          vtkMath.xyz2rgb(input, output);
        } else {
          output = rgbe2float(input, model.exposure);
        }
        resultArray[offset] = output[0];
        resultArray[offset + 1] = output[1];
        resultArray[offset + 2] = output[2];
      }

      numScanlines--;
    }

    return resultArray;
  }

  /**
   *
   * @param {Uint8Array} uint8array
   * @param {*} header
   * @returns Float32Array
   */
  function readRGBEPixelsRLE(uint8array, header) {
    let numScanlines = header.height;
    const scanlineWidth = header.width;

    let a;
    let b;
    let c;
    let d;
    let count;
    let dataIndex = header.dataIndex;
    let index = 0;
    let endIndex = 0;
    let i = 0;

    const scanLineArrayBuffer = new ArrayBuffer(scanlineWidth * 4); // four channel R G B E
    const scanLineArray = new Uint8Array(scanLineArrayBuffer);

    // 3 channels of 4 bytes per pixel in float.
    const resultBuffer = new ArrayBuffer(header.width * header.height * 4 * 3);
    const resultArray = new Float32Array(resultBuffer);

    // read in each successive scanline
    while (numScanlines > 0) {
      a = uint8array[dataIndex++];
      b = uint8array[dataIndex++];
      c = uint8array[dataIndex++];
      d = uint8array[dataIndex++];

      if (
        a !== 2 ||
        b !== 2 ||
        c & 0x80 ||
        header.width < 8 ||
        header.width > 32767
      ) {
        return readRGBEPixelsNotRLE(uint8array, header);
      }

      if (((c << 8) | d) !== scanlineWidth) {
        vtkErrorMacro('HDR Bad header format, wrong scan line width');
      }

      index = 0;

      // read each of the four channels for the scanline into the buffer
      for (i = 0; i < 4; i++) {
        endIndex = (i + 1) * scanlineWidth;

        while (index < endIndex) {
          a = uint8array[dataIndex++];
          b = uint8array[dataIndex++];

          if (a > 128) {
            // A run of the same value
            count = a - 128;
            if (count === 0 || count > endIndex - index) {
              vtkErrorMacro('HDR Bad Format, bad scanline data (run)');
            }

            while (count-- > 0) {
              scanLineArray[index++] = b;
            }
          } else {
            // A non run
            count = a;
            if (count === 0 || count > endIndex - index) {
              vtkErrorMacro('HDR Bad Format, bad scanline data (non-run)');
            }

            scanLineArray[index++] = b;
            if (--count > 0) {
              for (let j = 0; j < count; j++) {
                scanLineArray[index++] = uint8array[dataIndex++];
              }
            }
          }
        }
      }

      // now convert data from buffer into floats
      for (i = 0; i < scanlineWidth; i++) {
        a = scanLineArray[i];
        b = scanLineArray[i + scanlineWidth];
        c = scanLineArray[i + 2 * scanlineWidth];
        d = scanLineArray[i + 3 * scanlineWidth];

        const offset = (numScanlines - 1) * scanlineWidth * 3 + i * 3;
        let output = [];
        const input = [a, b, c, d];
        if (model.format === FormatType.FORMAT_32BIT_RLE_XYZE) {
          // convert from XYZE to RGBE
          vtkMath.xyz2rgb(input, output);
        } else {
          output = rgbe2float(input, model.exposure);
        }
        resultArray[offset] = output[0];
        resultArray[offset + 1] = output[1];
        resultArray[offset + 2] = output[2];
      }

      numScanlines--;
    }

    return resultArray;
  }

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    return model.dataAccessHelper.fetchBinary(url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({
      progressCallback: option.progressCallback,
    });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    publicAPI.parseAsArrayBuffer(content);
  };

  publicAPI.parseAsArrayBuffer = (content) => {
    if (!content) {
      return;
    }

    model.parseData = content;

    const data = new Uint8Array(model.parseData);
    const header = readHeader(data);

    if (header.format === '32-bit_rle_rgbe') {
      model.format = FormatType.FORMAT_32BIT_RLE_RGBE;
    } else if (header.format === '32-bit_rle_xyze') {
      model.format = FormatType.FORMAT_32BIT_RLE_XYZE;
    }

    model.gamma = header.gamma;
    model.exposure = header.exposure;
    model.pixelAspect = header.pixelAspect;

    const output = readRGBEPixelsRLE(data, header);

    const dataExtent = [0, header.width - 1, 0, header.height - 1];
    const dataSpacing = [1, header.pixelAspect, 1];

    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(header.width, header.height, 1);
    imageData.setExtent(dataExtent);
    imageData.setSpacing(dataSpacing);

    const dataArray = vtkDataArray.newInstance({
      name: 'HDRImage',
      numberOfComponents: 3,
      values: output,
    });

    imageData.getPointData().setScalars(dataArray);
    model.output[0] = imageData;
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  gamma: 1.0,
  exposure: 1.0,
  pixelAspect: 1.0,
  format: FormatType.FORMAT_32BIT_RLE_RGBE,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 0, 1);

  macro.get(publicAPI, model, [
    'gamma',
    'exposure',
    'pixelAspect',
    'url',
    'baseURL',
  ]);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);

  // Object specific methods
  vtkHDRReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHDRReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
