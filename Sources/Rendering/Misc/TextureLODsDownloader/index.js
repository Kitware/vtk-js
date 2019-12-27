import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro } = macro;

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
      const img = new Image();
      img.onload = () => {
        model.texture.setImage(img);
        if (model.stepFinishedCallback) {
          model.stepFinishedCallback();
        }

        if (internal.downloadStack.length !== 0) {
          setTimeout(downloadNextTexture, model.waitTimeBetweenDownloads);
        }
      };
      if (model.crossOrigin) {
        img.crossOrigin = model.crossOrigin;
      }
      img.src = internal.downloadStack.shift();
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
