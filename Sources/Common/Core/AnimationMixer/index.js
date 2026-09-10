import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkAnimationCue from 'vtk.js/Sources/Common/Core/AnimationCue';
import vtkAnimationScene from 'vtk.js/Sources/Common/Core/AnimationScene';
import { mat4, quat, vec3 } from 'gl-matrix';

// WeakMap to associate skinning data with actors without modifying frozen objects
const actorSkinningMap = new WeakMap();

const NODE_ANIMATION_BINDING = 'node';
const POINTER_ANIMATION_BINDING = 'pointer';

/**
 * Get skinning data for an actor (used by WebGPU CellArrayMapper)
 * @param {vtkActor} actor
 * @return {{ jointMatrices: Float32Array, jointCount: number } | null}
 */
export function getSkinningData(actor) {
  return actorSkinningMap.get(actor) || null;
}

// ---------------------------------------------------------------------------
// vtkAnimationMixer methods
// ---------------------------------------------------------------------------

function vtkAnimationMixer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationMixer');

  /**
   * Take the current clip out of every scene and drop the playback state.
   * @return {boolean} true when there was something to stop
   */
  function stopPlayback() {
    const wasActive = !!model.currentCue || !!model.currentClipName;

    model.scenes.forEach((scene) => {
      scene.stop();
      if (model.currentCue) {
        scene.removeCue(model.currentCue);
      }
    });

    if (model.currentCue) {
      model.currentCue.stop();
      model.currentCue = null;
    }

    model.currentClipName = null;
    model.currentClip = null;
    return wasActive;
  }

  /**
   * Add an animation scene to manage
   * @param {vtkAnimationScene} scene
   * @return {boolean} true when the scene was added
   */
  publicAPI.addScene = (scene) => {
    if (model.scenes.includes(scene)) {
      return false;
    }
    model.scenes.push(scene);
    publicAPI.modified();
    return true;
  };

  /**
   * Remove an animation scene
   * @param {vtkAnimationScene} scene
   * @return {boolean} true when the scene was removed
   */
  publicAPI.removeScene = (scene) => {
    const idx = model.scenes.indexOf(scene);
    if (idx === -1) {
      return false;
    }
    model.scenes.splice(idx, 1);
    publicAPI.modified();
    return true;
  };

  /**
   * Add an animation clip
   * @param {vtkAnimationClip} clip
   * @return {boolean} true when the clip was added
   */
  publicAPI.addClip = (clip) => {
    const name = clip.getName();
    if (!name || model.clips.has(name)) {
      return false;
    }
    model.clips.set(name, clip);
    publicAPI.modified();
    return true;
  };

  /**
   * Remove a clip by name. A clip that plays stops first.
   * @param {string} name
   * @return {boolean} true when the clip was removed
   */
  publicAPI.removeClip = (name) => {
    if (!model.clips.has(name)) {
      return false;
    }
    // the clip has to stop while the mixer still holds it
    if (model.currentClipName === name) {
      stopPlayback();
    }
    model.clips.delete(name);
    publicAPI.modified();
    return true;
  };

  /**
   * Get a clip by name
   * @param {string} name
   * @return {vtkAnimationClip}
   */
  publicAPI.getClip = (name) => model.clips.get(name) || null;

  /**
   * Get all clip names
   * @return {string[]}
   */
  publicAPI.getClipNames = () => Array.from(model.clips.keys());

  /**
   * Get the number of clips
   * @return {number}
   */
  publicAPI.getNumberOfClips = () => model.clips.size;

  /**
   * Play a clip by name. Does nothing while that same clip plays, so a caller
   * that wants to hear it again from the start calls stop() first.
   * @param {string} clipName
   * @param {Object} [options]
   * @param {boolean} [options.loop=true] Whether to loop the animation
   * @return {boolean} true when playback started
   */
  publicAPI.playClip = (clipName, options = {}) => {
    const clip = model.clips.get(clipName);
    if (!clip) {
      console.error(`vtkAnimationMixer: Clip "${clipName}" not found`);
      return false;
    }

    if (clipName === model.currentClipName && publicAPI.isPlaying()) {
      return false;
    }

    // Stop current playback
    if (model.currentCue) {
      model.currentCue.stop();
    }

    // Create and configure animation cue
    const cue = vtkAnimationCue.newInstance({
      startTime: 0,
      endTime: clip.getDuration(),
    });

    // Wire tick to evaluate pose on armature
    cue.onTickEvent(() => {
      if (model.skeleton) {
        model.skeleton.evaluatePose(model.currentClip, cue.getAnimationTime());
      }
    });

    cue.onEndCueEvent(() => {
      publicAPI.invokeAnimationEnd({ name: clipName, clip });
    });

    model.currentClipName = clipName;
    model.currentClip = clip;
    model.currentCue = cue;

    const loop = options.loop !== false;

    // Auto-create a default scene if none registered (convenience)
    if (model.scenes.length === 0) {
      publicAPI.addScene(vtkAnimationScene.newInstance());
    }

    // Add cue to all registered scenes
    model.scenes.forEach((scene) => {
      scene.stop();
      scene.addCue(cue);
      scene.setEndTime(clip.getDuration());
      scene.setLoop(loop);
      scene.play();
    });

    publicAPI.modified();
    return true;
  };

  /**
   * Pause the current clip
   */
  publicAPI.pauseClip = () => {
    model.scenes.forEach((scene) => scene.pause());
  };

  /**
   * Resume the current clip
   */
  publicAPI.resumeClip = () => {
    model.scenes.forEach((scene) => scene.play());
  };

  /**
   * Stop all playback and reset
   */
  publicAPI.stop = () => {
    if (stopPlayback()) {
      publicAPI.modified();
    }
  };

  /** Alias for stop() */
  publicAPI.stopAll = () => publicAPI.stop();

  /**
   * Get the currently playing clip name
   * @return {string | null}
   */
  publicAPI.getCurrentClipName = () => model.currentClipName;

  /**
   * Check if mixer is playing
   * @return {boolean}
   */
  publicAPI.isPlaying = () => model.currentCue && model.currentCue.isPlaying();

  /**
   * Bind an actor to this mixer so skinning matrices are pushed to it each tick.
   * @param {vtkActor} actor
   */
  publicAPI.bindActor = (actor, skeleton) => {
    if (!model.boundActors.includes(actor)) {
      model.boundActors.push(actor);
    }
    if (skeleton) {
      model.actorSkeletonBindings.set(actor, skeleton);
    }
  };

  /**
   * Unbind an actor
   * @param {vtkActor} actor
   */
  publicAPI.unbindActor = (actor) => {
    const idx = model.boundActors.indexOf(actor);
    if (idx !== -1) {
      model.boundActors.splice(idx, 1);
    }
    model.actorSkeletonBindings.delete(actor);
    actorSkinningMap.delete(actor);
  };

  /**
   * Get all bound actors
   * @return {vtkActor[]}
   */
  publicAPI.getBoundActors = () => [...model.boundActors];

  macro.event(publicAPI, model, 'animationEnd');

  /**
   * Seek to a specific time in the current clip (0-1 normalized)
   * @param {number} t Normalized time [0, 1]
   */
  function computeNodeWorldMatrices() {
    const worldByNodeId = new Map();
    if (!model.nodeTransforms) {
      return worldByNodeId;
    }

    const allChildIds = new Set();
    if (model.nodeChildren) {
      model.nodeChildren.forEach((children) => {
        children.forEach((childId) => allChildIds.add(childId));
      });
    }

    const rootNodeIds = [];
    model.nodeTransforms.forEach((_, nodeId) => {
      if (!allChildIds.has(nodeId)) {
        rootNodeIds.push(nodeId);
      }
    });

    const walkNode = (nodeId, parentWorld) => {
      const transformData = model.nodeTransforms.get(nodeId);
      const localMatrix =
        (transformData && transformData.localMatrix) || mat4.create();
      const world = mat4.multiply(mat4.create(), parentWorld, localMatrix);
      worldByNodeId.set(nodeId, world);
      const children = model.nodeChildren
        ? model.nodeChildren.get(nodeId)
        : null;
      if (children) {
        children.forEach((childId) => walkNode(childId, world));
      }
    };

    rootNodeIds.forEach((rootId) => walkNode(rootId, mat4.create()));
    return worldByNodeId;
  }

  function pushSkinningFromWorldMatrices(worldByNodeId) {
    if (!model.skins || !model.actorNodeIds || worldByNodeId.size === 0) {
      return;
    }

    model.boundActors.forEach((actor) => {
      const nodeId = model.actorNodeIds.get(actor);
      const skinInfo = nodeId ? model.skins.get(nodeId) : null;
      if (
        !skinInfo ||
        !skinInfo.jointNodeIds ||
        !skinInfo.inverseBindMatrices
      ) {
        return;
      }

      const jointCount = skinInfo.jointNodeIds.length;
      const jointMatrices = new Float32Array(jointCount * 16);

      skinInfo.jointNodeIds.forEach((jointNodeId, ji) => {
        const jointWorld = worldByNodeId.get(jointNodeId) || mat4.create();
        const ibm = skinInfo.inverseBindMatrices[ji] || mat4.create();
        // jointMat = jointWorld * ibm  (positions vertices in world space;
        // actor userMatrix is identity for skinned meshes)
        const jointMat = mat4.multiply(mat4.create(), jointWorld, ibm);
        for (let k = 0; k < 16; k++) {
          jointMatrices[ji * 16 + k] = jointMat[k];
        }
      });

      actorSkinningMap.set(actor, { jointMatrices, jointCount });
    });
  }

  /**
   * Sync skeleton bone world matrices from node driven world matrices.
   * Keeps the vtkArmature in sync for debug visualization (ArmatureSource).
   */
  function syncSkeletonFromNodes(worldByNodeId) {
    if (!model.skeleton || worldByNodeId.size === 0) return;

    const skeleton = model.skeleton;
    const boneCount = skeleton.getNumberOfBones();
    const worldMatrices = skeleton.getWorldMatrices();
    for (let i = 0; i < boneCount; i++) {
      const bone = skeleton.getBone(i);
      const nodeId = `node-${bone.nodeId}`;
      const nodeWorld = worldByNodeId.get(nodeId);
      if (nodeWorld) {
        for (let j = 0; j < 16; j++) {
          worldMatrices[i * 16 + j] = nodeWorld[j];
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Internal: apply node transform and morph target animation updates.
  // Walks the scene graph top-down so that parent transforms propagate
  // correctly to descendants (handles cases like BoxAnimated where both
  // a parent and grandchild are animated simultaneously).
  // -------------------------------------------------------------------------
  function applyNodeAnimationUpdates(animatedUpdates) {
    if (!model.actors) return;

    // 2. Find root nodes (nodes present in nodeTransforms but not a child)
    const allChildIds = new Set();
    if (model.nodeChildren) {
      model.nodeChildren.forEach((children) => {
        children.forEach((childId) => allChildIds.add(childId));
      });
    }
    const rootNodeIds = [];
    if (model.nodeTransforms) {
      model.nodeTransforms.forEach((_, nodeId) => {
        if (!allChildIds.has(nodeId)) rootNodeIds.push(nodeId);
      });
    }

    // 3. Walk scene graph top-down, applying animated TRS where available
    function walkNode(nodeId, parentWorldMatrix) {
      const update = animatedUpdates.get(nodeId);
      const transformData = model.nodeTransforms
        ? model.nodeTransforms.get(nodeId)
        : null;

      // Compute local matrix: use animated TRS if available, else original
      let localMatrix;
      if (update && (update.translation || update.rotation || update.scale)) {
        const t = update.translation ||
          (transformData && transformData.translation) || [0, 0, 0];
        const r = update.rotation ||
          (transformData && transformData.rotation) || [0, 0, 0, 1];
        const s = update.scale ||
          (transformData && transformData.scale) || [1, 1, 1];
        localMatrix = mat4.fromRotationTranslationScale(
          mat4.create(),
          quat.fromValues(r[0], r[1], r[2], r[3]),
          vec3.fromValues(t[0], t[1], t[2]),
          vec3.fromValues(s[0], s[1], s[2])
        );
      } else {
        localMatrix =
          (transformData && transformData.localMatrix) || mat4.create();
      }

      const worldMatrix = mat4.multiply(
        mat4.create(),
        parentWorldMatrix,
        localMatrix
      );

      // Store animated local matrix so computeNodeWorldMatrices sees it
      if (transformData) {
        transformData.localMatrix = localMatrix;
      }

      // Apply world matrix to this node's actor and its primitive actors
      const actor = model.actors.get(nodeId);
      if (actor && !model.boundActors.includes(actor)) {
        actor.setUserMatrix(worldMatrix);
      }
      model.actors.forEach((primActor, key) => {
        if (
          key.startsWith(`${nodeId}_`) &&
          !model.boundActors.includes(primActor)
        ) {
          primActor.setUserMatrix(worldMatrix);
        }
      });

      // Update light position/direction if this node has a light
      if (model.nodeLights) {
        const light = model.nodeLights.get(nodeId);
        if (light) {
          const pos = [worldMatrix[12], worldMatrix[13], worldMatrix[14]];
          light.setPosition(...pos);
          // glTF lights point along -Z in local space
          const dir = [-worldMatrix[8], -worldMatrix[9], -worldMatrix[10]];
          vtkMath.normalize(dir);
          light.setFocalPoint(
            pos[0] + dir[0],
            pos[1] + dir[1],
            pos[2] + dir[2]
          );
        }
      }

      // Apply morph target weights animation
      if (update && update.weights && model.morphTargets) {
        const { weights } = update;
        model.morphTargets.forEach((morphData, actorKey) => {
          if (!actorKey.startsWith(`${nodeId}_`)) return;
          const { basePositions, targets, polydata, numVertices } = morphData;
          const points = polydata.getPoints().getData();

          for (let v = 0; v < numVertices; v++) {
            const idx = v * 3;
            points[idx] = basePositions[idx];
            points[idx + 1] = basePositions[idx + 1];
            points[idx + 2] = basePositions[idx + 2];

            for (let ti = 0; ti < targets.length && ti < weights.length; ti++) {
              const w = weights[ti];
              if (w !== 0 && targets[ti].position) {
                points[idx] += w * targets[ti].position[idx];
                points[idx + 1] += w * targets[ti].position[idx + 1];
                points[idx + 2] += w * targets[ti].position[idx + 2];
              }
            }
          }

          polydata.getPoints().modified();
          polydata.modified();
        });
      }

      // Recurse to children
      const children = model.nodeChildren
        ? model.nodeChildren.get(nodeId)
        : null;
      if (children) {
        children.forEach((childId) => walkNode(childId, worldMatrix));
      }
    }

    // Walk from each root node
    rootNodeIds.forEach((rootId) => walkNode(rootId, mat4.create()));
  }

  // -------------------------------------------------------------------------
  // Internal: apply texture transform animation updates
  // -------------------------------------------------------------------------
  function applyPointerAnimationUpdates(updates) {
    if (!model.materialProperties) return;

    updates.forEach((matUpdate, matKey) => {
      const properties = model.materialProperties.get(matKey);
      if (!properties || properties.length === 0) return;

      matUpdate.textureTransforms.forEach((transform, textureKey) => {
        properties.forEach((property) => {
          // Get existing transform to merge animated properties
          const existing = property.getTextureTransform(textureKey) || {};
          const merged = { ...existing };

          if (transform.offset !== undefined) merged.offset = transform.offset;
          if (transform.scale !== undefined) merged.scale = transform.scale;
          if (transform.rotation !== undefined)
            merged.rotation = transform.rotation;

          property.setTextureTransform(textureKey, merged);
        });
      });
    });
  }

  // -------------------------------------------------------------------------
  // Internal: apply registered non skeletal animation bindings
  // -------------------------------------------------------------------------
  /**
   * Weight of an animation inside a binding. An animation that carries no
   * weight counts as a full one.
   */
  function weightOf(animation) {
    const weight = animation.weight ?? 1;
    return weight > 0 ? weight : 0;
  }

  /**
   * Blend one set of updates into the ones already gathered this frame.
   * Translation, scale and morph weights average by weight, a rotation walks
   * toward the new one, and anything else keeps the last value.
   */
  function blendUpdates(gathered, weightSums, updates, weight) {
    updates.forEach((update, key) => {
      let entry = gathered.get(key);
      if (!entry) {
        entry = {};
        gathered.set(key, entry);
        weightSums.set(key, {});
      }
      const sums = weightSums.get(key);

      Object.keys(update).forEach((property) => {
        const value = update[property];
        const gatheredSoFar = sums[property] ?? 0;

        // an animation reuses its own buffer between frames, so the first
        // value of a property has to be copied before anything blends into it
        if (gatheredSoFar === 0 || !ArrayBuffer.isView(value)) {
          entry[property] = ArrayBuffer.isView(value)
            ? Float32Array.from(value)
            : value;
          sums[property] = weight;
          return;
        }

        const total = gatheredSoFar + weight;
        const ratio = weight / total;
        const target = entry[property];
        if (property === 'rotation' && value.length === 4) {
          quat.slerp(target, target, value, ratio);
          quat.normalize(target, target);
        } else {
          for (let i = 0; i < value.length && i < target.length; i++) {
            target[i] = target[i] * (1 - ratio) + value[i] * ratio;
          }
        }
        sums[property] = total;
      });
    });
  }

  function applyAnimationBindings(deltaTime) {
    Array.from(model.animationBindings.entries()).forEach(([name, binding]) => {
      const { animations } = binding;
      if (!binding.enabled || animations.length === 0) {
        return;
      }

      const playable = animations.filter(
        (animation) => animation && typeof animation.evaluate === 'function'
      );
      if (playable.length === 0) {
        return;
      }

      binding.time += deltaTime * binding.timeScale;

      // every animation wraps by its own duration, so the binding only has to
      // hold a run that does not loop at the end of the longest one
      const duration = playable.reduce(
        (longest, animation) => Math.max(longest, animation.duration ?? 0),
        0
      );
      if (!binding.loop && duration > 0 && binding.time >= duration) {
        binding.time = duration;
        if (!binding.ended) {
          binding.ended = true;
          publicAPI.invokeAnimationEnd({ name, binding });
        }
      }
      const time = binding.time;

      // one animation is the common case, and it needs no copy at all
      if (playable.length === 1) {
        const updates = playable[0].evaluate(time, binding.loop);
        if (updates) {
          binding.apply(updates, {
            animation: playable[0],
            deltaTime,
            mixer: publicAPI,
            time,
          });
        }
        return;
      }

      const gathered = new Map();
      const weightSums = new Map();
      playable.forEach((animation) => {
        const weight = weightOf(animation);
        if (weight === 0) {
          return;
        }
        const updates = animation.evaluate(time, binding.loop);
        if (!updates) {
          return;
        }
        if (updates instanceof Map) {
          blendUpdates(gathered, weightSums, updates, weight);
        } else {
          // a shape the mixer cannot blend goes straight through
          binding.apply(updates, {
            animation,
            deltaTime,
            mixer: publicAPI,
            time,
          });
        }
      });

      if (gathered.size > 0) {
        binding.apply(gathered, {
          animations: playable,
          deltaTime,
          mixer: publicAPI,
          time,
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Non skeletal animation configuration
  // -------------------------------------------------------------------------

  /**
   * Write a binding into the map, replacing whatever the name held. The node
   * and the pointer bindings go through here, because selecting another
   * animation reconfigures the binding that the previous selection left.
   */
  function storeAnimationBinding(name, apply, animations, options = {}) {
    model.animationBindings.set(name, {
      animations,
      apply,
      enabled: options.enabled !== false,
      loop: options.loop !== false,
      timeScale: options.timeScale ?? 1,
      time: options.time || 0,
      ended: false,
    });
    publicAPI.modified();
  }

  /**
   * Add a non skeletal animation binding.
   * A binding owns its local time and applies evaluated animation updates.
   * @param {string} name Unique binding name
   * @param {Array} animations Array of objects with evaluate(time)
   * @param {Function} apply Function called with (updates, context)
   * @param {Object} [options]
   * @param {boolean} [options.enabled=true] Whether binding is ticked
   * @param {boolean} [options.loop=true] Whether the binding time wraps at the
   * animation duration, or holds at the end
   * @param {number} [options.timeScale=1] Rate the binding time advances at.
   * A negative value runs the animation backwards
   * @return {boolean} true if the binding was added, false when the name is
   * already taken
   */
  publicAPI.addAnimationBinding = (
    name,
    apply,
    animations = [],
    options = {}
  ) => {
    if (!name || typeof apply !== 'function') {
      return false;
    }
    if (model.animationBindings.has(name)) {
      return false;
    }

    storeAnimationBinding(name, apply, animations, options);
    return true;
  };

  /**
   * Remove a non skeletal animation binding by name.
   * @param {string} name Binding name
   * @return {boolean} true when a binding was removed
   */
  publicAPI.removeAnimationBinding = (name) => {
    const removed = model.animationBindings.delete(name);
    if (removed) {
      publicAPI.modified();
    }
    return removed;
  };

  /**
   * Get registered non skeletal animation binding names.
   * @return {string[]}
   */
  publicAPI.getAnimationBindingNames = () =>
    Array.from(model.animationBindings.keys());

  /**
   * Set the scene graph data needed for node-transform and morph animations.
   * Call once after importing actors.
   * @param {Object} sceneData
   * @param {Map} sceneData.actors - Map of nodeId → vtkActor
   * @param {Map} [sceneData.actorNodeIds] - Map of vtkActor → nodeId
   * @param {Map} sceneData.nodeTransforms - Map of nodeId → { parentMatrix, localMatrix, translation, rotation, scale }
   * @param {Map} sceneData.nodeChildren - Map of nodeId → [childId, ...]
   * @param {Map} [sceneData.morphTargets] - Map of actorKey → { basePositions, targets, polydata, numVertices }
   * @param {Map} [sceneData.materialProperties] - Map of "mat_{index}" → [vtkProperty]
   * @param {Map} [sceneData.nodeLights] - Map of nodeId → vtkLight
   */
  publicAPI.setScene = (sceneData) => {
    model.actors = sceneData.actors || null;
    model.nodeTransforms = sceneData.nodeTransforms || null;
    model.nodeChildren = sceneData.nodeChildren || null;
    model.morphTargets = sceneData.morphTargets || null;
    model.materialProperties = sceneData.materialProperties || null;
    model.nodeLights = sceneData.nodeLights || null;
    model.skins = sceneData.skins || null;
    model.actorNodeIds = sceneData.actorNodeIds
      ? new Map(sceneData.actorNodeIds)
      : new Map();
    if (model.actors && !sceneData.actorNodeIds) {
      model.actors.forEach((actor, actorKey) => {
        const nodeId = actorKey.split('_')[0];
        model.actorNodeIds.set(actor, nodeId);
      });
    }
    publicAPI.modified();
  };

  /**
   * Set node animations (parsed from glTF or other loaders).
   * @param {Array} animations - Array of node animation objects with evaluate(time)
   */
  publicAPI.setNodeAnimations = (animations) => {
    model.nodeAnimations = animations || [];
    storeAnimationBinding(
      NODE_ANIMATION_BINDING,
      (updates) => {
        const animatedUpdates = new Map();
        updates.forEach((update, nodeIndex) => {
          animatedUpdates.set(`node-${nodeIndex}`, update);
        });
        applyNodeAnimationUpdates(animatedUpdates);
      },
      model.nodeAnimations
    );
  };

  /**
   * Play a single node animation by name.
   * Pass null or omit to play the first registered node animation.
   * @param {string} [name] - Animation name to play
   * @param {Object} [options]
   * @param {boolean} [options.loop=true] Whether the time wraps at the
   * animation duration, or holds at the end
   */
  publicAPI.playNodeAnimation = (name, options = {}) => {
    if (!model.nodeAnimations || model.nodeAnimations.length === 0) return;

    const applyFn = (updates) => {
      const animatedUpdates = new Map();
      updates.forEach((update, nodeIndex) => {
        animatedUpdates.set(`node-${nodeIndex}`, update);
      });
      applyNodeAnimationUpdates(animatedUpdates);
    };

    let anim = model.nodeAnimations[0];
    if (name) {
      anim = model.nodeAnimations.find((a) => a.name === name);
    }
    if (anim) {
      storeAnimationBinding(NODE_ANIMATION_BINDING, applyFn, [anim], options);
    }
  };

  /**
   * Play a single pointer animation by name.
   * Pass null or omit to play the first registered pointer animation.
   * @param {string} [name] - Animation name to play
   * @param {Object} [options]
   * @param {boolean} [options.loop=true] Whether the time wraps at the
   * animation duration, or holds at the end
   */
  publicAPI.playPointerAnimation = (name, options = {}) => {
    if (!model.pointerAnimations || model.pointerAnimations.length === 0)
      return;

    let anim = model.pointerAnimations[0];
    if (name) {
      anim = model.pointerAnimations.find((a) => a.name === name);
    }
    if (anim) {
      storeAnimationBinding(
        POINTER_ANIMATION_BINDING,
        applyPointerAnimationUpdates,
        [anim],
        options
      );
    }
  };

  /**
   * Get all imported animation names, without duplicating animations that
   * contain both node and pointer channels.
   * @return {string[]}
   */
  publicAPI.getAnimationNames = () =>
    Array.from(
      new Set([
        ...publicAPI.getNodeAnimationNames(),
        ...publicAPI.getPointerAnimationNames(),
      ])
    );

  /**
   * Play all imported animation channels with the given name.
   * @param {string} name - Animation name to play
   * @return {boolean} true when at least one matching channel was found
   */
  publicAPI.playAnimation = (name, options = {}) => {
    const nodeAnimation = (model.nodeAnimations || []).find(
      (animation) => animation.name === name
    );
    const pointerAnimation = (model.pointerAnimations || []).find(
      (animation) => animation.name === name
    );

    if (!nodeAnimation && !pointerAnimation) {
      return false;
    }

    if (nodeAnimation) {
      publicAPI.playNodeAnimation(name, options);
    } else {
      publicAPI.removeAnimationBinding(NODE_ANIMATION_BINDING);
    }

    if (pointerAnimation) {
      publicAPI.playPointerAnimation(name, options);
    } else {
      publicAPI.removeAnimationBinding(POINTER_ANIMATION_BINDING);
    }

    return true;
  };

  /**
   * Get node animation names
   * @return {string[]}
   */
  publicAPI.getNodeAnimationNames = () =>
    (model.nodeAnimations || []).map((a) => a.name);

  /**
   * Get pointer animation names
   * @return {string[]}
   */
  publicAPI.getPointerAnimationNames = () =>
    (model.pointerAnimations || []).map((a) => a.name);

  /**
   * Set KHR_animation_pointer animations (texture transform animations).
   * @param {Array} animations - Array of pointer animation objects with evaluate(time)
   */
  publicAPI.setPointerAnimations = (animations) => {
    model.pointerAnimations = animations || [];
    storeAnimationBinding(
      POINTER_ANIMATION_BINDING,
      applyPointerAnimationUpdates,
      model.pointerAnimations
    );
  };

  /**
   * Get node animations
   * @return {Array}
   */
  publicAPI.getNodeAnimations = () => model.nodeAnimations || [];

  /**
   * Get pointer animations
   * @return {Array}
   */
  publicAPI.getPointerAnimations = () => model.pointerAnimations || [];

  /**
   * Check if mixer has any animation (skeletal, node, morph, or pointer)
   * @return {boolean}
   */
  publicAPI.hasAnimations = () => {
    const hasClips = model.clips && model.clips.size > 0;
    const hasNodeAnims =
      model.nodeAnimations && model.nodeAnimations.length > 0;
    const hasPointerAnims =
      model.pointerAnimations && model.pointerAnimations.length > 0;
    return hasClips || hasNodeAnims || hasPointerAnims;
  };

  /**
   * Advance animation by deltaTime (called each frame by the render loop).
   * Pipeline:
   *   1. Advance the scenes, so a clip played with playClip poses the skeleton
   *   2. Evaluate animation bindings → update node TRS
   *   3. Recompute world matrices for full node graph
   *   4. Build joint matrices from world matrices + inverse bind matrices
   *   5. Push to actors
   *   6. Sync skeleton world matrices (for armature debug visualization)
   * @param {number} deltaTime Seconds since last frame
   */
  publicAPI.tick = (deltaTime) => {
    model.scenes.forEach((scene) => scene.tick(0, deltaTime));
    applyAnimationBindings(deltaTime);
    const worldByNodeId = computeNodeWorldMatrices();
    pushSkinningFromWorldMatrices(worldByNodeId);
    syncSkeletonFromNodes(worldByNodeId);
  };

  /**
   * Seek to a specific time in the current clip (0-1 normalized)
   * @param {number} t Normalized time [0, 1]
   */
  publicAPI.setClipTime = (t) => {
    if (!model.currentCue) return;
    const duration = model.currentCue.getEndTime();
    const time = Math.max(0, Math.min(t * duration, duration));
    model.scenes.forEach((scene) => scene.seek(time));
    const worldByNodeId = computeNodeWorldMatrices();
    pushSkinningFromWorldMatrices(worldByNodeId);
    syncSkeletonFromNodes(worldByNodeId);
  };

  /**
   * Get current time in clip (0-1 normalized)
   * @return {number}
   */
  publicAPI.getClipTime = () => {
    if (!model.currentCue) return 0;
    const time = model.currentCue.getTime();
    const duration = model.currentCue.getEndTime();
    return duration > 0 ? time / duration : 0;
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const DEFAULT_VALUES = {
  skeleton: null,
  scenes: null,
  clips: null,
  boundActors: null,
  actorSkeletonBindings: null,
  animationBindings: null,
  currentClipName: null,
  currentClip: null,
  currentCue: null,
  // Node animation state
  nodeAnimations: null,
  actors: null,
  nodeTransforms: null,
  nodeChildren: null,
  morphTargets: null,
  nodeLights: null,
  // Pointer animation state
  pointerAnimations: null,
  materialProperties: null,
  skins: null,
  actorNodeIds: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize collections
  if (!model.scenes) {
    model.scenes = [];
  }
  if (!model.clips) {
    model.clips = new Map();
  }
  if (!model.boundActors) {
    model.boundActors = [];
  }
  if (!model.actorSkeletonBindings) {
    model.actorSkeletonBindings = new Map();
  }
  if (!model.animationBindings) {
    model.animationBindings = new Map();
  }

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, ['skeleton']);
  macro.getArray(publicAPI, model, ['scenes']);

  // Object specific methods
  vtkAnimationMixer(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationMixer');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
