/// <reference types="gl-matrix" />

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
declare type Position = 'top' | 'left' | 'right' | 'bottom';
declare type Size = [number, number];
declare type Point = [number, number, number];
declare type HSLColor = [number, number, number];
declare type HSVColor = [number, number, number];
declare type RGBColor = [number, number, number];
declare type RGBAColor = [number, number, number, number];
declare type Color = HSLColor | HSVColor | RGBColor | RGBAColor;
