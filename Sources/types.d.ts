import { vtkOutputPort } from './interfaces';

/** Alias type for value that can be null */
declare type Nullable<T> = T | null;

/**
 * Alias type for number that are floats
 * @ignorenaming
 */
declare type float = number;

/**
 * Alias type for number that are doubles.
 * @ignorenaming
 */
declare type double = number;

/**
 * Alias type for number that are integer
 * @ignorenaming
 */
declare type int = number;

declare type TypedArray =
  | number[]
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Uint8ClampedArray
  | Int32Array
  | Int16Array
  | Int8Array
  | Float64Array
  | Float32Array;

declare type Bounds = [number, number, number, number, number, number];
declare type CellType = number;
declare type Extent = [number, number, number, number, number, number];
declare type Placement = 'top' | 'left' | 'right' | 'bottom';
declare type Size = [number, number];
declare type Range = [number, number];
declare type Vector2 = [number, number];
declare type Vector3 = [number, number, number];
declare type Vector4 = [number, number, number, number];

declare type Matrix = number[];
declare type Matrix2x2 = [number, number, number, number, number, number];
declare type Matrix3x3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
/**
 * @deprecated The `Point` type is depracted, please use `Vector3` instead.
 */
declare type Point = Vector3;
declare type HSLColor = [number, number, number];
declare type HSVColor = [number, number, number];
declare type RGBColor = [number, number, number];
declare type RGBAColor = [number, number, number, number];
declare type Color = HSLColor | HSVColor | RGBColor | RGBAColor;

declare type vtkPipelineConnection = () => any | vtkOutputPort;

declare type CrossOrigin = '' | 'anonymous' | 'use-credentials';
