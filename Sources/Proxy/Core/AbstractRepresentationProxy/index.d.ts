import { vtkObject } from '../../../interfaces';
import { VtkProxy } from '../../../macros';
import vtkSourceProxy from '../SourceProxy';
import vtkAbstractMapper from '../../../Rendering/Core/AbstractMapper';
import vtkActor from '../../../Rendering/Core/Actor';
import vtkVolume from '../../../Rendering/Core/Volume';

export interface vtkAbstractRepresentationProxy extends VtkProxy {
  setInput<T>(source: vtkSourceProxy<T>): void;
  getInputDataSet(): vtkObject | null;
  setColorBy(
    arrayName: string | null,
    arrayLocation: string,
    componentIndex?: number
  );
  setRescaleOnColorBy(rescale: boolean): boolean;
  getRescaleOnColorBy(): boolean;
  getInput(): VtkProxy;
  getMapper(): vtkAbstractMapper;
  getActors(): vtkActor[];
  getVolumes(): vtkVolume[];
}

export default vtkAbstractRepresentationProxy;
