/* eslint-disable no-bitwise */
// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import macro from 'vtk.js/Sources/macros';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import Constants from 'vtk.js/Sources/IO/Image/TGAReader/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTGAReader methods
// ----------------------------------------------------------------------------

function vtkTGAReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTGAReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  /**
   * Gets the header of a TGA file
   * @param data defines the TGA data
   * @returns the header
   */
  function parseHeader(data) {
    let offset = 0;

    const header = {
      idLength: data[offset++],
      colormap_type: data[offset++],
      imageType: data[offset++],
      colormapIndex: data[offset++] | (data[offset++] << 8),
      colormapLength: data[offset++] | (data[offset++] << 8),
      colormapSize: data[offset++],
      origin: [
        data[offset++] | (data[offset++] << 8),
        data[offset++] | (data[offset++] << 8),
      ],
      width: data[offset++] | (data[offset++] << 8),
      height: data[offset++] | (data[offset++] << 8),
      pixelSize: data[offset++],
      flags: data[offset++],
    };

    return header;
  }

  const handlers = {
    getImageData8bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const colormap = palettes;
      const width = header.width;
      const height = header.height;
      let color;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i++) {
          color = image[i];
          imageData[(x + width * y) * 4 + 3] = 255;
          imageData[(x + width * y) * 4 + 2] = colormap[color * 3 + 0];
          imageData[(x + width * y) * 4 + 1] = colormap[color * 3 + 1];
          imageData[(x + width * y) * 4 + 0] = colormap[color * 3 + 2];
        }
      }

      return imageData;
    },
    getImageData16bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const width = header.width;
      const height = header.height;
      let color;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i += 2) {
          color = image[i + 0] + (image[i + 1] << 8); // Inversed ?
          const r = ((((color & 0x7c00) >> 10) * 255) / 0x1f) | 0;
          const g = ((((color & 0x03e0) >> 5) * 255) / 0x1f) | 0;
          const b = (((color & 0x001f) * 255) / 0x1f) | 0;

          imageData[(x + width * y) * 4 + 0] = r;
          imageData[(x + width * y) * 4 + 1] = g;
          imageData[(x + width * y) * 4 + 2] = b;
          imageData[(x + width * y) * 4 + 3] = color & 0x8000 ? 0 : 255;
        }
      }

      return imageData;
    },
    getImageData24bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const width = header.width;
      const height = header.height;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i += 3) {
          imageData[(x + width * y) * 4 + 3] = 255;
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 1];
          imageData[(x + width * y) * 4 + 0] = image[i + 2];
        }
      }

      return imageData;
    },
    getImageData32bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const width = header.width;
      const height = header.height;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i += 4) {
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 1];
          imageData[(x + width * y) * 4 + 0] = image[i + 2];
          imageData[(x + width * y) * 4 + 3] = image[i + 3];
        }
      }

      return imageData;
    },
    getImageDataGrey8bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const width = header.width;
      const height = header.height;
      let color;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i++) {
          color = image[i];
          imageData[(x + width * y) * 4 + 0] = color;
          imageData[(x + width * y) * 4 + 1] = color;
          imageData[(x + width * y) * 4 + 2] = color;
          imageData[(x + width * y) * 4 + 3] = 255;
        }
      }

      return imageData;
    },
    getImageDataGrey16bits(
      header,
      palettes,
      pixeData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    ) {
      const image = pixeData;
      const width = header.width;
      const height = header.height;
      let i = 0;
      let x;
      let y;

      const imageData = new Uint8Array(width * height * 4);

      for (y = yStart; y !== yEnd; y += yStep) {
        for (x = xStart; x !== xEnd; x += xStep, i += 2) {
          imageData[(x + width * y) * 4 + 0] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 0];
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 3] = image[i + 1];
        }
      }

      return imageData;
    },
  };

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

    const data = new Uint8Array(content);
    // Not enough data to contain header ?
    if (data.length < 19) {
      vtkErrorMacro(
        'Unable to load TGA file - Not enough data to contain header'
      );
      return;
    }

    // Read Header
    let offset = 18;
    const header = parseHeader(data);

    // Assume it's a valid Targa file.
    if (header.idLength + offset > data.length) {
      vtkErrorMacro('Unable to load TGA file - Not enough data');
      return;
    }

    // Skip not needed data
    offset += header.idLength;

    let useRle = false;
    let usePal = false;
    let useGrey = false;

    // Get some informations.
    switch (header.imageType) {
      case Constants.TYPE_RLE_INDEXED:
        useRle = true;
      // eslint-disable-next-line no-fallthrough
      case Constants.TYPE_INDEXED:
        usePal = true;
        break;
      case Constants.TYPE_RLE_RGB:
        useRle = true;
      // eslint-disable-next-line no-fallthrough
      case Constants.TYPE_RGB:
        // use_rgb = true;
        break;
      case Constants.TYPE_RLE_GREY:
        useRle = true;
      // eslint-disable-next-line no-fallthrough
      case Constants.TYPE_GREY:
        useGrey = true;
        break;
      default:
        vtkErrorMacro('TGA file has unknown image type');
        return;
    }

    let pixelData;

    const pixelSize = header.pixelSize >> 3;
    const pixelTotal = header.width * header.height * pixelSize;

    // Read palettes
    let palettes;

    if (usePal) {
      palettes = data.subarray(
        offset,
        (offset += header.colormapLength * (header.colormapSize >> 3))
      );
    }

    // Read LRE
    if (useRle) {
      pixelData = new Uint8Array(pixelTotal);

      let c;
      let count;
      let i;
      let localOffset = 0;
      const pixels = new Uint8Array(pixelSize);

      while (offset < pixelTotal && localOffset < pixelTotal) {
        c = data[offset++];
        count = (c & 0x7f) + 1;

        // RLE pixels
        if (c & 0x80) {
          // Bind pixel tmp array
          for (i = 0; i < pixelSize; ++i) {
            pixels[i] = data[offset++];
          }

          // Copy pixel array
          for (i = 0; i < count; ++i) {
            pixelData.set(pixels, localOffset + i * pixelSize);
          }

          localOffset += pixelSize * count;
        }
        // Raw pixels
        else {
          count *= pixelSize;
          for (i = 0; i < count; ++i) {
            pixelData[localOffset + i] = data[offset++];
          }
          localOffset += count;
        }
      }
    }
    // RAW Pixels
    else {
      pixelData = data.subarray(
        offset,
        (offset += usePal ? header.width * header.height : pixelTotal)
      );
    }

    // Load to texture
    let xStart;
    let yStart;
    let xStep;
    let yStep;
    let yEnd;
    let xEnd;

    switch ((header.flags & Constants.ORIGIN_MASK) >> Constants.ORIGIN_SHIFT) {
      case Constants.ORIGIN_UL:
        xStart = 0;
        xStep = 1;
        xEnd = header.width;
        yStart = 0;
        yStep = 1;
        yEnd = header.height;
        break;

      case Constants.ORIGIN_BL:
        xStart = 0;
        xStep = 1;
        xEnd = header.width;
        yStart = 0;
        yStep = 1;
        yEnd = header.height;
        break;

      case Constants.ORIGIN_UR:
        xStart = header.width - 1;
        xStep = -1;
        xEnd = -1;
        yStart = 0;
        yStep = 1;
        yEnd = header.height;
        break;

      case Constants.ORIGIN_BR:
        xStart = header.width - 1;
        xStep = -1;
        xEnd = -1;
        yStart = header.height - 1;
        yStep = -1;
        yEnd = -1;
        break;
      default:
        vtkErrorMacro('TGA file has unknown origin');
        return;
    }

    const func = `getImageData${useGrey ? 'Grey' : ''}${header.pixelSize}bits`;

    const output = handlers[func](
      header,
      palettes,
      pixelData,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    );

    const dataExtent = [0, header.width - 1, 0, header.height - 1];
    const dataSpacing = [1, 1, 1];

    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(header.width, header.height, 1);
    imageData.setExtent(dataExtent);
    imageData.setSpacing(dataSpacing);

    const dataArray = vtkDataArray.newInstance({
      name: 'TGAImage',
      numberOfComponents: 4,
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

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 0, 1);

  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);

  // Object specific methods
  vtkTGAReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTGAReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
