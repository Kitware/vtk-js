import { Nullable } from '../../../types';
import { InteractionMethodsName, lineNames } from './Constants';
import { vtkAbstractWidget } from '../../Core/AbstractWidget';

type TLineName = typeof lineNames[number];

type TCursorStyles = {
  [key in InteractionMethodsName]?: string;
} & {
  default?: string;
};

export interface vtkResliceCursorWidgetDefaultInstance
  extends vtkAbstractWidget {
  getActiveInteraction(): Nullable<InteractionMethodsName>;

  getScaleInPixels(): boolean;
  setScaleInPixels(scaleInPixels: boolean): boolean;

  getHoleWidth(): number;
  setHoleWidth(holeWidth: number): boolean;

  setKeepOrthogonality(keepOrthogonality: boolean): boolean;
  getKeepOrthogonality(): boolean;

  setCursorStyles(cursorStyles: TCursorStyles): boolean;
  getCursorStyles(): TCursorStyles;

  setEnableTranslation(enableTranslation: boolean): void;
  setEnableRotation(enableRotation: boolean): void;

  getActiveLineName(): TLineName | undefined;
}

declare const _default: vtkResliceCursorWidgetDefaultInstance;
export default _default;
