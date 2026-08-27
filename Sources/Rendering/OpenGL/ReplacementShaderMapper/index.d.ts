/**
 * Adds `replaceShaderCoincidentOffset` to a mapper view node. The mixin relies
 * on `publicAPI.getCoincidentParameters(ren, actor)` being available.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param [initialValues] (default: {})
 */
declare function implementReplaceShaderCoincidentOffset(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

/**
 * Adds `applyShaderReplacements`, `buildShaders` and
 * `getReplacedShaderTemplate` to a mapper view node. The mixin relies on
 * `publicAPI.getShaderTemplate(...)` and `publicAPI.replaceShaderValues(...)`
 * being available, and reads the user replacements from the renderable's
 * OpenGL view specific properties.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param [initialValues] (default: {})
 */
declare function implementBuildShadersWithReplacements(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

export declare const vtkReplacementShaderMapper: {
  implementReplaceShaderCoincidentOffset: typeof implementReplaceShaderCoincidentOffset;
  implementBuildShadersWithReplacements: typeof implementBuildShadersWithReplacements;
};
export default vtkReplacementShaderMapper;
