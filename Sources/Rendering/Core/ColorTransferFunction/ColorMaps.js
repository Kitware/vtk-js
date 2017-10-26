import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

const uniqueNames = {};

vtkColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .map(p => p.Name)
  .forEach((name) => {
    uniqueNames[name] = true;
  });

// ----------------------------------------------------------------------------

const rgbPresetNames = Object.keys(uniqueNames);
rgbPresetNames.sort();

// ----------------------------------------------------------------------------

function getPresetByName(name) {
  return vtkColorMaps.find(p => p.Name === name);
}

// ----------------------------------------------------------------------------

export default {
  getPresetByName,
  rgbPresetNames,
};
