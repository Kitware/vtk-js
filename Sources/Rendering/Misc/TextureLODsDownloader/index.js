import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------

const getRemoteFileSize = (url) =>
  // This function only works if the server provides a 'Content-Length'.
  // For some reason, the 'Content-Length' header does not appear to be
  // given for CORS HEAD requests on firefox. So this will not work on
  // firefox if the images do not have the same origin as the html file.
  // TODO: figure out how to make this work for CORS requests on firefox.
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const size = xhr.getResponseHeader('Content-Length');
          resolve(size);
        } else {
          console.log('Failed to get remote file size of', url);
          reject(xhr);
        }
      }
    };

    xhr.send();
  });

// ----------------------------------------------------------------------------
// vtkTextureLODsDownloader methods
// ----------------------------------------------------------------------------

function vtkTextureLODsDownloader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTextureLODsDownloader');

  const internal = {
    downloadStack: [],
  };

  //--------------------------------------------------------------------------

  publicAPI.startDownloads = () => {
    if (!model.texture) {
      vtkErrorMacro('Texture was not set.');
      return;
    }

    if (!model.files || model.files.length === 0) {
      vtkErrorMacro('No files set.');
      return;
    }

    let baseUrl = model.baseUrl;
    if (baseUrl && !baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    // Create the download stack
    internal.downloadStack = [];
    model.files.forEach((file) =>
      internal.downloadStack.push(`${baseUrl}${file}`)
    );

    const downloadNextTexture = () => {
      if (internal.downloadStack.length === 0) {
        return;
      }

      // For later use
      const asyncDownloadNextTexture = () => {
        setTimeout(downloadNextTexture, model.waitTimeBetweenDownloads);
      };

      const img = new Image();
      if (model.crossOrigin) {
        img.crossOrigin = model.crossOrigin;
      }

      const url = internal.downloadStack.shift();
      getRemoteFileSize(url)
        .then((size) => {
          if (!size || size / 1024 > model.maxTextureLODSize) {
            if (!size) {
              console.log('Failed to get image size');
            } else {
              console.log(
                'Skipping image',
                url,
                ', because it is larger',
                'than the max texture size:',
                model.maxTextureLODSize,
                'KiB'
              );
            }
            asyncDownloadNextTexture();
            return;
          }

          img.src = url;
          // Decode the image asynchronously in an attempt to prevent a
          // freeze during rendering.
          // In theory, this should help, but my profiling indicates that
          // it does not help much... maybe it is running in the main
          // thread anyways?
          img
            .decode()
            .then(() => {
              model.texture.setImage(img);
              if (model.stepFinishedCallback) {
                model.stepFinishedCallback();
              }
              asyncDownloadNextTexture();
            })
            .catch((encodingError) => {
              console.log('Failed to decode image:', img.src);
              console.log('Error is:', encodingError);
              asyncDownloadNextTexture();
            });
        })
        .catch((xhr) => {
          console.log('Failed to get size of:', url);
          console.log('status was:', xhr.status);
          console.log('statusText was:', xhr.statusText);
          asyncDownloadNextTexture();
        });
    };

    setTimeout(downloadNextTexture, model.waitTimeToStart);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  baseUrl: '',
  files: [],
  texture: null,
  crossOrigin: undefined,
  // The max texture LOD file size in KiB
  maxTextureLODSize: 50000,
  stepFinishedCallback: null,
  // These are in milliseconds
  waitTimeToStart: 4000,
  waitTimeBetweenDownloads: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'baseUrl',
    'files',
    'texture',
    'crossOrigin',
    'maxTextureLODSize',
    'stepFinishedCallback',
    'waitTimeToStart',
    'waitTimeBetweenDownloads',
  ]);

  // Object specific methods
  vtkTextureLODsDownloader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTextureLODsDownloader'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
