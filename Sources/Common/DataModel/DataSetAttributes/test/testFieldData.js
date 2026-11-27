import { it, expect } from 'vitest';
import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';
import vtkFieldData from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/FieldData';
import vtkDataSetAttributes from 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

it('Test vtkFieldData default copyFieldFlags isolation', () => {
  const fd1 = vtkFieldData.newInstance();
  const fd2 = vtkFieldData.newInstance();

  expect(Array.isArray(fd1.getCopyFieldFlags())).toBe(false);
  expect(fd1.getCopyFieldFlags()).toEqual({});

  fd1.copyFieldOff('Normals');

  expect(fd1.getFlag('Normals')).toBe(false);
  expect(fd2.getFlag('Normals')).toBeUndefined();
});

it('Test vtkFieldData copyFieldOn, copyFieldOff, getFlag, and clearFieldFlags', () => {
  const fd = vtkFieldData.newInstance();

  expect(fd.getFlag('Scalars')).toBeUndefined();

  fd.copyFieldOff('Scalars');
  expect(fd.getFlag('Scalars')).toBe(false);

  fd.copyFieldOn('Scalars');
  expect(fd.getFlag('Scalars')).toBe(true);

  fd.clearFieldFlags();
  expect(fd.getFlag('Scalars')).toBeUndefined();
  expect(fd.getCopyFieldFlags()).toEqual({});
});

it('Test vtkFieldData passData respects copyFieldFlags', () => {
  const source = vtkDataSetAttributes.newInstance();
  source.addArray(
    vtkDataArray.newInstance({
      name: 'KeepArray',
      values: new Float32Array([1, 2, 3]),
    })
  );
  source.addArray(
    vtkDataArray.newInstance({
      name: 'SkipArray',
      values: new Float32Array([4, 5, 6]),
    })
  );

  const destAllOn = vtkDataSetAttributes.newInstance();
  destAllOn.copyAllOn();
  destAllOn.copyFieldOff('SkipArray');
  destAllOn.passData(source);

  expect(destAllOn.hasArray('KeepArray')).toBe(true);
  expect(destAllOn.hasArray('SkipArray')).toBe(false);

  const destAllOff = vtkDataSetAttributes.newInstance();
  destAllOff.copyAllOff();
  destAllOff.copyFieldOn('KeepArray');
  destAllOff.passData(source);

  expect(destAllOff.hasArray('KeepArray')).toBe(true);
  expect(destAllOff.hasArray('SkipArray')).toBe(false);
});

it('Test vtkFieldData copyFlags before and after initialize/clearFieldFlags', () => {
  const source = vtkFieldData.newInstance();
  source.copyFieldOff('Normals');
  source.copyFieldOn('Scalars');

  const targetBeforeInit = vtkFieldData.newInstance();
  targetBeforeInit.copyFlags(source);
  expect(targetBeforeInit.getCopyFieldFlags()).toEqual({
    Normals: false,
    Scalars: true,
  });

  source.initialize();
  source.copyFieldOff('Vectors');

  const targetAfterInit = vtkFieldData.newInstance();
  targetAfterInit.copyFlags(source);
  expect(targetAfterInit.getFlag('Vectors')).toBe(false);
  expect(targetAfterInit.getFlag('Normals')).toBeUndefined();

  source.clearFieldFlags();
  source.copyFieldOn('TCoords');
  targetAfterInit.copyFlags(source);
  expect(targetAfterInit.getCopyFieldFlags()).toEqual({ TCoords: true });

  // Mutating source afterward must not affect target
  source.copyFieldOff('TCoords');
  expect(targetAfterInit.getFlag('TCoords')).toBe(true);
});

it('Test vtkFieldData copyStructure copies arrays and flags cleanly', () => {
  const source = vtkFieldData.newInstance();
  source.initialize();
  source.copyFieldOff('Normals');
  source.copyFieldOn('Scalars');
  source.addArray(
    vtkDataArray.newInstance({
      name: 'Scalars',
      values: new Float32Array([10, 20]),
    })
  );

  const target = vtkFieldData.newInstance();
  expect(() => target.copyStructure(source)).not.toThrow();

  expect(target.hasArray('Scalars')).toBe(true);
  expect(target.getFlag('Normals')).toBe(false);
  expect(target.getFlag('Scalars')).toBe(true);

  source.copyFieldOn('Normals');
  expect(target.getFlag('Normals')).toBe(false);
});

it('Test vtkFieldData serialization round-trip and legacy array state', () => {
  const fd = vtkFieldData.newInstance();
  fd.copyFieldOff('Normals');
  fd.copyFieldOn('Scalars');

  const state = fd.getState();
  expect(state.copyFieldFlags).toEqual({
    Normals: false,
    Scalars: true,
  });

  // Mutating returned state must not mutate the instance
  state.copyFieldFlags.Normals = true;
  expect(fd.getFlag('Normals')).toBe(false);

  const restored = vtk(fd.getState());
  expect(restored.getFlag('Normals')).toBe(false);
  expect(restored.getFlag('Scalars')).toBe(true);

  const warnings = [];
  macro.setLoggerFunction('warn', (...args) => warnings.push(args.join(' ')));
  try {
    const initialFlags = { Normals: false, Scalars: true };
    const fromInitial = vtkFieldData.newInstance({
      copyFieldFlags: initialFlags,
    });
    expect(warnings).toHaveLength(0);
    expect(fromInitial.getCopyFieldFlags()).toEqual({
      Normals: false,
      Scalars: true,
    });
    initialFlags.Normals = true;
    expect(fromInitial.getFlag('Normals')).toBe(false);

    const legacyEmpty = vtkFieldData.newInstance({ copyFieldFlags: [] });
    expect(Array.isArray(legacyEmpty.getCopyFieldFlags())).toBe(false);
    expect(legacyEmpty.getCopyFieldFlags()).toEqual({});
    legacyEmpty.copyFieldOff('LegacySkip');
    expect(legacyEmpty.getState().copyFieldFlags).toEqual({
      LegacySkip: false,
    });

    const legacyPopulated = vtkFieldData.newInstance({
      copyFieldFlags: ['Normals'],
    });
    expect(Array.isArray(legacyPopulated.getCopyFieldFlags())).toBe(false);
    expect(legacyPopulated.getCopyFieldFlags()).toEqual({});
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('copyFieldFlags');
    expect(warnings[1]).toContain('copyFieldFlags');
  } finally {
    macro.setLoggerFunction('warn', console.warn);
  }
});
