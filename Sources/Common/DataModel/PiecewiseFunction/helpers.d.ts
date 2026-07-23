import { vtkPiecewiseFunction } from '../PiecewiseFunction';
import { vtkColorTransferFunction } from '../../../Rendering/Core/ColorTransferFunction';

/**
 * Compose a chain of piecewise (value) transform functions and a color
 * transfer function into a single output color transfer function.
 *
 * Collects all x-positions across all transform functions and chains their
 * outputs through to the color function, producing equivalent break points
 * in the composed result. h(g(f(x))): g's x-values live in f's output domain
 * and must be pulled back through f-inverse; h's x-values need g-inverse then
 * f-inverse, and so on.
 *
 * Every transform function in fnList must be monotonic so that its
 * breakpoints can be pulled back through the chain unambiguously. Without
 * an errorThreshold the composed result interpolates linearly between the
 * collected breakpoints, so every transform function must additionally be
 * piecewise linear (midpoint 0.5, sharpness 0 on every segment); with an
 * errorThreshold, shaped (non-linear) segments in any stage are captured
 * through subdivision instead. The final-stage color transfer function is
 * never restricted: its breakpoint colors are always reproduced exactly,
 * and its shaped segments are approximated to within errorThreshold when
 * one is provided (they are linearized between breakpoints otherwise).
 *
 * @param {vtkPiecewiseFunction[]} fnList ordered list of value transform functions, e.g. [modalityFn, voiFn, userFn]
 * @param {vtkColorTransferFunction} colorFn final-stage color transfer function
 * @param {vtkColorTransferFunction} outputFn function to populate with the composed result
 * @param {Number} [errorThreshold] per-color-channel tolerance; when given, each output segment is recursively subdivided at its midpoint until linear interpolation matches the true composed color to within the threshold on every channel
 * @param {Number} [maxSubdivisionDepth] recursion depth cap per segment (default 24). The subdivision is depth-first, so the threshold alone cannot bound the node count; tune both to control the maximum nodes produced (worst case 2^depth - 1 extra nodes per segment)
 * @returns {Number|null} the maximum measured midpoint deviation between the composed output and the true composed chain (0 means exact; a value above errorThreshold means the depth cap stopped refinement somewhere), or null if any transform function is not monotonic, or is not piecewise linear when no errorThreshold is given (outputFn is left untouched). 0 is falsy: test the result against null for success, never its truthiness
 */
export function compose(
  fnList: vtkPiecewiseFunction[],
  colorFn: vtkColorTransferFunction,
  outputFn: vtkColorTransferFunction,
  errorThreshold?: number,
  maxSubdivisionDepth?: number
): number | null;
