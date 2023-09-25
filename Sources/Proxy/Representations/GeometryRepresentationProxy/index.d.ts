import { RGBColor } from "../../../types";
import vtkAbstractRepresentationProxy from '../../Core/AbstractRepresentationProxy';

export interface vtkGeometryRepresentationProxy
	extends vtkAbstractRepresentationProxy {

	/**
	*
	* @param representation a string that describes what representation to use for the explicit geometry.
	*                       possible values are 'Surface with edges', 'Surface' (default), 'Wireframe',
	*                       and 'Points'.
	*/
	setRepresentation(representation: string): boolean;
	getRepresentation(): string;

	// proxy property mappings
	getColor(): RGBColor;
	setColor(color: RGBColor): boolean;
	getInterpolateScalarsBeforeMapping(): boolean;
	setInterpolateScalarsBeforeMapping(interpolateScalarsBeforeMapping: boolean): boolean;
	getOpacity(): number;
	setOpacity(opacity: number): boolean;
	getVisibility(): boolean;
	setVisibility(visible: boolean): boolean;
	getPointSize(): number;
	setPointSize(pointSize: number): boolean;
	getUseShadow(): boolean;
	setUseShadow(lighting: boolean): boolean;
	getUseBounds(): boolean;
	setUseBounds(useBounds: boolean): boolean;
	getLineWidth(): number;
	setLineWidth(width: number): boolean;
}

export default vtkGeometryRepresentationProxy;
