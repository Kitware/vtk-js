import * as macro from '../../../macro';
import DataAccessHelper from '../../Core/DataAccessHelper';
import vtkTexture from '../../../Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// vtkMTLReader methods
// ----------------------------------------------------------------------------

function vtkMTLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMTLReader');

  function imageReady() {
    model.requestCount--;
    if (model.requestCount === 0) {
      publicAPI.invokeBusy(false);
    }
  }

  function parseLine(line) {
    if (line[0] === '#' || line.length === 0) {
      return;
    }

    const tokens = line
      .split(/[ \t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length);
    if (tokens[0] === 'newmtl') {
      tokens.shift();
      model.currentMaterial = tokens.join(' ').trim();
    } else if (model.currentMaterial) {
      if (tokens.length < 2) {
        return;
      }
      if (!model.materials[model.currentMaterial]) {
        model.materials[model.currentMaterial] = {};
      }
      model.materials[model.currentMaterial][tokens[0]] = tokens.slice(1);
      if (tokens[0] === 'map_Kd') {
        const image = new Image();
        image.src = [model.baseURL, tokens[1]].join('/');
        image.onload = imageReady;
        model.materials[model.currentMaterial].image = image;
        model.requestCount++;
      }
    }
  }

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url) {
    const { compression, progressCallback } = model;
    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    if (url.indexOf('.mtl') === -1 && !option.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.mtl`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData();
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () =>
    new Promise((resolve, reject) => {
      fetchData(model.url).then(
        (content) => {
          publicAPI.parse(content);
          resolve();
        },
        (err) => {
          reject();
        }
      );
    });

  publicAPI.parse = (content) => {
    publicAPI.modified();
    model.materials = {};
    content.split('\n').forEach(parseLine);
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;

  publicAPI.getMaterialNames = () => Object.keys(model.materials);
  publicAPI.getMaterial = (name) => model.materials[name];

  publicAPI.listImages = () =>
    Object.keys(model.materials)
      .map((name) => model.materials[name].map_Kd)
      .filter((fileName) => !!fileName)
      .map((s) => s[0].trim());

  publicAPI.setImageSrc = (imagePath, src) => {
    const selectedName = Object.keys(model.materials).find(
      (name) =>
        model.materials[name].map_Kd &&
        model.materials[name].map_Kd[0].trim() === imagePath.trim()
    );
    const material = model.materials[selectedName];
    if (material && material.image) {
      material.image.src = src;
    }
  };

  publicAPI.applyMaterialToActor = (name, actor) => {
    const material = model.materials[name];
    if (material && actor) {
      const white = [1, 1, 1];
      const actorProp = {
        ambientColor: material.Ka ? material.Ka.map((i) => Number(i)) : white,
        specularColor: material.Ks ? material.Ks.map((i) => Number(i)) : white,
        diffuseColor: material.Kd ? material.Kd.map((i) => Number(i)) : white,
        opacity: material.d ? Number(material.d) : 1,
        specularPower: material.Ns ? Number(material.Ns) : 1,
      };
      const illum = Number(material.illum || 2);
      ['ambient', 'diffuse', 'specular'].forEach((k, idx) => {
        actorProp[k] = idx <= illum ? 1.0 : 0.0;
      });
      if (material.image) {
        const texture = vtkTexture.newInstance({ interpolate: true });
        texture.setImage(material.image);
        actor.addTexture(texture);
      }
      actor.getProperty().set(actorProp);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfOutputs: 1,
  requestCount: 0,
  materials: {},
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper', 'splitGroup']);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkMTLReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMTLReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
