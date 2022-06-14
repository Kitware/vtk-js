/* eslint-disable no-debugger */
/* eslint-disable class-methods-use-this */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
// import { vec3, vec4, quat, mat4 } from 'gl-matrix';

import { DEFAULT_SAMPLER } from './Contants';

import {
  getAccessorArrayTypeAndLength,
  getSizeFromAccessorType,
  getBytesFromComponentType,
  getGLEnumFromSamplerParameter,
  resolveUrl,
} from './Utils';

class GLTFParser {
  constructor(gltf, options = {}) {
    const { json, buffers = [], images = [], baseUri = '' } = gltf;
    this.gltf = gltf;
    this.options = options;
    this.baseUri = baseUri;
    this.json = json;
    this.buffers = buffers;
    this.images = images;
  }

  parse() {
    this.resolveTree();
    return this.json;
  }

  resolveTree() {
    if (this.json.bufferViews) {
      this.json.bufferViews = this.json.bufferViews.map((bufView, idx) =>
        this.resolveBufferView(bufView, idx)
      );
    }
    if (this.json.images) {
      this.json.images = this.json.images.map((image, idx) =>
        this.resolveImage(image, idx)
      );
    }
    if (this.json.samplers) {
      this.json.samplers = this.json.samplers.map((sampler, idx) =>
        this.resolveSampler(sampler, idx)
      );
    }
    if (this.json.textures) {
      this.json.textures = this.json.textures.map((texture, idx) =>
        this.resolveTexture(texture, idx)
      );
    }
    if (this.json.accessors) {
      this.json.accessors = this.json.accessors.map((accessor, idx) =>
        this.resolveAccessor(accessor, idx)
      );
    }
    if (this.json.materials) {
      this.json.materials = this.json.materials.map((material, idx) =>
        this.resolveMaterial(material, idx)
      );
    }
    if (this.json.meshes) {
      this.json.meshes = this.json.meshes.map((mesh, idx) =>
        this.resolveMesh(mesh, idx)
      );
    }
    if (this.json.nodes) {
      this.json.nodes = this.json.nodes.map((node, idx) =>
        this.resolveNode(node, idx)
      );
    }
    if (this.json.skins) {
      this.json.skins = this.json.skins.map((skin, idx) =>
        this.resolveSkin(skin, idx)
      );
    }
    if (this.json.scenes) {
      this.json.scenes = this.json.scenes.map((scene, idx) =>
        this.resolveScene(scene, idx)
      );
    }
    if (this.json.scene !== undefined) {
      this.json.scene = this.json.scenes[this.json.scene];
    }
  }

