import vtkDataArray from '../../../Common/Core/DataArray';
import { AttributeTypes } from '../../../Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '../../../Common/DataModel/DataSet/Constants';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * Describes where an array lives and how it is identified.
 *
 * Exactly one of `name`, `index` or `attribute` is used to look an input array
 * up; output arrays are created from the remaining fields, which are forwarded
 * to `vtkDataArray.newInstance`.
 */
export interface IArraySpec {
  location: FieldDataTypes;
  name?: string;
  index?: number;
  attribute?: AttributeTypes;
  numberOfComponents?: number;
  dataType?: string;
  /**
   * Number of tuples of an output array living in `FieldDataTypes.UNIFORM`,
   * where no other object provides the size.
   */
  tuples?: number;
}

export interface IArraySpecs {
  input: IArraySpec[];
  output: IArraySpec[];
}

export interface IFormula {
  getArrays(inData: any[]): IArraySpecs;
  evaluate(
    arraysIn: Array<Nullable<vtkDataArray>>,
    arraysOut: Array<Nullable<vtkDataArray>>
  ): void;
}

export interface ISimpleFormulaOptions {
  outputAttributeType?: AttributeTypes;
  numberOfOutputComponents?: number;
}

export interface IPreparedArrays {
  arraysIn: Array<Nullable<vtkDataArray>>;
  arraysOut: Array<Nullable<vtkDataArray>>;
}

/**
 *
 */
export interface ICalculatorInitialValues {
  formula?: IFormula;
}

type vtkCalculatorBase = vtkObject & vtkAlgorithm;

export interface vtkCalculator extends vtkCalculatorBase {
  /**
   * Add the array specifiers that are implicitly available at the given
   * location, on top of the ones the caller asked for. Point coordinates are
   * appended when the field data is associated with points or graph vertices.
   * @param {FieldDataTypes} locn
   * @param {IArraySpec[]} arraysIn
   */
  augmentInputArrays(
    locn: FieldDataTypes,
    arraysIn: IArraySpec[]
  ): IArraySpec[];

  /**
   * Build a formula object that applies `singleValueFormula` tuple by tuple.
   *
   * The formula is called with one argument per input array followed by the
   * tuple index and a scratch output tuple. It must return a number when the
   * output has a single component and a tuple otherwise.
   * @param {FieldDataTypes} locn
   * @param {String[]} arrNames names of the input arrays
   * @param {String} resultName name of the array to create
   * @param singleValueFormula
   * @param {ISimpleFormulaOptions} [options] (default: {})
   */
  createSimpleFormulaObject(
    locn: FieldDataTypes,
    arrNames: string[],
    resultName: string,
    singleValueFormula: (...args: any[]) => number | number[],
    options?: ISimpleFormulaOptions
  ): IFormula;

  /**
   * Get the formula currently applied by the filter.
   */
  getFormula(): IFormula;

  /**
   * Fetch the input arrays and allocate the output arrays described by
   * `arraySpec`. Entries are null where a specifier could not be resolved.
   * @param {IArraySpecs} arraySpec
   * @param inData
   * @param outData
   */
  prepareArrays(
    arraySpec: IArraySpecs,
    inData: any,
    outData: any
  ): IPreparedArrays;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): number;

  /**
   * Set the formula to apply.
   * @param {IFormula} formula
   */
  setFormula(formula: IFormula): boolean;

  /**
   * Shorthand for `setFormula(createSimpleFormulaObject(...))`.
   * @param {FieldDataTypes} locn
   * @param {String[]} arrNames names of the input arrays
   * @param {String} resultName name of the array to create
   * @param formula
   * @param {ISimpleFormulaOptions} [options] (default: {})
   */
  setFormulaSimple(
    locn: FieldDataTypes,
    arrNames: string[],
    resultName: string,
    formula: (...args: any[]) => number | number[],
    options?: ISimpleFormulaOptions
  ): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCalculator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICalculatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICalculatorInitialValues
): void;

/**
 * Method used to create a new instance of vtkCalculator
 * @param {ICalculatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICalculatorInitialValues
): vtkCalculator;

/**
 * vtkCalculator - a filter that computes derived quantities from input arrays
 *
 * vtkCalculator evaluates a formula over the arrays of its input dataset and
 * stores the result in a new array of the shallow-copied output. The formula is
 * an object providing a `getArrays()` method — which declares the input arrays
 * it consumes and the output arrays it produces — and an `evaluate()` method
 * that fills the output arrays.
 */
export declare const vtkCalculator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCalculator;
