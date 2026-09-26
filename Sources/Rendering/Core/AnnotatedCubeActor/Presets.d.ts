// Imported as '../AnnotatedCubeActor' rather than './index' so that the path
// stays valid once the ESM package flattens `<Module>/index.d.ts` to
// `<Module>.d.ts`.
import {
  vtkAnnotatedCubeActor,
  IFaceProperty,
  IStyle,
} from '../AnnotatedCubeActor';

/**
 * The set of properties a preset can apply to a vtkAnnotatedCubeActor.
 */
export interface IAnnotatedCubePresetDefinitions {
  defaultStyle?: IStyle;
  xMinusFaceProperty?: IFaceProperty;
  xPlusFaceProperty?: IFaceProperty;
  yMinusFaceProperty?: IFaceProperty;
  yPlusFaceProperty?: IFaceProperty;
  zMinusFaceProperty?: IFaceProperty;
  zPlusFaceProperty?: IFaceProperty;
}

declare const vtkAnnotatedCubePresets: {
  /**
   * Apply a set of face/style definitions onto an annotated cube actor.
   *
   * @param {IAnnotatedCubePresetDefinitions} definitions The definitions to apply
   * @param {vtkAnnotatedCubeActor} cubeActor The actor to configure
   */
  applyDefinitions(
    definitions: IAnnotatedCubePresetDefinitions,
    cubeActor: vtkAnnotatedCubeActor
  ): void;

  /**
   * Apply a registered preset onto an annotated cube actor.
   *
   * The presets shipped with vtk.js are `'default'` and `'lps'`.
   *
   * @param {string} name The name of the preset
   * @param {vtkAnnotatedCubeActor} cubeActor The actor to configure
   */
  applyPreset(name: string, cubeActor: vtkAnnotatedCubeActor): void;

  /**
   * Register a new preset, or override an existing one.
   *
   * @param {string} name The name of the preset
   * @param {IAnnotatedCubePresetDefinitions} definitions The definitions of the preset
   */
  registerStylePreset(
    name: string,
    definitions: IAnnotatedCubePresetDefinitions
  ): void;
};

export default vtkAnnotatedCubePresets;