  get(array, index) {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = this.json[array] && this.json[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  resolveScene(scene, index) {
    scene.id = scene.id || `scene-${index}`;
    scene.nodes = (scene.nodes || []).map((node) => this.get('nodes', node));
    return scene;
  }

  resolveNode(node, index) {
    node.id = node.id || `node-${index}`;
    if (node.children) {
      node.children = node.children.map((child) => this.get('nodes', child));
    }
    if (node.mesh !== undefined) {
      node.mesh = this.get('meshes', node.mesh);
    } else if (node.meshes !== undefined && node.meshes.length) {
      node.mesh = node.meshes.reduce(
        (accum, meshIndex) => {
          const mesh = this.get('meshes', meshIndex);
          accum.id = mesh.id;
          accum.primitives = accum.primitives.concat(mesh.primitives);
          return accum;
        },
        { primitives: [] }
      );
    }
    if (node.camera !== undefined) {
      node.camera = this.get('camera', node.camera);
    }
    if (node.skin !== undefined) {
      node.skin = this.get('skins', node.skin);
    }
    return node;
  }

  resolveSkin(skin, index) {
    // skin = {...skin};
    skin.id = skin.id || `skin-${index}`;
    skin.inverseBindMatrices = this.get('accessors', skin.inverseBindMatrices);
    return skin;
  }

  resolveMesh(mesh, index) {
    mesh.id = mesh.id || `mesh-${index}`;
    if (mesh.primitives) {
      mesh.primitives = mesh.primitives.map((primitive) => {
        const attributes = primitive.attributes;
        primitive.attributes = {};
        for (const attribute in attributes) {
          primitive.attributes[attribute.toLowerCase()] = this.get(
            'accessors',
            attributes[attribute]
          );
        }
        if (primitive.indices !== undefined) {
          primitive.indices = this.get('accessors', primitive.indices);
        }
        if (primitive.material !== undefined) {
          primitive.material = this.get('materials', primitive.material);
        }
        return primitive;
      });
    }
    return mesh;
  }

  resolveMaterial(material, index) {
    material.id = material.id || `material-${index}`;
    if (material.normalTexture) {
      material.normalTexture = { ...material.normalTexture };
      material.normalTexture.texture = this.get(
        'textures',
        material.normalTexture.index
      );
    }
    if (material.occlusionTexture) {
      material.occlustionTexture = { ...material.occlustionTexture };
      material.occlusionTexture.texture = this.get(
        'textures',
        material.occlusionTexture.index
      );
    }
    if (material.emissiveTexture) {
      material.emmisiveTexture = { ...material.emmisiveTexture };
      material.emissiveTexture.texture = this.get(
        'textures',
        material.emissiveTexture.index
      );
    }
    if (!material.emissiveFactor) {
      material.emissiveFactor = material.emmisiveTexture
        ? [1, 1, 1]
        : [0, 0, 0];
    }

    if (material.pbrMetallicRoughness) {
      material.pbrMetallicRoughness = { ...material.pbrMetallicRoughness };
      const mr = material.pbrMetallicRoughness;
      if (mr.baseColorTexture) {
        mr.baseColorTexture = { ...mr.baseColorTexture };
        mr.baseColorTexture.texture = this.get(
          'textures',
          mr.baseColorTexture.index
        );
      }
      if (mr.metallicRoughnessTexture) {
        mr.metallicRoughnessTexture = { ...mr.metallicRoughnessTexture };
        mr.metallicRoughnessTexture.texture = this.get(
          'textures',
          mr.metallicRoughnessTexture.index
        );
      }
    }
    return material;
  }

  resolveAccessor(accessor, index) {
    accessor.id = accessor.id || `accessor-${index}`;
    if (accessor.bufferView !== undefined) {
      // Draco encoded meshes don't have bufferView
      accessor.bufferView = this.get('bufferViews', accessor.bufferView);
    }

    // Look up enums
    accessor.bytesPerComponent = getBytesFromComponentType(
      accessor.componentType
    );
    accessor.components = getSizeFromAccessorType(accessor.type);
    accessor.bytesPerElement = accessor.bytesPerComponent * accessor.components;

    // Create TypedArray for the accessor
    // Note: The canonical way to instantiate is to ignore this array and create
    // WebGLBuffer's using the bufferViews.
    if (accessor.bufferView) {
      const buffer = accessor.bufferView.buffer;
      const { ArrayType, byteLength } = getAccessorArrayTypeAndLength(
        accessor,
        accessor.bufferView
      );
      const byteOffset =
        (accessor.bufferView.byteOffset || 0) +
        (accessor.byteOffset || 0) +
        buffer.byteOffset;

      const cutBufffer = buffer.arrayBuffer.slice(
        byteOffset,
        byteOffset + byteLength
      );
      accessor.value = new ArrayType(cutBufffer);
    }

    return accessor;
  }

  resolveTexture(texture, index) {
    texture.id = texture.id || `texture-${index}`;
    texture.sampler =
      'sampler' in texture
        ? this.get('samplers', texture.sampler)
        : DEFAULT_SAMPLER;
    texture.source = this.get('images', texture.source);
    return texture;
  }

  resolveSampler(sampler, index) {
    sampler.id = sampler.id || `sampler-${index}`;
    // Map textual parameters to GL parameter values
    sampler.parameters = {};
    for (const key in sampler) {
      const glEnum = getGLEnumFromSamplerParameter(key);
      if (glEnum !== undefined) {
        sampler.parameters[glEnum] = sampler[key];
      }
    }
    return sampler;
  }

  resolveImage(image, index) {
    image.id = image.id || `image-${index}`;
    if (image.bufferView !== undefined) {
      image.bufferView = this.get('bufferViews', image.bufferView);
    }

    // Check if image has been preloaded before
    // If so, link it into the JSON and drop the URI
    const preloadedImage = this.images[index];
    if (preloadedImage) {
      image.image = preloadedImage;
    }

    return image;
  }

  resolveBufferView(bufferView, index) {
    bufferView.id = bufferView.id || `bufferView-${index}`;
    const bufferIndex = bufferView.buffer;
    bufferView.buffer = this.buffers[bufferIndex];

    const arrayBuffer = this.buffers[bufferIndex].arrayBuffer;
    let byteOffset = this.buffers[bufferIndex].byteOffset || 0;

    if ('byteOffset' in bufferView) {
      byteOffset += bufferView.byteOffset;
    }

    bufferView.data = new Uint8Array(
      arrayBuffer,
      byteOffset,
      bufferView.byteLength
    );
    return bufferView;
  }

  resolveCamera(camera, index) {
    camera.id = camera.id || `camera-${index}`;
    // TODO: create 4x4 matrices
    if (camera.perspective) {
      // TODO: create perspective matrix using camera.perspective
    }
    if (camera.orthographic) {
      // TODO: create orthographic matrix using camera.orthographic
    }
    return camera;
  }

  loadBuffers() {
    const promises = [];
    return new Promise((resolve, reject) => {
      this.json.buffers.forEach((buffer, idx) => {
        promises.push(
          Promise.resolve(
            this.loadBuffer(buffer, idx).then(() => {
              console.log('Buffer loaded');
              delete buffer.uri;
            })
          )
        );
      });

      Promise.all(promises).then(() => resolve(this.buffers));
    });
  }

  async loadBuffer(buffer, index) {
    let arrayBuffer;
    if (buffer.uri) {
      const uri = resolveUrl(buffer.uri, this.options.baseUri);
      const response = await fetch(uri);
      arrayBuffer = await response.arrayBuffer();
    }

    this.buffers[index] = {
      arrayBuffer,
      byteOffset: 0,
      byteLength: arrayBuffer.byteLength,
    };
  }

  loadImages() {
    const images = this.json.images || [];
    const promises = [];

    return new Promise((resolve, reject) => {
      for (let i = 0; i < images.length; ++i) {
        promises.push(
          Promise.resolve(
            this.loadImage(images[i], i).then(() => {
              console.log('Image loaded ', images[i]);
            })
          )
        );
      }

      // eslint-disable-next-line no-promise-executor-return
      return Promise.all(promises).then(() => resolve(this.images));
    });
  }

  async loadImage(image, index) {
    // let arrayBuffer;
    if (image.uri) {
      image.uri = resolveUrl(image.uri, this.options.baseUri);
      // const response = await fetch(uri);
      // arrayBuffer = await response.arrayBuffer();
    }

    // this.images[index] = arrayBuffer;
  }

  /*
  loadImages() {
    const images = this.json.images || [];
    const promises = [];

    return new Promise((resolve, reject) => {
      for (let i = 0; i < images.length; ++i) {
        promises.push(
          Promise.resolve(
            this.loadImage(images[i], i).then(() => {
              console.log('Image loaded ', images[i]);
            })
          )
        );
      }

      return Promise.all(promises).then(() => resolve(this.images));
    });
  }
  */
}

export default GLTFParser;
