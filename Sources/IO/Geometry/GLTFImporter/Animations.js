import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { quat, vec3 } from 'gl-matrix';

const { vtkDebugMacro, vtkWarningMacro } = macro;

/**
 * Create an animation channel
 * @param {glTFChannel} glTFChannel
 * @param {glTFChannel[]} glTFSamplers
 * @returns
 */
function createAnimationChannel(glTFChannel, glTFSamplers) {
  const path = glTFChannel.target.path;
  const node = glTFChannel.target.node;

  function applyAnimation(value) {
    let axisAngle;
    let w;
    let nq;
    switch (path) {
      case 'translation':
        node.setPosition(value[0], value[1], value[2]);
        break;
      case 'rotation':
        // Convert quaternion to axis-angle representation
        nq = quat.normalize(quat.create(), value);
        axisAngle = new Float64Array(3);
        w = quat.getAxisAngle(axisAngle, nq);
        // Apply rotation using rotateWXYZ
        node.rotateWXYZ(
          vtkMath.degreesFromRadians(w),
          axisAngle[0],
          axisAngle[1],
          axisAngle[2]
        );
        break;
      case 'scale':
        node.setScale(value[0], value[1], value[2]);
        break;
      default:
        vtkWarningMacro(`Unsupported animation path: ${path}`);
    }
  }

  function animate(currentTime) {
    const sampler = glTFSamplers[glTFChannel.sampler];
    const value = sampler.evaluate(currentTime, path);
    applyAnimation(value);
  }

  return { ...glTFChannel, animate };
}

/**
 * Create an animation sampler
 * @param {glTFSampler} glTFSampler
 * @returns
 */
function createAnimationSampler(glTFSampler) {
  let lastKeyframeIndex = 0;

  function findKeyframes(time) {
    let i1 = lastKeyframeIndex;
    while (i1 < glTFSampler.input.length - 1 && glTFSampler.input[i1] <= time) {
      i1++;
    }
    const i0 = Math.max(0, i1 - 1);
    lastKeyframeIndex = i0;
    return [glTFSampler.input[i0], glTFSampler.input[i1], i0, i1];
  }

  function stepInterpolate(path, i0) {
    const startIndex = i0 * 3;
    const v0 = new Array(3);
    for (let i = 0; i < 3; ++i) {
      v0[i] = glTFSampler.output[startIndex + i];
    }

    return v0;
  }

  function linearInterpolate(path, t0, t1, i0, i1, t) {
    const ratio = (t - t0) / (t1 - t0);
    const startIndex = i0 * 4;
    const endIndex = i1 * 4;

    const v0 = new Array(4);
    const v1 = new Array(4);
    for (let i = 0; i < 4; ++i) {
      v0[i] = glTFSampler.output[startIndex + i];
      v1[i] = glTFSampler.output[endIndex + i];
    }

    switch (path) {
      case 'translation':
      case 'scale':
        return vec3.lerp(vec3.create(), v0, v1, ratio);
      case 'rotation':
        return quat.slerp(quat.create(), v0, v1, ratio);
      default:
        vtkWarningMacro(`Unsupported animation path: ${path}`);
        return null;
    }
  }

  function cubicSplineInterpolate(path, t0, t1, i0, i1, time) {
    const dt = t1 - t0;
    const t = (time - t0) / dt;
    const t2 = t * t;
    const t3 = t2 * t;

    const p0 = glTFSampler.output[i0 * 3 + 1];
    const m0 = dt * glTFSampler.output[i0 * 3 + 2];
    const p1 = glTFSampler.output[i1 * 3 + 1];
    const m1 = dt * glTFSampler.output[i1 * 3];

    if (Array.isArray(p0)) {
      return p0.map((v, j) => {
        const a = 2 * t3 - 3 * t2 + 1;
        const b = t3 - 2 * t2 + t;
        const c = -2 * t3 + 3 * t2;
        const d = t3 - t2;
        return a * v + b * m0[j] + c * p1[j] + d * m1[j];
      });
    }

    const a = 2 * t3 - 3 * t2 + 1;
    const b = t3 - 2 * t2 + t;
    const c = -2 * t3 + 3 * t2;
    const d = t3 - t2;
    return a * p0 + b * m0 + c * p1 + d * m1;
  }

  function evaluate(time, path) {
    const [t0, t1, i0, i1] = findKeyframes(time);

    let result;

    switch (glTFSampler.interpolation) {
      case 'STEP':
        result = stepInterpolate(path, i0);
        break;
      case 'LINEAR':
        result = linearInterpolate(path, t0, t1, i0, i1, time);
        break;
      case 'CUBICSPLINE':
        result = cubicSplineInterpolate(path, t0, t1, i0, i1, time);
        break;
      default:
        vtkWarningMacro(
          `Unknown interpolation method: ${glTFSampler.interpolation}`
        );
    }
    return result;
  }

  return { ...glTFSampler, evaluate };
}

/**
 * Create an animation
 * @param {glTFAnimation} glTFAnimation
 * @param {Map} nodes
 * @returns
 */
function createAnimation(glTFAnimation, nodes) {
  glTFAnimation.samplers = glTFAnimation.samplers.map((sampler) =>
    createAnimationSampler(sampler)
  );

  glTFAnimation.channels = glTFAnimation.channels.map((channel) => {
    channel.target.node = nodes.get(`node-${channel.target.node}`);
    return createAnimationChannel(channel, glTFAnimation.samplers);
  });

  function update(currentTime) {
    glTFAnimation.channels.forEach((channel) => channel.animate(currentTime));
  }

  return { ...glTFAnimation, update };
}

/**
 * Create an animation mixer
 * @param {Map} nodes
 * @param {*} accessors
 * @returns
 */
function createAnimationMixer(nodes, accessors) {
  const animations = new Map();
  const activeAnimations = new Map();

  function addAnimation(glTFAnimation) {
    const annimation = createAnimation(glTFAnimation, nodes, accessors);
    animations.set(glTFAnimation.id, annimation);
    vtkDebugMacro(`Animation "${glTFAnimation.id}" added to mixer`);
  }

  function play(name, weight = 1) {
    if (!animations.has(name)) {
      vtkWarningMacro(`Animation "${name}" not found in mixer`);
      return;
    }
    activeAnimations.set(name, {
      animation: animations.get(name),
      weight,
      time: 0,
    });
    vtkDebugMacro(`Playing animation "${name}" with weight ${weight}`);
  }

  function stop(name) {
    if (activeAnimations.delete(name)) {
      vtkWarningMacro(`Stopped animation "${name}"`);
    } else {
      vtkWarningMacro(`Animation "${name}" was not playing`);
    }
  }

  function stopAll() {
    activeAnimations.clear();
    vtkWarningMacro('Stopped all animations');
  }

  function update(deltaTime) {
    // Normalize weights
    const totalWeight = Array.from(activeAnimations.values()).reduce(
      (sum, { weight }) => sum + weight,
      0
    );

    activeAnimations.forEach(({ animation, weight, time }, name) => {
      const normalizedWeight = totalWeight > 0 ? weight / totalWeight : 0;
      const newTime = time + deltaTime;
      activeAnimations.set(name, { animation, weight, time: newTime });

      vtkDebugMacro(
        `Updating animation "${name}" at time ${newTime.toFixed(
          3
        )} with normalized weight ${normalizedWeight.toFixed(3)}`
      );

      animation.update(newTime, normalizedWeight);
    });
  }

  return { addAnimation, play, stop, stopAll, update };
}

export {
  createAnimation,
  createAnimationChannel,
  createAnimationMixer,
  createAnimationSampler,
};
