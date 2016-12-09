import * as macro from '../../../macro';
import { VTK_SHADING_MODEL, VTK_REPRESENTATION, VTK_INTERPOLATION } from './Constants';

function notImplemented(method) {
  return () => console.log(`vtkProperty::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkProperty methods
// ----------------------------------------------------------------------------

function vtkProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProperty');

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

  publicAPI.computeCompositeColor = notImplemented('ComputeCompositeColor');
  publicAPI.getColor = () => {
    // Inline computeCompositeColor
    let norm = 0.0;
    if ((model.ambient + model.diffuse + model.specular) > 0) {
      norm = 1.0 / (model.ambient + model.diffuse + model.specular);
    }

    for (let i = 0; i < 3; i++) {
      model.color[i] = norm * (
        (model.ambient * model.ambientColor[i]) +
        (model.diffuse * model.diffuseColor[i]) +
        (model.specular * model.specularColor[i]));
    }

    return [].concat(model.color);
  };

  publicAPI.addShaderVariable = notImplemented('AddShaderVariable');

  publicAPI.setInterpolationToFlat = () => publicAPI.setInterpolation(VTK_INTERPOLATION.FLAT);
  publicAPI.setInterpolationToGouraud = () => publicAPI.setInterpolation(VTK_INTERPOLATION.GOURAUD);
  publicAPI.setInterpolationToPhong = () => publicAPI.setInterpolation(VTK_INTERPOLATION.PHONG);

  publicAPI.getInterpolationAsString = () => VTK_SHADING_MODEL[model.interpolation];

  publicAPI.setRepresentationToWireframe = () => publicAPI.setRepresentation(VTK_REPRESENTATION.WIREFRAME);
  publicAPI.setRepresentationToSurface = () => publicAPI.setRepresentation(VTK_REPRESENTATION.SURFACE);
  publicAPI.setRepresentationToPoints = () => publicAPI.setRepresentation(VTK_REPRESENTATION.POINTS);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  color: [1, 1, 1],
  ambientColor: [1, 1, 1],
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  edgeColor: [0, 0, 0],

  ambient: 0,
  diffuse: 1,
  specular: 0,
  specularPower: 1,
  opacity: 1,
  interpolation: VTK_INTERPOLATION.GOURAUD,
  representation: VTK_REPRESENTATION.SURFACE,
  edgeVisibility: false,
  backfaceCulling: false,
  frontfaceCulling: false,
  pointSize: 1,
  lineWidth: 1,
  lighting: true,

  shading: false,
  materialName: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

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
    'pointSize',
    'backfaceCulling',
    'frontfaceCulling',
    'representation',
  ]);
  macro.setGetArray(publicAPI, model, [
    'ambientColor',
    'specularColor',
    'diffuseColor',
    'edgeColor',
  ], 3);

  // Object methods
  vtkProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
