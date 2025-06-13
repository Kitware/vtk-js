/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import macro from 'vtk.js/Sources/macros';

import {
  ALPHA_MODE,
  BYTES,
  COMPONENTS,
  DEFAULT_SAMPLER,
  GL_SAMPLER,
  MODES,
  SEMANTIC_ATTRIBUTE_MAP,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

import {
  getAccessorArrayTypeAndLength,
  getGLEnumFromSamplerParameter,
  resolveUrl,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Utils';

const { vtkDebugMacro, vtkWarningMacro } = macro;

class GLTFParser {
  constructor(glTF, options = {}) {
    const { json, baseUri = '' } = glTF;

    this.glTF = glTF;
    this.options = options;
    this.baseUri = baseUri;
    this.json = json;
    this.extensions = json.extensions || {};
    this.extensionsUsed = json.extensionsUsed || [];
  }

  async parse() {
    const buffers = this.json.buffers || [];
    this.buffers = new Array(buffers.length).fill(null);

    const images = this.json.images || [];
    this.images = new Array(images.length).fill({});
    await this.loadBuffers();
    await this.loadImages();
    this.resolveTree();

    return this.glTF.json;
  }

  resolveTree() {
    this.json.scenes = this.json.scenes?.map((scene, idx) =>
      this.resolveScene(scene, idx)
    );

    this.json.cameras = this.json.cameras?.map((camera, idx) =>
      this.resolveCamera(camera, idx)
    );

    this.json.bufferViews = this.json.bufferViews?.map((bufView, idx) =>
      this.resolveBufferView(bufView, idx)
    );

    this.json.images = this.json.images?.map((image, idx) =>
      this.resolveImage(image, idx)
    );

    this.json.samplers = this.json.samplers?.map((sampler, idx) =>
      this.resolveSampler(sampler, idx)
    );

    this.json.textures = this.json.textures?.map((texture, idx) =>
      this.resolveTexture(texture, idx)
    );

    this.json.accessors = this.json.accessors?.map((accessor, idx) =>
      this.resolveAccessor(accessor, idx)
    );

    this.json.materials = this.json.materials?.map((material, idx) =>
      this.resolveMaterial(material, idx)
    );

    this.json.meshes = this.json.meshes?.map((mesh, idx) =>
      this.resolveMesh(mesh, idx)
    );

    this.json.nodes = this.json.nodes?.map((node, idx) =>
      this.resolveNode(node, idx)
    );

    this.json.skins = this.json.skins?.map((skin, idx) =>
      this.resolveSkin(skin, idx)
    );

    this.json.animations = this.json.animations?.map((animation, idx) =>
      this.resolveAnimation(animation, idx)
    );
  }

  get(array, index) {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = this.json[array] && this.json[array][index];
    if (!object) {
      vtkWarningMacro(`glTF file error: Could not find ${array}[${index}]`);
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
      node.camera = this.get('cameras', node.camera);
    }
    if (node.skin !== undefined) {
      node.skin = this.get('skins', node.skin);
    }

    // Fill punctual lights objects
    if (node.extensions?.KHR_lights_punctual) {
      node.extensions.KHR_lights_punctual.light =
        this.extensions?.KHR_lights_punctual.lights[
          node.extensions.KHR_lights_punctual.light
        ];
    }
    return node;
  }

  resolveSkin(skin, index) {
    skin.id = skin.id || `skin-${index}`;
    skin.inverseBindMatrices = this.get('accessors', skin.inverseBindMatrices);
    return skin;
  }

  resolveMesh(mesh, index) {
    mesh.id = mesh.id || `mesh-${index}`;
    if (mesh.primitives) {
      mesh.primitives = mesh.primitives.map((primitive, idx) => {
        const attributes = primitive.attributes;
        primitive.name = `primitive-${idx}`;
        primitive.attributes = {};
        for (const attribute in attributes) {
          const attr = SEMANTIC_ATTRIBUTE_MAP[attribute];
          primitive.attributes[attr] = this.get(
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
        if (primitive.mode === undefined) {
          primitive.mode = MODES.GL_TRIANGLES; // Default one
        }

        if (primitive.extensions?.KHR_draco_mesh_compression) {
          vtkDebugMacro('Using Draco mesh compression');
          const bufferView = this.get(
            'bufferViews',
            primitive.extensions.KHR_draco_mesh_compression.bufferView
          );
          primitive.extensions.KHR_draco_mesh_compression.bufferView =
            bufferView.data;
        }

        return primitive;
      });
    }
    return mesh;
  }

  resolveMaterial(material, index) {
    material.id = material.id || `material-${index}`;

    if (material.alphaMode === undefined)
      material.alphaMode = ALPHA_MODE.OPAQUE;
    if (material.doubleSided === undefined) material.doubleSided = false;
    if (material.alphaCutoff === undefined) material.alphaCutoff = 0.5;

    if (material.normalTexture) {
      material.normalTexture = { ...material.normalTexture };
      material.normalTexture.texture = this.get(
        'textures',
        material.normalTexture.index
      );
    }
    if (material.occlusionTexture) {
      material.occlusionTexture = { ...material.occlusionTexture };
      material.occlusionTexture.texture = this.get(
        'textures',
        material.occlusionTexture.index
      );
    }
    if (material.emissiveTexture) {
      material.emissiveTexture = { ...material.emissiveTexture };
      material.emissiveTexture.texture = this.get(
        'textures',
        material.emissiveTexture.index
      );
    }
    if (!material.emissiveFactor) {
      material.emissiveFactor = material.emissiveTexture ? 1 : 0;
    } else material.emissiveFactor = material.emissiveFactor[0];

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
    } else {
      material.pbrMetallicRoughness = {
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 1.0,
        roughnessFactor: 1.0,
      };
    }
    return material;
  }

  /**
   * Take values of particular accessor from interleaved buffer various parts of
   * the buffer
   */
  getValueFromInterleavedBuffer(
    buffer,
    byteOffset,
    byteStride,
    bytesPerElement,
    count
  ) {
    const result = new Uint8Array(count * bytesPerElement);
    for (let i = 0; i < count; i++) {
      const elementOffset = byteOffset + i * byteStride;
      result.set(
        new Uint8Array(
          buffer.arrayBuffer.slice(
            elementOffset,
            elementOffset + bytesPerElement
          )
        ),
        i * bytesPerElement
      );
    }
    return result.buffer;
  }

  resolveAccessor(accessor, index) {
    accessor.id = accessor.id || `accessor-${index}`;
    if (accessor.bufferView !== undefined) {
      // Draco encoded meshes don't have bufferView
      accessor.bufferView = this.get('bufferViews', accessor.bufferView);
    }

    // Look up enums
    accessor.bytesPerComponent = BYTES[accessor.componentType];
    accessor.components = COMPONENTS[accessor.type];
    accessor.bytesPerElement = accessor.bytesPerComponent * accessor.components;

    // Create TypedArray for the accessor
    // Note: The canonical way to instantiate is to ignore this array and create
    // WebGLBuffer's using the bufferViews.
    if (accessor.bufferView) {
      const buffer = accessor.bufferView.buffer;
      const { ArrayType } = getAccessorArrayTypeAndLength(
        accessor,
        accessor.bufferView
      );
      const baseByteOffset =
        (accessor.bufferView.byteOffset || 0) + buffer.byteOffset;
      const byteOffset = baseByteOffset + (accessor.byteOffset || 0);

      let arrayBufferView;
      if (accessor.bufferView.byteStride) {
        // Only extract if stride is not equal to element size
        if (accessor.bufferView.byteStride === accessor.bytesPerElement) {
          arrayBufferView = new ArrayType(
            buffer.arrayBuffer,
            byteOffset,
            accessor.count * accessor.components
          );
        } else {
          // Interleaved buffer, extract only needed bytes
          const interleavedBuffer = this.getValueFromInterleavedBuffer(
            buffer,
            byteOffset,
            accessor.bufferView.byteStride,
            accessor.bytesPerElement,
            accessor.count
          );
          arrayBufferView = new ArrayType(interleavedBuffer);
        }
      } else {
        arrayBufferView = new ArrayType(
          buffer.arrayBuffer,
          byteOffset,
          accessor.count * accessor.components
        );
      }
      accessor.value = arrayBufferView;
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

    // Handle texture extensions sources
    if (texture.extensions !== undefined) {
      const extensionsNames = Object.keys(texture.extensions);
      extensionsNames.forEach((extensionName) => {
        const extension = texture.extensions[extensionName];
        switch (extensionName) {
          case 'KHR_texture_basisu':
          case 'EXT_texture_webp':
          case 'EXT_texture_avif':
            texture.source = this.get('images', extension.source);
            break;
          default:
            vtkWarningMacro(`Unhandled extension: ${extensionName}`);
        }
      });
    }
    return texture;
  }

  resolveSampler(sampler, index) {
    sampler.id = sampler.id || `sampler-${index}`;

    if (!Object.hasOwn(sampler, 'wrapS')) sampler.wrapS = GL_SAMPLER.REPEAT;
    if (!Object.hasOwn(sampler, 'wrapT')) sampler.wrapT = GL_SAMPLER.REPEAT;

    if (!Object.hasOwn(sampler, 'minFilter'))
      sampler.minFilter = GL_SAMPLER.LINEAR_MIPMAP_LINEAR;
    if (!Object.hasOwn(sampler, 'magFilter'))
      sampler.magFilter = GL_SAMPLER.NEAREST;

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
    return camera;
  }

  resolveAnimation(animation, index) {
    animation.id = animation.id || `animation-${index}`;
    animation.samplers.map((sampler) => {
      sampler.input = this.get('accessors', sampler.input).value;
      sampler.output = this.get('accessors', sampler.output).value;
      return sampler;
    });
    return animation;
  }

  loadBuffers() {
    const promises = this.json.buffers.map((buffer, idx) =>
      this.loadBuffer(buffer, idx).then(() => {
        delete buffer.uri;
      })
    );
    return Promise.all(promises);
  }

  async loadBuffer(buffer, index) {
    let arrayBuffer = buffer;

    if (buffer.uri) {
      vtkDebugMacro('Loading uri', buffer.uri);
      const uri = resolveUrl(buffer.uri, this.options.baseUri);
      const response = await fetch(uri);
      arrayBuffer = await response.arrayBuffer();
    } else if (this.glTF.glbBuffers) {
      arrayBuffer = this.glTF.glbBuffers[index];
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
              vtkDebugMacro('Texture loaded ', images[i]);
            })
          )
        );
      }

      Promise.all(promises).then(() => resolve(this.images));
    });
  }

  async loadImage(image, index) {
    let arrayBuffer;
    let buffer;

    if (image.uri) {
      vtkDebugMacro('Loading texture', image.uri);
      const uri = resolveUrl(image.uri, this.options.baseUri);
      const response = await fetch(uri);

      arrayBuffer = await response.arrayBuffer();
      image.uri = uri;
      image.bufferView = {
        data: arrayBuffer,
      };
    } else if (image.bufferView) {
      const bufferView = this.get('bufferViews', image.bufferView);
      buffer = this.get('buffers', bufferView.buffer);

      // GLB buffer
      if (this.glTF.glbBuffers) {
        buffer = this.glTF.glbBuffers[bufferView.buffer];
        arrayBuffer = buffer.slice(
          bufferView.byteOffset,
          bufferView.byteOffset + bufferView.byteLength
        );
      }

      image.bufferView = {
        data: arrayBuffer,
      };
    }
  }
}

export default GLTFParser;
