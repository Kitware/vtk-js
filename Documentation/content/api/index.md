title: API
---

This documentation provides more detailed information about the API and will be particularly helpful for people who want to use VTK.js into their application.

<style>
  .categories {
    columns: 2 200px;
    column-gap: 1rem;
  }

  .categories br {
    display: none;
  }

  .category {
    break-inside: avoid;
    display: inline-block;
    width: 100%;
  }

  center img {
    width: 25%;
  }
</style>

<center>

[![VTK Book][Book]](https://www.vtk.org/vtk-textbook/)

</center>

<div class="categories">
<div class="category">

__Common/Core__

- [CellArray](Common_Core_CellArray.html)
- [DataArray](Common_Core_DataArray.html)
- [Endian](Common_Core_Endian.html)
- [ImageHelper](Common_Core_ImageHelper.html)
- [LookupTable](Common_Core_LookupTable.html)
- [Math](Common_Core_Math.html)
- [MatrixBuilder](Common_Core_MatrixBuilder.html)
- [Points](Common_Core_Points.html)
- [ProgressHandler](Common_Core_ProgressHandler.html)
- [ScalarsToColors](Common_Core_ScalarsToColors.html)
- [StringArray](Common_Core_StringArray.html)
- [URLExtract](Common_Core_URLExtract.html)
- [VariantArray](Common_Core_VariantArray.html)

</div>

<div class="category">

__Common/DataModel__

- [BoundingBox](Common_DataModel_BoundingBox.html)
- [Box](Common_DataModel_Box.html)
- [Cell](Common_DataModel_Cell.html)
- [Cone](Common_DataModel_Cone.html)
- [Cylinder](Common_DataModel_Cylinder.html)
- [DataSet](Common_DataModel_DataSet.html)
- [DataSetAttributes](Common_DataModel_DataSetAttributes.html)
- [ITKHelper](Common_DataModel_ITKHelper.html)
- [ImageData](Common_DataModel_ImageData.html)
- [ImplicitBoolean](Common_DataModel_ImplicitBoolean.html)
- [Line](Common_DataModel_Line.html)
- [Molecule](Common_DataModel_Molecule.html)
- [PiecewiseFunction](Common_DataModel_PiecewiseFunction.html)
- [Plane](Common_DataModel_Plane.html)
- [PointSet](Common_DataModel_PointSet.html)
- [PolyData](Common_DataModel_PolyData.html)
- [SelectionNode](Common_DataModel_SelectionNode.html)
- [Sphere](Common_DataModel_Sphere.html)
- [StructuredData](Common_DataModel_StructuredData.html)
- [Triangle](Common_DataModel_Triangle.html)

</div>

<div class="category">

__Common/System__

- [MobileVR](Common_System_MobileVR.html)
- [TimerLog](Common_System_TimerLog.html)

</div>

<div class="category">

__Common/Transform__

- [LandmarkTransform](Common_Tranform_LandmarkTransform.html)

</div>

<div class="category">

__Filters/Core__

- [Cutter](Filters_Core_Cutter.html)

</div>
<div class="category">

__Filters/Cornerstone__

- [ImageDataToCornerstoneImage](Filters_Conerstone_ImageDataToCornerstoneImage.html)

</div>
<div class="category">

__Filters/General__

- [AppendPolyData](Filters_General_AppendPolyData.html)
- [Calculator](Filters_General_Calculator.html)
- [ImageCropFilter](Filters_General_ImageCropFilter.html)
- [ImageMarchingCubes](Filters_General_ImageMarchingCubes.html)
- [ImageMarchingSquares](Filters_General_ImageMarchingSquares.html)
- [ImageSliceFilter](Filters_General_ImageSliceFilter.html)
- [ImageStreamline](Filters_General_ImageStreamline.html)
- [MoleculeToRepresentation](Filters_General_MoleculeToRepresentation.html)
- [OutlineFilter](Filters_General_OutlineFilter.html)
- [ScalarToRGBA](Filters_General_ScalarToRGBA.html)
- [TubeFilter](Filters_General_TubeFilter.html)
- [WarpScalar](Filters_General_WarpScalar.html)

</div>
<div class="category">

__Filters/Sources__

- [ArrowSource](Filters_Sources_ArrowSource.html)
- [ConcentricCylinderSource](Filters_Sources_ConcentricCylinderSource.html)
- [ConeSource](Filters_Sources_ConeSource.html)
- [CubeSource](Filters_Sources_CubeSource.html)
- [CylinderSource](Filters_Sources_CylinderSource.html)
- [ImageGridSource](Filters_Sources_ImageGridSource.html)
- [LineSource](Filters_Sources_LineSource.html)
- [PlaneSource](Filters_Sources_PlaneSource.html)
- [PointSource](Filters_Sources_PointSource.html)
- [RTAnalyticSource](Filters_Sources_RTAnalyticSource.html)
- [SLICSource](Filters_Sources_SLICSource.html)
- [SphereSource](Filters_Sources_SphereSource.html)

</div>
<div class="category">

__Filters/Texture__

- [TextureMapToSphere](Filters_Texture_TextureMapToSphere.html)

</div>
<div class="category">

__Imaging/Core__

- [AbstractImageInterpolator](Imaging_Core_AbstractImageInterpolator.html)
- [ImageInterpolator](Imaging_Core_ImageInterpolator.html)
- [ImagePointDataIterator](Imaging_Core_ImagePointDataIterator.html)
- [ImageReslice](Imaging_Core_ImageReslice.html)

</div>
<div class="category">

__Imaging/Hybrid__

- [SampleFunction](Imaging_Hybrid_SampleFunction.html)

</div>
<div class="category">

__Interaction/Manipulators__

- [CompositeCameraManipulator](Interaction_Manipulators_CompositeCameraManipulator.html)
- [CompositeGestureManipulator](Interaction_Manipulators_CompositeGestureManipulator.html)
- [CompositeKeyboardManipulator](Interaction_Manipulators_CompositeKeyboardManipulator.html)
- [CompositeMouseManipulator](Interaction_Manipulators_CompositeMouseManipulator.html)
- [CompositeVRManipulator](Interaction_Manipulators_CompositeVRManipulator.html)
- [GestureCameraManipulator](Interaction_Manipulators_GestureCameraManipulator.html)
- [KeyboardCameraManipulator](Interaction_Manipulators_KeyboardCameraManipulator.html)
- [MouseCameraSliceManipulator](Interaction_Manipulators_MouseCameraSliceManipulator.html)
- [MouseCameraTrackballFirstPersonManipulator](Interaction_Manipulators_MouseCameraTrackballFirstPersonManipulator.html)
- [MouseCameraTrackballMultiRotateManipulator](Interaction_Manipulators_MouseCameraTrackballMultiRotateManipulator.html)
- [MouseCameraTrackballPanManipulator](Interaction_Manipulators_MouseCameraTrackballPanManipulator.html)
- [MouseCameraTrackballRollManipulator](Interaction_Manipulators_MouseCameraTrackballRollManipulator.html)
- [MouseCameraTrackballRotateManipulator](Interaction_Manipulators_MouseCameraTrackballRotateManipulator.html)
- [MouseCameraTrackballZoomManipulator](Interaction_Manipulators_MouseCameraTrackballZoomManipulator.html)
- [MouseCameraTrackballZoomToMouseManipulator](Interaction_Manipulators_MouseCameraTrackballZoomToMouseManipulator.html)
- [MouseRangeManipulator](Interaction_Manipulators_MouseRangeManipulator.html)
- [VRButtonPanManipulator](Interaction_Manipulators_VRButtonPanManipulator.html)

</div>
<div class="category">

__Interaction/Misc__

- [DeviceOrientationToCamera](Interaction_Misc_DeviceOrientationToCamera.html)

</div>
<div class="category">

__Interaction/Style__

- [InteractorStyleImage](Interaction_Style_InteractorStyleImage.html)
- [InteractorStyleManipulator](Interaction_Style_InteractorStyleManipulator.html)
- [InteractorStyleTrackballCamera](Interaction_Style_InteractorStyleTrackballCamera.html)

</div>
<div class="category">

__Interaction/UI__

- [CornerAnnotation](Interaction_UI_CornerAnnotation.html)
- [FPSMonitor](Interaction_UI_FPSMonitor.html)
- [Icons](Interaction_UI_Icons.html)
- [Slider](Interaction_UI_Slider.html)
- [VolumeController](Interaction_UI_VolumeController.html)

</div>
<div class="category">

__Interaction/Widgets__

- [AbstractWidget](Interaction_Widgets_AbstractWidget.html)
- [DistanceRepresentation](Interaction_Widgets_DistanceRepresentation.html)
- [DistanceWidget](Interaction_Widgets_DistanceWidget.html)
- [HandleRepresentation](Interaction_Widgets_HandleRepresentation.html)
- [HandleWidget](Interaction_Widgets_HandleWidget.html)
- [ImageCroppingRegionsRepresentation](Interaction_Widgets_ImageCroppingRegionsRepresentation.html)
- [ImageCroppingRegionsWidget](Interaction_Widgets_ImageCroppingRegionsWidget.html)
- [LabelRepresentation](Interaction_Widgets_LabelRepresentation.html)
- [LabelWidget](Interaction_Widgets_LabelWidget.html)
- [LineRepresentation](Interaction_Widgets_LineRepresentation.html)
- [LineWidget](Interaction_Widgets_LineWidget.html)
- [OrientationMarkerWidget](Interaction_Widgets_OrientationMarkerWidget.html)
- [PiecewiseGaussianWidget](Interaction_Widgets_PiecewiseGaussianWidget.html)
- [PointPlacer](Interaction_Widgets_PointPlacer.html)
- [SphereHandleRepresentation](Interaction_Widgets_SphereHandleRepresentation.html)
- [WidgetRepresentation](Interaction_Widgets_WidgetRepresentation.html)

</div>
<div class="category">

__IO/Core__

- [BinaryHelper](IO_Core_BinaryHelper.html)
- [DataAccessHelper](IO_Core_DataAccessHelper.html)
- [HttpDataSetReader](IO_Core_HttpDataSetReader.html)
- [HttpSceneLoader](IO_Core_HttpSceneLoader.html)

</div>
<div class="category">

__IO/Geometry__

- [STLReader](IO_Geometry_STLReader.html)

</div>
<div class="category">

__IO/Legacy__

- [LegacyAsciiParser](IO_Legacy_LegacyAsciiParser.html)
- [PolyDataReader](IO_Legacy_PolyDataReader.html)

</div>
<div class="category">

__IO/Misc__

- [ElevationReader](IO_Misc_ElevationReader.html)
- [ITKImageReader](IO_Misc_ITKImageReader.html)
- [JSONNucleoReader](IO_Misc_JSONNucleoReader.html)
- [JSONReader](IO_Misc_JSONReader.html)
- [MTLReader](IO_Misc_MTLReader.html)
- [OBJReader](IO_Misc_OBJReader.html)
- [PDBReader](IO_Misc_PDBReader.html)
- [SkyboxReader](IO_Misc_SkyboxReader.html)

</div>
<div class="category">

__IO/XML__

- [XMLImageDataReader](IO_XML_XMLImageDataReader.html)
- [XMLPolyDataReader](IO_XML_XMLPolyDataReader.html)
- [XMLReader](IO_XML_XMLReader.html)

</div>
<div class="category">

__Proxy/Core__

- [AbstractRepresentationProxy](Proxy_Core_AbstractRepresentationProxy.html)
- [LookupTableProxy](Proxy_Core_LookupTableProxy.html)
- [PiecewiseFunctionProxy](Proxy_Core_PiecewiseFunctionProxy.html)
- [ProxyManager](Proxy_Core_ProxyManager.html)
- [SourceProxy](Proxy_Core_SourceProxy.html)
- [View2DProxy](Proxy_Core_View2DProxy.html)
- [ViewProxy](Proxy_Core_ViewProxy.html)

</div>
<div class="category">

__Proxy/Representations__

- [GeometryRepresentationProxy](Proxy_Representations_GeometryRepresentationProxy.html)
- [GlyphRepresentationProxy](Proxy_Representations_GlyphRepresentationProxy.html)
- [MoleculeRepresentationProxy](Proxy_Representations_MoleculeRepresentationProxy.html)
- [SkyboxRepresentationProxy](Proxy_Representations_SkyboxRepresentationProxy.html)
- [SliceRepresentationProxy](Proxy_Representations_SliceRepresentationProxy.html)
- [SlicedGeometryRepresentationProxy](Proxy_Representations_SlicedGeometryRepresentationProxy.html)
- [VolumeRepresentationProxy](Proxy_Representations_VolumeRepresentationProxy.html)

</div>
<div class="category">

__Rendering/Core__

- [AbstractMapper](Rendering_Core_AbstractMapper.html)
- [AbstractMapper3D](Rendering_Core_AbstractMapper3D.html)
- [AbstractPicker](Rendering_Core_AbstractPicker.html)
- [Actor](Rendering_Core_Actor.html)
- [Actor2D](Rendering_Core_Actor2D.html)
- [AnnotatedCubeActor](Rendering_Core_AnnotatedCubeActor.html)
- [AxesActor](Rendering_Core_AxesActor.html)
- [Camera](Rendering_Core_Camera.html)
- [CellPicker](Rendering_Core_CellPicker.html)
- [ColorTransferFunction](Rendering_Core_ColorTransferFunction.html)
- [Coordinate](Rendering_Core_Coordinate.html)
- [Glyph3DMapper](Rendering_Core_Glyph3DMapper.html)
- [ImageMapper](Rendering_Core_ImageMapper.html)
- [ImageProperty](Rendering_Core_ImageProperty.html)
- [ImageSlice](Rendering_Core_ImageSlice.html)
- [InteractorObserver](Rendering_Core_InteractorObserver.html)
- [InteractorStyle](Rendering_Core_InteractorStyle.html)
- [Light](Rendering_Core_Light.html)
- [Mapper](Rendering_Core_Mapper.html)
- [Picker](Rendering_Core_Picker.html)
- [PixelSpaceCallbackMapper](Rendering_Core_PixelSpaceCallbackMapper.html)
- [PointPicker](Rendering_Core_PointPicker.html)
- [Prop](Rendering_Core_Prop.html)
- [Prop3D](Rendering_Core_Prop3D.html)
- [Property](Rendering_Core_Property.html)
- [Property2D](Rendering_Core_Property2D.html)
- [RenderWindow](Rendering_Core_RenderWindow.html)
- [RenderWindowInteractor](Rendering_Core_RenderWindowInteractor.html)
- [Renderer](Rendering_Core_Renderer.html)
- [Representation](Rendering_Core_Representation.html)
- [Skybox](Rendering_Core_Skybox.html)
- [SphereMapper](Rendering_Core_SphereMapper.html)
- [StickMapper](Rendering_Core_StickMapper.html)
- [Texture](Rendering_Core_Texture.html)
- [Viewport](Rendering_Core_Viewport.html)
- [Volume](Rendering_Core_Volume.html)
- [VolumeMapper](Rendering_Core_VolumeMapper.html)
- [VolumeProperty](Rendering_Core_VolumeProperty.html)

</div>
<div class="category">

__Rendering/Misc__

- [FullScreenRenderWindow](Rendering_Misc_FullScreenRenderWindow.html)
- [GenericRenderWindow](Rendering_Misc_GenericRenderWindow.html)
- [RenderWindowWithControlBar](Rendering_Misc_RenderWindowWithControlBar.html)
- [SynchronizableRenderWindow](Rendering_Misc_SynchronizableRenderWindow.html)

</div>
<div class="category">

__Rendering/OpenGL__

- [Actor](Rendering_OpenGL_Actor.html)
- [Actor2D](Rendering_OpenGL_Actor2D.html)
- [BufferObject](Rendering_OpenGL_BufferObject.html)
- [Camera](Rendering_OpenGL_Camera.html)
- [CellArrayBufferObject](Rendering_OpenGL_CellArrayBufferObject.html)
- [ForwardPass](Rendering_OpenGL_ForwardPass.html)
- [Framebuffer](Rendering_OpenGL_Framebuffer.html)
- [Glyph3DMapper](Rendering_OpenGL_Glyph3DMapper.html)
- [HardwareSelector](Rendering_OpenGL_HardwareSelector.html)
- [Helper](Rendering_OpenGL_Helper.html)
- [ImageMapper](Rendering_OpenGL_ImageMapper.html)
- [ImageSlice](Rendering_OpenGL_ImageSlice.html)
- [PixelSpaceCallbackMapper](Rendering_OpenGL_PixelSpaceCallbackMapper.html)
- [PolyDataMapper](Rendering_OpenGL_PolyDataMapper.html)
- [RadialDistortionPass](Rendering_OpenGL_RadialDistortionPass.html)
- [RenderWindow](Rendering_OpenGL_RenderWindow.html)
- [Renderer](Rendering_OpenGL_Renderer.html)
- [Shader](Rendering_OpenGL_Shader.html)
- [ShaderCache](Rendering_OpenGL_ShaderCache.html)
- [ShaderProgram](Rendering_OpenGL_ShaderProgram.html)
- [Skybox](Rendering_OpenGL_Skybox.html)
- [SphereMapper](Rendering_OpenGL_SphereMapper.html)
- [StickMapper](Rendering_OpenGL_StickMapper.html)
- [Texture](Rendering_OpenGL_Texture.html)
- [TextureUnitManager](Rendering_OpenGL_TextureUnitManager.html)
- [VertexArrayObject](Rendering_OpenGL_VertexArrayObject.html)
- [ViewNodeFactory](Rendering_OpenGL_ViewNodeFactory.html)
- [Volume](Rendering_OpenGL_Volume.html)
- [VolumeMapper](Rendering_OpenGL_VolumeMapper.html)
</ul>

</div>
<div class="category">

__Rendering/SceneGraph__

- [GenericWidgetRepresentation](Rendering_SceneGraph_GenericWidgetRepresentation.html)
- [RenderPass](Rendering_SceneGraph_RenderPass.html)
- [ViewNode](Rendering_SceneGraph_ViewNode.html)
- [ViewNodeFactory](Rendering_SceneGraph_ViewNodeFactory.html)

</div>
</div>

<!--
Some of the vtk.js classes may be missing a dedicated API guide and only its source code may be presented as a reference. A good starting point is to look at the `DEFAULT_VALUES` section which will quickly list the set of properties the class is using along with their initial value. Usually those properties will have a setter and a getter associated to them. Custom/add-on methods will looks like `publicAPI.methodName = [...]` while the generated methods will be in the `export function extend(publicAPI, model, initialValues = {})` function prefixed with `macro.[name]` like `macro.obj()`, `macro.algo()`, `macro.event()`...
-->

[Book]: ./books_VTK_guide.png

