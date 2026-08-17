import { describe, expect, it } from 'vitest';

import vtkVolumeProperty from 'vtk.js/Sources/Rendering/Core/VolumeProperty';
import { ColorMixPreset } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

describe('vtkVolumeProperty.getUseIndependentComponents', () => {
  it('accounts for the data component count and color mix preset', () => {
    const property = vtkVolumeProperty.newInstance();

    expect(property.getUseIndependentComponents(1)).toBe(false);
    expect(property.getUseIndependentComponents(2)).toBe(true);

    property.setIndependentComponents(false);
    expect(property.getUseIndependentComponents(2)).toBe(false);

    property.setColorMixPreset(ColorMixPreset.ADDITIVE);
    expect(property.getUseIndependentComponents(1)).toBe(true);
  });
});
