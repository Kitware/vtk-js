import vtkScalarsToColors from "../../../Common/Core/ScalarsToColors";
import { Size, Vector2, Vector3 } from "../../../types";
import vtkActor, { IActorInitialValues } from "../Actor";


export interface ITextSizes {
	tickWidth: number;
	tickHeight: number;
}

export interface IResult {
	ptIdx: number,
	cellIdx: number,
	polys: Float64Array,
	points: Uint16Array,
	tcoords: Float32Array,
}

export interface IStyle {
	fontColor?: string;
	fontStyle?: string;
	fontFamily?: string;
	fontSize?: string;
}

/**
 *
 */
export interface IScalarBarActorInitialValues extends IActorInitialValues {
	automated?: boolean,
	autoLayout?: (publicAPI: object, model: object) => void,
	axisLabel?: string,
	barPosition?: Vector2,
	barSize?: Size,
	boxPosition?: Vector2,
	boxSize?: Size,
	scalarToColors?: null,
	axisTitlePixelOffset?: number,
	axisTextStyle?: IStyle,
	tickLabelPixelOffset?: number,
	tickTextStyle?: IStyle,
	generateTicks?: (helper: any) => void,
	drawBelowRangeSwatch?: boolean,
	drawAboveRangeSwatch?: boolean,
	drawNanAnnotation?: boolean,
}

export interface vtkScalarBarActor extends vtkActor {

	/**
	 * 
	 * @param {Boolean} doUpdate 
	 */
	completedImage(doUpdate: boolean): void;

	/**
	 * based on all the settins compute a barSegments array containing the
	 * segments opf the scalar bar each segment contains :
	 *  corners[4][2] 
	 *  title - e.g. NaN, Above, ticks
	 *  scalars - the normalized scalars values to use for that segment 
	 * 
	 * Note that the bar consumes the space in the box that remains
	 * after leaving room for the text labels.
	 * @param {ITextSizes} textSizes 
	 */
	computeBarSize(textSizes: ITextSizes): Size;

	/**
	 * Called by updatePolyDataForLabels modifies class constants ptv3, tmpv3
	 * @param text 
	 * @param pos 
	 * @param xdir 
	 * @param ydir 
	 * @param dir 
	 * @param offset 
	 * @param results 
	 */
	createPolyDataForOneLabel(text: string, pos: Vector3, xdir: Vector3, ydir: Vector3, dir: Vector2, offset: number, results: IResult): void;

	/**
	 * 
	 */
	getActors(): vtkActor[];

	/**
	 * 
	 */
	getAutoLayout(): any;

	/**
	 * 
	 */
	getGenerateTicks(): any;

	/**
	 * 
	 */
	getAutomated(): boolean;

	/**
	 * 
	 */
	getAxisLabel(): string;

	/**
	 * 
	 */
	getAxisTextStyle(): IStyle;

	/**
	 * 
	 */
	getAxisTitlePixelOffset(): number;

	/**
	 * 
	 */
	getBoxPosition(): Vector2;

	/**
	 * 
	 */
	getBoxPositionByReference(): Vector2;

	/**
	 * 
	 */
	getBoxSize(): Size;

	/**
	 * 
	 */
	getBoxSizeByReference(): Size;

	/**
	 * 
	 */
	getNestedProps(): vtkActor[];

	/**
	 * 
	 */
	getScalarsToColors(): vtkScalarsToColors;

	/**
	 *
	 */
	getDrawNanAnnotation(): boolean

	/**
	 *
	 */
	getDrawBelowRangeSwatch(): boolean

	/**
	 *
	 */
	getDrawAboveRangeSwatch(): boolean

	/**
	 * 
	 */
	getTickTextStyle(): IStyle;

	/**
	 * 
	 * @param {ITextSizes} textSizes 
	 */
	recomputeBarSegments(textSizes: ITextSizes): void;

	/**
	 * 
	 */
	resetAutoLayoutToDefault(): void;

	/**
	 * 
	 * @param autoLayout 
	 */
	setAutoLayout(autoLayout: any): boolean;

	/**
	 * Sets the function used to generate legend ticks. 
	 * 
	 * This function takes a vtkScalarBarActorHelper and returns true on success. 
	 * To have the desired effect, the function must call: `helper.setTicks(ticks: num[])` and `helper.setTickStrings(tickStrings: string[])`.
	 * 
	 * After setting the generateTicks function you must regenerate the vtkScalarBarActor for your changes to take effect. 
	 * One way to do that is:
	 * ```
	 *  const mapper = scalarBarActor.getMapper()
	 *  if (mapper) {
	 *    mapper.getLookupTable().resetAnnotations()
	 *  }
	 * ```
	 * @param generateTicks 
	 */
	setGenerateTicks(generateTicks: (helper: any) => void): boolean;

	/**
	 * 
	 * @param {Boolean} automated 
	 */
	setAutomated(automated: boolean): boolean;

	/**
	 * 
	 * @param {String} axisLabel 
	 */
	setAxisLabel(axisLabel: string): boolean;

	/**
	 * 
	 * @param {IStyle} axisTextStyle 
	 */
	setAxisTextStyle(axisTextStyle: IStyle): boolean;

	/**
	 * 
	 * @param {Number} axisTitlePixelOffset 
	 */
	setAxisTitlePixelOffset(axisTitlePixelOffset: number): boolean;

	/**
	 * 
	 * @param {Vector2} boxPosition 
	 */
	setBoxPosition(boxPosition: Vector2): boolean;

	/**
	 * 
	 * @param {Vector2} boxPosition 
	 */
	setBoxPositionFrom(boxPosition: Vector2): boolean;

	/**
	 * 
	 * @param {Size} boxSize 
	 */
	setBoxSize(boxSize: Size): boolean;

	/**
	 * 
	 * @param {Size} boxSize 
	 */
	setBoxSizeFrom(boxSize: Size): boolean;

	/**
	 * 
	 * @param {Vector2} barPosition 
	 */
	setBarPosition(barPosition: Vector2): boolean;

	/**
	 * 
	 * @param {Vector2} barPosition 
	 */
	setBarPositionFrom(barPosition: Vector2): boolean;

	/**
	 * 
	 * @param {Size} barSize 
	 */
	setBarSize(barSize: Size): boolean;

	/**
	 * 
	 * @param {Size} barSize 
	 */
	setBarSizeFrom(barSize: Size): boolean;

	/**
	 * 
	 * @param {vtkScalarsToColors} scalarsToColors 
	 */
	setScalarsToColors(scalarsToColors: vtkScalarsToColors): boolean;

	/**
	 * Set whether the NaN annotation should be rendered or not.
	 * @param {Boolean} drawNanAnnotation
	 */
	setDrawNanAnnotation(drawNanAnnotation: boolean): boolean;

	/**
	 * Set whether the Below range swatch should be rendered or not
	 * @param {Boolean} drawBelowRangeSwatch
	 */
	setDrawBelowRangeSwatch(drawBelowRangeSwatch: boolean): boolean;

	/**
	 * Set whether the Above range swatch should be rendered or not
	 * @param {Boolean} drawAboveRangeSwatch
	 */
	setDrawAboveRangeSwatch(drawAboveRangeSwatch: boolean): boolean;

	/**
	 *
	 * @param tickLabelPixelOffset
	 */
	setTickLabelPixelOffset(tickLabelPixelOffset: number): boolean;

	/**
	 * 
	 * @param {IStyle} tickStyle 
	 */
	setTickTextStyle(tickStyle: IStyle): void;

	/**
	 * 
	 */
	setVisibility(visibility: boolean): boolean;

	/**
	 * main method to rebuild the scalarBar when something has changed tracks
	 * modified times
	 */
	update(): void;

	/**
	 * 
	 */
	updatePolyDataForBarSegments(): void;

	/** 
	 * Udate the polydata associated with drawing the text labels
	 * specifically the quads used for each label and their associated tcoords
	 * etc. This changes every time the camera viewpoint changes
	 */
	updatePolyDataForLabels(): void;

	/** 
	 * create the texture map atlas that contains the rendering of
	 * all the text strings. Only needs to be called when the text strings
	 * have changed (labels and ticks)
	 */
	updateTextureAtlas(): void;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkScalarBarActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScalarBarActorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IScalarBarActorInitialValues): void;

/**
 * Method use to create a new instance of vtkScalarBarActor
 */
export function newInstance(initialValues?: IScalarBarActorInitialValues): vtkScalarBarActor;

/**
 * vtkScalarBarActor creates a scalar bar with tick marks. A
 * scalar bar is a legend that indicates to the viewer the correspondence
 * between color value and data value. The legend consists of a rectangular bar
 * made of rectangular pieces each colored a constant value. Since
 * vtkScalarBarActor is a subclass of vtkActor2D, it is drawn in the image plane
 * (i.e., in the renderer's viewport) on top of the 3D graphics window.
 */
export declare const vtkScalarBarActor: {
	newInstance: typeof newInstance;
	extend: typeof extend;
};
export default vtkScalarBarActor;
