import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/LiteColorMaps.json';

const presetMap = Object.create(null);

vtkColorMaps
  .filter((p) => p.RGBPoints)
  .filter((p) => p.ColorSpace !== 'CIELAB')
  .forEach((p) => {
    presetMap[p.Name] = p;
  });

// ----------------------------------------------------------------------------

const rgbPresetNames = Object.keys(presetMap);
rgbPresetNames.sort();

// ----------------------------------------------------------------------------

function getPresetByName(name) {
  return presetMap[name];
}

// ----------------------------------------------------------------------------

function addPreset(preset) {
  if (!preset.RGBPoints || preset.ColorSpace === 'CIELAB') {
    return;
  }

  if (!presetMap[preset.Name]) {
    rgbPresetNames.push(preset.Name);
    rgbPresetNames.sort();
  }

  presetMap[preset.Name] = preset;
}

// ----------------------------------------------------------------------------

function removePresetByName(name) {
  const index = rgbPresetNames.indexOf(name);
  if (index > -1) {
    rgbPresetNames.splice(index, 1);
  }
  delete presetMap[name];
}

// ----------------------------------------------------------------------------

export default {
  addPreset,
  removePresetByName,
  getPresetByName,
  rgbPresetNames,
};
