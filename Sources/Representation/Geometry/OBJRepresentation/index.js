import * as macro        from '../../../macro';
import vtkRepresentation from '../../../Rendering/Core/Representation';
import vtkActor          from '../../../Rendering/Core/Actor';
import vtkMapper         from '../../../Rendering/Core/Mapper';
import vtkTexture        from '../../../Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// vtkOBJRepresentation methods
// ----------------------------------------------------------------------------

export function vtkOBJRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOBJRepresentation');

  publicAPI.setOBJReader = publicAPI.setInput;
  publicAPI.getOBJReader = publicAPI.getInput;

  publicAPI.update = () => {
    if (model.lastExecutionTime === model.mtime) {
      return new Promise((resolve, reject) => resolve());
    }

    if (!model.input) {
      return new Promise((resolve, reject) => reject('Missing input'));
    }

    // Can only apply material texture on multi output
    if (model.input && model.materialsReader) {
      model.input.setSplitMode('usemtl');
    }

    // Prevent useless reexecution
    model.lastExecutionTime = model.mtime;

    return new Promise((resolve, reject) => {
      model.scene = [];

      let hasTextures = false;
      let textureCount = 0;
      let actorCount = model.input.getNumberOfOutputPorts();
      const actors = {};
      const textures = {};
      const actorProps = {};
      if (model.materialsReader) {
        model.materialsReader.getMaterialNames().forEach((name) => {
          const material = model.materialsReader.getMaterial(name);
          const actorProp = {
            ambientColor: material.Ka.map(i => Number(i)),
            specularColor: material.Ks.map(i => Number(i)),
            diffuseColor: material.Kd.map(i => Number(i)),
            opacity: Number(material.d),
            specularPower: Number(material.Ns),
          };
          const illum = Number(material.illum || 2);
          ['ambient', 'diffuse', 'specular'].forEach((k, idx) => {
            actorProp[k] = (idx <= illum) ? 1.0 : 0.0;
          });

          if (material.image) {
            hasTextures = true;
            textureCount++;
            const onLoad = () => {
              console.log('image ready callback', name);
              const texture = vtkTexture.newInstance({ interpolate: true });
              textures[name] = texture;
              texture.setImage(material.image);
              texture.modified();
              if (actors[name]) {
                actors[name].addTexture(texture);
                textureCount--;
                if (textureCount === 0) {
                  resolve();
                }
              } else {
                console.log('got texture but no actor', name);
              }
            };
            if (material.image.complete) {
              console.log('image is already ready', name);
              onLoad();
            } else {
              console.log('add listener for image', name);
              material.image.onload = onLoad;
            }
          }

          if (actors[name]) {
            actorCount--;
            actors[name].getProperty().set(actorProp);
            console.log('(material) update actor');
            if (actorCount === 0 && !hasTextures) {
              resolve();
            } else {
              console.log('(material) no resolve because actorCount:', actorCount, 'hasTextures:', hasTextures, 'name', name);
            }
          } else {
            console.log('(material) got actor props but no actor', name);
            actorProps[name] = actorProp;
          }
        });
      }

      const numberOfPieces = model.input.getNumberOfOutputPorts();
      for (let pieceIndex = 0; pieceIndex < numberOfPieces; pieceIndex++) {
        const source = model.input.getOutputData(pieceIndex);
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();
        const name = source.get('name').name;

        actors[name] = actor;
        actor.setMapper(mapper);
        mapper.setInputData(source);
        model.scene.push({ source, mapper, actor, name });
        publicAPI.addActor(actor);

        if (name && actorProps[name]) {
          actorCount--;
          actor.getProperty().set(actorProps[name]);
          if (actorCount === 0 && !hasTextures) {
            resolve();
          } else {
            console.log('(geo) no resolve because actorCount:', actorCount, 'hasTextures', hasTextures, 'name:', name);
          }
        } else {
          console.log('(geo) no actor props for', name);
        }

        if (name && textures[name]) {
          actor.addTexture(textures[name]);
          textureCount--;
          if (textureCount === 0) {
            resolve();
          } else {
            console.log('(geo) no resolve because texture count', textureCount, 'name:', name);
          }
        }
      }
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lastExecutionTime: 0,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkRepresentation.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'materialsReader',
  ]);
  macro.get(publicAPI, model, [
    'scene',
  ]);

  // Object methods
  vtkOBJRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBJRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
