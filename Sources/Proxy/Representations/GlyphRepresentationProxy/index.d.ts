import { vtkAbstractRepresentationProxy } from '../../Core/AbstractRepresentationProxy';

export interface vtkGlyphRepresentationProxy extends vtkAbstractRepresentationProxy {
  /**
   * Coloring is driven by the color map embedded in the input description,
   * so this is a no-op.
   */
  setColorBy(): void;
  getColorBy(): [];
  listDataArrays(): [];

  // proxy property mappings
  getEdgeVisibility(): boolean;
  setEdgeVisibility(edgeVisibility: boolean): boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

export function newInstance(
  initialValues?: object
): vtkGlyphRepresentationProxy;

/**
 * Representation proxy that builds one glyph mapper per mapping entry of a
 * JSON description holding the glyph sources, their placement and a color map.
 */
declare const vtkGlyphRepresentationProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkGlyphRepresentationProxy;
