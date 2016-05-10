import * as macro from '../../../macro';
import Prop3D from '../Prop3D';
import Property from '../Property';

import { vec3 } from 'gl-matrix';

export const types = ['Actor'];

const SET_FIELDS = [
  'property',
];

const SET_GET_FIELDS = [
  'backfaceProperty',
  // 'texture', // Actor should have an array of textures
  'mapper',
  'forceOpaque',
  'forceTranslucent',
];

const SET_ARRAY_6 = [
  'bounds',
];

export function actor(publicAPI, model) {
  publicAPI.renderOpaqueGeometry = (viewport) => {
    let renderedSomething = false;

    if (model.mapper === null) {
      return renderedSomething;
    }

    if (model.property === null) {
      // force creation of a property
      publicAPI.setProperty(publicAPI.makeProperty());
    }

    if (
      publicAPI.getIsOpaque() ||
      (viewport.getSelector() && model.property.getOpacity() > 0.0)) {
      model.property.render(publicAPI, viewport);

      // render the backface property
      if (model.backfaceProperty) {
        model.backfaceProperty.backfaceRender(publicAPI, viewport);
      }

      // TODO: If we had an array of textures, we would render them here.
      publicAPI.render(viewport, model.mapper);
      publicAPI.property.postRender(publicAPI, viewport);
      // TODO: If we had an array of textures, we would postRender them here.

      model.estimatedRenderTime += model.mapper.getTimeToDraw();
      renderedSomething = true;
    }

    return renderedSomething;
  };

  publicAPI.renderTranslucentPolygonalGeometry = (viewport) => {
    let renderedSomething = false;

    if (model.mapper === null) {
      return renderedSomething;
    }

    // make sure we have a property
    if (model.property === null) {
      // force creation of a property
      publicAPI.setProperty(publicAPI.makeProperty());
    }

    // is this actor opaque?
    if (!publicAPI.getIsOpaque()) {
      model.property.render(publicAPI, viewport);

      // render the backface property
      if (model.backfaceProperty) {
        model.backfaceProperty.backfaceRender(publicAPI, viewport);
      }

      // TODO: If we had an array of textures, we would render them here.
      publicAPI.render(viewport, model.mapper);
      model.property.postRender(publicAPI, viewport);
      // TODO: If we had an array of textures, we would postRender them here.

      model.estimatedRenderTime += model.mapper.getTimeToDraw();
      renderedSomething = true;
    }

    return renderedSomething;
  };

  publicAPI.hasTranslucentPolygonalGeometry = () => {
    if (model.mapper === null) {
      return false;
    }
    // make sure we have a property
    if (model.property === null) {
      // force creation of a property
      publicAPI.setProperty(publicAPI.makeProperty());
    }

    // is this actor opaque ?
    return !publicAPI.getIsOpaque();
  };

  publicAPI.releaseGraphicsResources = (win) => {
    // pass this information onto the mapper
    if (model.mapper) {
      model.mapper.releaseGraphicsResources(win);
    }

    // TBD: pass this information onto the texture(s)

    // pass this information to the properties
    if (model.property) {
      model.property.releaseGraphicsResources(win);
    }
    if (model.backfaceProperty) {
      model.backfaceProperty.releaseGraphicsResources(win);
    }
  };

  publicAPI.makeProperty = Property.newInstance;

  publicAPI.getProperty = () => {
    if (model.property === null) {
      model.property = publicAPI.makeProperty();
    }
    return model.property;
  };

  publicAPI.getBounds = () => {
    if (model.mapper === null) {
      return model.bounds;
    }

    // Check for the special case when the mapper's bounds are unknown
    const bds = model.mapper.getBounds();
    if (!bds || bds.length !== 6) {
      return bds;
    }

    // Check for the special case when the actor is empty.
    if (bds[0] > bds[1]) {
      model.mapperBounds = bds.map(x => x); // copy the mapper's bounds
      model.bounds = [1, -1, 1, -1, 1, -1];
      ++model.boundsMTime;
      return bds;
    }

    // Check if we have cached values for these bounds - we cache the
    // values returned by model.mapper.getBounds() and we store the time
    // of caching. If the values returned this time are different, or
    // the modified time of this class is newer than the cached time,
    // then we need to rebuild.
    const zip = rows => rows[0].map((_, c) => rows.map(row => row[c]));
    if (
      zip([bds, model.bounds]).reduce((a, b) => (a && b[0] === b[1]), true) ||
      publicAPI.getMTime() > model.boundsMTime) {
      console.log('Recomputing bounds...');
      model.mapperBounds = bds.map(x => x);
      const bbox = [
        vec3.fromValues(bds[1], bds[3], bds[5]),
        vec3.fromValues(bds[1], bds[2], bds[5]),
        vec3.fromValues(bds[0], bds[2], bds[5]),
        vec3.fromValues(bds[0], bds[3], bds[5]),
        vec3.fromValues(bds[1], bds[3], bds[4]),
        vec3.fromValues(bds[1], bds[2], bds[4]),
        vec3.fromValues(bds[0], bds[2], bds[4]),
        vec3.fromValues(bds[0], bds[3], bds[4]),
      ];

      publicAPI.computeMatrix();
      bbox.forEach(pt => vec3.transformMat4(pt, pt, model.matrix));

      model.bounds[0] = model.bounds[2] = model.bounds[4] = Number.MAX_VALUE;
      model.bounds[1] = model.bounds[3] = model.bounds[5] = - Number.MAX_VALUE;
      model.bounds = model.bounds.map((d, i) => ((i % 2 === 0) ?
        bbox.reduce((a, b) => (a > b[i] ? b[i] : a), d) :
        bbox.reduce((a, b) => (a < b[i] ? b[i] : a), d)));
      ++model.boundsMTime;
    }
    return model.bounds;
  };

  publicAPI.getMTime = () => {
    let mt = model.getMTime();
    if (model.property !== null) {
      const time = model.property.getMTime();
      mt = (time > mt ? time : mt);
    }

    if (model.backfaceProperty !== null) {
      const time = model.backfaceProperty.getMTime();
      mt = (time > mt ? time : mt);
    }

    // TBD: Handle array of textures here.

    return mt;
  };

  publicAPI.getRedrawMTime = () => {
    let mt = model.getMTime();
    if (model.mapper !== null) {
      let time = model.mapper.getMTime();
      mt = (time > mt ? time : mt);
      if (model.mapper.getInput() !== null) {
        model.mapper.getInputAlgorithm().update();
        time = model.mapper.getInput().getMTime();
        mt = (time > mt ? time : mt);
      }
    }
    return mt;
  };
}

export const DEFAULT_VALUES = {
  bounds: [1, -1, 1, -1, 1, -1],
  backfaceProperty: null,
  mapper: null,
  property: null,
  // texture: null, // TODO: Handle array of textures
  forceOpaque: false,
  forceTranslucent: false,
};

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Inheritance
  Prop3D.extend(publicAPI, model);

  // Build VTK API
  macro.set(publicAPI, model, SET_FIELDS);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.getArray(publicAPI, model, SET_ARRAY_6, 6);

  // Object methods
  actor(publicAPI, model);
}

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkActor');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

export default { newInstance, extend };
