// Don't use the constants from this file

// Prefer constants from volume property:
import Constants, {
  BlendMode as OriginalBlendMode,
  FilterMode as OriginalFilterMode,
} from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

export const BlendMode = OriginalBlendMode;

export const FilterMode = OriginalFilterMode;

export default Constants;
