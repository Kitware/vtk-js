import { IAbstractManipulatorInitialValues, vtkAbstractManipulator } from "../AbstractManipulator";
import vtkPicker from '../../../Rendering/Core/Picker';

/**
 *
 */
export interface IPickerManipulatorInitialValues extends IAbstractManipulatorInitialValues {

}

export interface vtkPickerManipulator extends vtkAbstractManipulator {

  /**
	 *
	 */
	getPicker(): vtkPicker;

  /**
	 *
	 */
	setPicker(picker: vtkPicker): void;

}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkPickerManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPickerManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPickerManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkPickerManipulator
 */
export function newInstance(initialValues?: IPickerManipulatorInitialValues): vtkPickerManipulator;


/**
 * vtkPickerManipulator.
 */
export declare const vtkPickerManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPickerManipulator;
