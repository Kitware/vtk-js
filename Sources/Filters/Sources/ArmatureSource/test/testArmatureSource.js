import test from 'tape';
import vtkArmature from '../../../../Common/DataModel/Armature/index';
import vtkArmatureSource from '../index';

test('vtkArmatureSource: Basic instantiation', (t) => {
  const source = vtkArmatureSource.newInstance();
  t.ok(source);
  t.equal(source.getSkeleton(), null);
  t.equal(source.getBoneRadius(), 0.1);
  t.equal(source.getJointRadius(), 0.15);
  t.end();
});

test('vtkArmatureSource: Set skeleton', (t) => {
  const source = vtkArmatureSource.newInstance();
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  source.setSkeleton(skeleton);
  t.equal(source.getSkeleton(), skeleton);
  t.end();
});

test('vtkArmatureSource: Set radii', (t) => {
  const source = vtkArmatureSource.newInstance();

  source.setBoneRadius(0.2);
  source.setJointRadius(0.25);

  t.equal(source.getBoneRadius(), 0.2);
  t.equal(source.getJointRadius(), 0.25);
  t.end();
});

test('vtkArmatureSource: Generate PolyData', (t) => {
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
  t.ok(output);
  t.ok(output.getPoints());
  t.end();
});
