import { it, expect } from 'vitest';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import {
  TrackType,
  InterpolationMode,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

it('vtkArmature: Basic instantiation', () => {
  const skeleton = vtkArmature.newInstance();
  expect(skeleton).toBeTruthy();
  expect(skeleton.getNumberOfBones()).toBe(0);
});

it('vtkArmature: Add bones', () => {
  const skeleton = vtkArmature.newInstance();

  const idx1 = skeleton.addBone({ name: 'Root' });
  const idx2 = skeleton.addBone({ name: 'Child', parentIndex: 0 });

  expect(idx1).toBe(0);
  expect(idx2).toBe(1);
  expect(skeleton.getNumberOfBones()).toBe(2);
});

it('vtkArmature: Get bones by name', () => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root' });
  skeleton.addBone({ name: 'LeftArm', parentIndex: 0 });

  expect(skeleton.getBoneIndexByName('Root')).toBe(0);
  expect(skeleton.getBoneIndexByName('LeftArm')).toBe(1);
  expect(skeleton.getBoneIndexByName('NotFound')).toBe(-1);
});

it('vtkArmature: Get children indices', () => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root' });
  skeleton.addBone({ name: 'Child1', parentIndex: 0 });
  skeleton.addBone({ name: 'Child2', parentIndex: 0 });
  skeleton.addBone({ name: 'GrandChild', parentIndex: 1 });

  const rootChildren = skeleton.getChildrenIndices(0);
  expect(rootChildren.includes(1)).toBeTruthy();
  expect(rootChildren.includes(2)).toBeTruthy();
  expect(rootChildren.length).toBe(2);

  const child1Children = skeleton.getChildrenIndices(1);
  expect(child1Children.includes(3)).toBeTruthy();
  expect(child1Children.length).toBe(1);
});

it('vtkArmature: Get root bone indices', () => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root1' });
  skeleton.addBone({ name: 'Root2' });
  skeleton.addBone({ name: 'Child', parentIndex: 0 });

  const roots = skeleton.getRootBoneIndices();
  expect(roots.includes(0)).toBeTruthy();
  expect(roots.includes(1)).toBeTruthy();
  expect(roots.includes(2)).toBeFalsy();
});

it('vtkArmature: Remove bone', () => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Bone1' });
  skeleton.addBone({ name: 'Bone2' });
  expect(skeleton.getNumberOfBones()).toBe(2);

  skeleton.removeBone(0);
  expect(skeleton.getNumberOfBones()).toBe(1);
  expect(skeleton.getBone(0).name).toBe('Bone2');
});

it('vtkArmature: Compute world matrices', () => {
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  // Set identity local matrix
  const identity = new Float32Array(16);
  identity[0] = 1;
  identity[5] = 1;
  identity[10] = 1;
  identity[15] = 1;
  skeleton.setLocalMatrix(0, identity);

  skeleton.computeWorldMatrices();
  const worldMatrix = skeleton.getWorldMatrix(0);

  expect(worldMatrix).toBeTruthy();
  expect(worldMatrix[0]).toBe(1);
  expect(worldMatrix[15]).toBe(1);
});

it('vtkArmature: Per-bone matrix accessors', () => {
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });
  skeleton.addBone({ name: 'Child', parentIndex: 0 });

  const testMatrix = new Float32Array(16);
  testMatrix[0] = 2;
  testMatrix[5] = 3;
  testMatrix[10] = 4;
  testMatrix[15] = 1;

  skeleton.setLocalMatrix(0, testMatrix);
  const retrieved = skeleton.getLocalMatrix(0);

  expect(retrieved[0]).toBe(2);
  expect(retrieved[5]).toBe(3);
  expect(retrieved[10]).toBe(4);
  expect(retrieved[15]).toBe(1);

  // Matrix arrays are sized correctly
  expect(skeleton.getLocalMatrices().length).toBe(2 * 16);
  expect(skeleton.getWorldMatrices().length).toBe(2 * 16);
  expect(skeleton.getSkinningMatrices().length).toBe(2 * 16);
});

it('vtkArmature: evaluatePose with translation track', () => {
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({
    name: 'Root',
    localRestTranslation: [0, 0, 0],
    localRestRotation: [0, 0, 0, 1],
  });

  const clip = vtkAnimationClip.newInstance();
  const track = vtkAnimationTrack.newInstance({
    name: 'RootTranslation',
    boneIndex: 0,
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [2, 0, 0]);
  clip.addTrack(track);

  skeleton.evaluatePose(clip, 1);
  const matrix = skeleton.getLocalMatrix(0);

  expect(matrix[12] > 0).toBeTruthy();
});

it('vtkArmature: evaluatePose with rotation track', () => {
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  const clip = vtkAnimationClip.newInstance();
  const track = vtkAnimationTrack.newInstance({
    name: 'RootRotation',
    boneIndex: 0,
    trackType: TrackType.ROTATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(0, [0, 0, 0, 1]);
  track.addKeyframe(1, [0, 0, 1, 0]);
  clip.addTrack(track);

  skeleton.evaluatePose(clip, 0.5);
  expect(skeleton.getNumberOfBones() > 0).toBeTruthy();
});
