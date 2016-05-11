import * as macro from '../../../macro';
import { SHADING_MODEL } from './Constants';

// ----------------------------------------------------------------------------
// vtkProperty methods
// ----------------------------------------------------------------------------

function property(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProperty');

  publicAPI.setInterpolationToFlat = () => publicAPI.setInterpolation(0);
  publicAPI.setInterpolationToGouraud = () => publicAPI.setInterpolation(1);
  publicAPI.setInterpolationToPhong = () => publicAPI.setInterpolation(2);

  publicAPI.getInterpolationAsString = () => SHADING_MODEL[model.interpolation];

  publicAPI.setColor = (r, g, b) => {
    if (model.color[0] !== r || model.color[1] !== g || model.color[2] !== b) {
      model.color[0] = r;
      model.color[1] = g;
      model.color[2] = b;
      publicAPI.modified();
    }

    publicAPI.setDiffuseColor(model.color);
    publicAPI.setAmbientColor(model.color);
    publicAPI.setSpecularColor(model.color);
  };

  publicAPI.getColor = () => {
    let norm = 0.0;
    if ((model.ambient + model.diffuse + model.specular) > 0) {
      norm = 1.0 / (model.ambient + model.diffuse + model.specular);
    }

    for (let i = 0; i < 3; i ++) {
      model.color[i] = norm * (
        model.ambient * model.ambientColor[i] +
        model.diffuse * model.diffuseColor[i] +
        model.specular * model.specularColor[i]);
    }

    return [].concat(model.color);
  };

  publicAPI.setLineStipplePattern = (b0, b1) => {
    model.lineStipplePattern[0] = b0;
    model.lineStipplePattern[1] = b1;
    publicAPI.modified();
  };

  // NoOp here
  publicAPI.releaseGraphicsResources = () => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lighting: true,
  interpolation: 0,
  color: [1, 1, 1],
  ambientColor: [1, 1, 1],
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  ambient: 0,
  diffuse: 1,
  specular: 0,
  specularPower: 1,
  opacity: 1,
  edgeVisibility: false,
  edgeColor: [0, 0, 0],
  lineWidth: 1,
  lineStippleRepeatFactor: 1,
  pointSize: 1,
  backfaceCulling: false,
  frontfaceCulling: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects
  model.lineStipplePattern = new Uint8Array(2);
  model.lineStipplePattern[0] = 255;
  model.lineStipplePattern[1] = 255;

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'lineStipplePattern',
  ]);
  macro.setGet(publicAPI, model, [
    'lighting',
    'interpolation',
    'ambient',
    'diffuse',
    'specular',
    'specularPower',
    'opacity',
    'edgeVisibility',
    'lineWidth',
    'lineStipplePattern',
    'lineStippleRepeatFactor',
    'pointSize',
    'backfaceCulling',
    'frontfaceCulling',
  ]);
  macro.setGetArray(publicAPI, model, [
    'ambientColor',
    'specularColor',
    'diffuseColor',
    'edgeColor',
  ], 3);

  // Object methods
  property(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
