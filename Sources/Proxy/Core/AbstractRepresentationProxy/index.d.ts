import { vtkObject } from '../../../interfaces';
import { VtkProxy } from '../../../macros';
import vtkDataArray from '../../../Common/Core/DataArray';
import { Bounds, Range } from '../../../types';
import { vtkSourceProxy } from '../SourceProxy';
import { vtkAbstractMapper } from '../../../Rendering/Core/AbstractMapper';
import { vtkActor } from '../../../Rendering/Core/Actor';
import { vtkVolume } from '../../../Rendering/Core/Volume';
import { vtkLookupTableProxy } from '../LookupTableProxy';
import { vtkPiecewiseFunctionProxy } from '../PiecewiseFunctionProxy';
import { vtkProp } from '../../../Rendering/Core/Prop';

export interface IRepresentationDataArrayInfo {
  name: string;
  location: string;
  numberOfComponents: number;
  dataRange: Range;
}

/**
 * Representation proxies are also props: `setVisibility` is overridden to
 * forward the flag to every actor and volume, and reports nothing back.
 */
export interface vtkAbstractRepresentationProxy
  extends VtkProxy, Omit<vtkProp, 'setVisibility'> {
  setInput<T>(source: vtkSourceProxy<T>): void;
  getInputDataSet(): vtkObject | null;
  getDataArray(arrayName?: string, arrayLocation?: string): vtkDataArray | null;
  getLookupTableProxy(arrayName?: string): vtkLookupTableProxy | null;
  setLookupTableProxy(...args: unknown[]): void;
  getPiecewiseFunctionProxy(
    arrayName?: string
  ): vtkPiecewiseFunctionProxy | null;
  setPiecewiseFunctionProxy(...args: unknown[]): void;
  rescaleTransferFunctionToDataRange(
    arrayName: string,
    arrayLocation: string,
    componentIndex?: number
  ): void;
  setColorBy(
    arrayName: string | null,
    arrayLocation: string,
    componentIndex?: number
  );
  /**
   * Get the array name, array location and component index currently driving
   * the coloring. Trailing entries are omitted when the matching state is not
   * set, so the tuple may come back empty.
   */
  getColorBy(): [string?, string?, number?];
  setRescaleOnColorBy(rescale: boolean): boolean;
  getRescaleOnColorBy(): boolean;
  getInput(): VtkProxy | undefined;
  getMapper(): vtkAbstractMapper | undefined;
  getActors(): vtkActor[];
  getVolumes(): vtkVolume[];
  getNestedProps(): Array<vtkActor | vtkVolume>;
  getBounds(): Bounds;
  isVisible(): boolean;
  setVisibility(visible: boolean): void;
  listDataArrays(): IRepresentationDataArrayInfo[];
  updateColorByDomain(): void;
}

export interface IAbstractRepresentationProxyInitialValues {
  rescaleOnColorBy?: boolean;
}

declare const vtkAbstractRepresentationProxy: {
  extend: (
    publicAPI: object,
    model: object,
    initialValues?: IAbstractRepresentationProxyInitialValues
  ) => void;
};
export default vtkAbstractRepresentationProxy;
