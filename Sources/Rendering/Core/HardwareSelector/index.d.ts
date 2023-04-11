import { FieldAssociations } from '../../../Common/DataModel/DataSet/Constants';
import vtkSelectionNode from '../../../Common/DataModel/SelectionNode';
import { vtkObject } from '../../../interfaces';
import vtkRenderer from '../../../Rendering/Core/Renderer';

export interface vtkHardwareSelector extends vtkObject {
  /**
   * Get the picking source data.
   *
   * @param {vtkRenderer} renderer
   * @param {number} fx1 top left x coord
   * @param {number} fy1 top left y coord
   * @param {number} fx2 bottom right x coord
   * @param {number} fy2 bottom right y coord
   */
  getSourceDataAsync(
    renderer: vtkRenderer,
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): Promise<unknown>;

  /**
   * Generates a selection.
   *
   * @param {vtkRenderer} renderer
   * @param {number} fx1 top left x coord
   * @param {number} fy1 top left y coord
   * @param {number} fx2 bottom right x coord
   * @param {number} fy2 bottom right y coord
   */
  selectAsync(
    renderer: vtkRenderer,
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): Promise<vtkSelectionNode[]>;

  /**
   * Sets the field association.
   * @param {FieldAssociations} assoc
   */
  setFieldAssociation(assoc: FieldAssociations): boolean;

  /**
   * Gets the field association.
   */
  getFieldAssociation(): FieldAssociations;

  /**
   * Sets whether to capture Z values.
   * @param {boolean} capture
   */
  setCaptureZValues(capture: boolean): boolean;

  /**
   * Gets whether to capture Z values.
   */
  getCaptureZValues(): boolean;
}

export interface IHardwareSelectorInitialValues {
  fieldAssociation?: FieldAssociations;
  captureZValues?: boolean;
}

export function newInstance(
  initialValues?: IHardwareSelectorInitialValues
): vtkHardwareSelector;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IHardwareSelectorInitialValues
): void;

export const vtkHardwareSelector: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkHardwareSelector;
