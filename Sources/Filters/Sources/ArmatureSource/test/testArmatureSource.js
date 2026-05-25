import { it, expect } from 'vitest';
import vtkArmature from '../../../../Common/DataModel/Armature/index';
import vtkArmatureSource from '../index';

it('vtkArmatureSource: Basic instantiation', () => {
  const source = vtkArmatureSource.newInstance();
  expect(source).toBeTruthy();
  expect(source.getSkeleton()).toBe(null);
  expect(source.getBoneRadius()).toBe(0.1);
  expect(source.getJointRadius()).toBe(0.15);
});

it('vtkArmatureSource: Set skeleton', () => {
  const source = vtkArmatureSource.newInstance();
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  source.setSkeleton(skeleton);
  expect(source.getSkeleton()).toBe(skeleton);
});

it('vtkArmatureSource: Set radii', () => {
  const source = vtkArmatureSource.newInstance();

  source.setBoneRadius(0.2);
  source.setJointRadius(0.25);

  expect(source.getBoneRadius()).toBe(0.2);
  expect(source.getJointRadius()).toBe(0.25);
});

it('vtkArmatureSource: Generate PolyData', () => {
  const source = vtkArmatureSource.newInstance();
  const skeleton = vtkArmature.newInstance();

  skeleton.addBone({
    name: 'Root',
    localRestTranslation: [0, 0, 0],
  });
  skeleton.addBone({
    name: 'Child',
    parentIndex: 0,
    localRestTranslation: [1, 0, 0],
  });

  source.setSkeleton(skeleton);
  source.update();

  const output = source.getOutputData(0);
  expect(output).toBeTruthy();
  expect(output.getPoints()).toBeTruthy();
});
