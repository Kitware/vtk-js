import test from 'tape';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import {
  TrackType,
  InterpolationMode,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

test('vtkArmature: Basic instantiation', (t) => {
  const skeleton = vtkArmature.newInstance();
  t.ok(skeleton);
  t.equal(skeleton.getNumberOfBones(), 0);
  t.end();
});

test('vtkArmature: Add bones', (t) => {
  const skeleton = vtkArmature.newInstance();

  const idx1 = skeleton.addBone({ name: 'Root' });
  const idx2 = skeleton.addBone({ name: 'Child', parentIndex: 0 });

  t.equal(idx1, 0);
  t.equal(idx2, 1);
  t.equal(skeleton.getNumberOfBones(), 2);
  t.end();
});

test('vtkArmature: Get bones by name', (t) => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root' });
  skeleton.addBone({ name: 'LeftArm', parentIndex: 0 });

  t.equal(skeleton.getBoneIndexByName('Root'), 0);
  t.equal(skeleton.getBoneIndexByName('LeftArm'), 1);
  t.equal(skeleton.getBoneIndexByName('NotFound'), -1);
  t.end();
});

test('vtkArmature: Get children indices', (t) => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root' });
  skeleton.addBone({ name: 'Child1', parentIndex: 0 });
  skeleton.addBone({ name: 'Child2', parentIndex: 0 });
  skeleton.addBone({ name: 'GrandChild', parentIndex: 1 });

  const rootChildren = skeleton.getChildrenIndices(0);
  t.ok(rootChildren.includes(1));
  t.ok(rootChildren.includes(2));
  t.equal(rootChildren.length, 2);

  const child1Children = skeleton.getChildrenIndices(1);
  t.ok(child1Children.includes(3));
  t.equal(child1Children.length, 1);
  t.end();
});

test('vtkArmature: Get root bone indices', (t) => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Root1' });
  skeleton.addBone({ name: 'Root2' });
  skeleton.addBone({ name: 'Child', parentIndex: 0 });

  const roots = skeleton.getRootBoneIndices();
  t.ok(roots.includes(0));
  t.ok(roots.includes(1));
  t.notOk(roots.includes(2));
  t.end();
});

test('vtkArmature: Remove bone', (t) => {
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({ name: 'Bone1' });
  skeleton.addBone({ name: 'Bone2' });
  t.equal(skeleton.getNumberOfBones(), 2);

  skeleton.removeBone(0);
  t.equal(skeleton.getNumberOfBones(), 1);
  t.equal(skeleton.getBone(0).name, 'Bone2');
  t.end();
});

test('vtkArmature: Compute world matrices', (t) => {
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

  t.ok(worldMatrix);
  t.equal(worldMatrix[0], 1);
  t.equal(worldMatrix[15], 1);
  t.end();
});

test('vtkArmature: Per-bone matrix accessors', (t) => {
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

  t.equal(retrieved[0], 2);
  t.equal(retrieved[5], 3);
  t.equal(retrieved[10], 4);
  t.equal(retrieved[15], 1);

  // Matrix arrays are sized correctly
  t.equal(skeleton.getLocalMatrices().length, 2 * 16);
  t.equal(skeleton.getWorldMatrices().length, 2 * 16);
  t.equal(skeleton.getSkinningMatrices().length, 2 * 16);
  t.end();
});

test('vtkArmature: evaluatePose with translation track', (t) => {
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

  t.ok(matrix[12] > 0, 'X translation should be > 0');
  t.end();
});

test('vtkArmature: evaluatePose with rotation track', (t) => {
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
  t.ok(skeleton.getNumberOfBones() > 0);
  t.end();
});
