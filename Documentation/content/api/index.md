title: API
---

This documentation provides more detailed information about the API and will be particularly helpful for people who want to use VTK.js into their application. 

<style>
  .categories {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .categories br {
    display: none;
  }
  
  .category {
    flex: 1;
    min-width: 45%;
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

<ul>
<li>[CellArray](Common_Core_CellArray.html)</li>
<li>[DataArray](Common_Core_DataArray.html)</li>
<li>[Endian](Common_Core_Endian.html)</li>
<li>[ImageHelper](Common_Core_ImageHelper.html)</li>
<li>[LookupTable](Common_Core_LookupTable.html)</li>
<li>[Math](Common_Core_Math.html)</li>
<li>[MatrixBuilder](Common_Core_MatrixBuilder.html)</li>
<li>[Points](Common_Core_Points.html)</li>
<li>[ProgressHandler](Common_Core_ProgressHandler.html)</li>
<li>[ScalarsToColors](Common_Core_ScalarsToColors.html)</li>
<li>[StringArray](Common_Core_StringArray.html)</li>
<li>[URLExtract](Common_Core_URLExtract.html)</li>
<li>[VariantArray](Common_Core_VariantArray.html)</li>
</ul>
</div>

<div class="category">
__Common/DataModel__

<ul>
<li>[BoundingBox](Common_DataModel_BoundingBox.html)</li>
<li>[Box](Common_DataModel_Box.html)</li>
<li>[Cell](Common_DataModel_Cell.html)</li>
<li>[Cone](Common_DataModel_Cone.html)</li>
<li>[Cylinder](Common_DataModel_Cylinder.html)</li>
<li>[DataSet](Common_DataModel_DataSet.html)</li>
<li>[DataSetAttributes](Common_DataModel_DataSetAttributes.html)</li>
<li>[ITKHelper](Common_DataModel_ITKHelper.html)</li>
<li>[ImageData](Common_DataModel_ImageData.html)</li>
<li>[ImplicitBoolean](Common_DataModel_ImplicitBoolean.html)</li>
<li>[Line](Common_DataModel_Line.html)</li>
<li>[Molecule](Common_DataModel_Molecule.html)</li>
<li>[PiecewiseFunction](Common_DataModel_PiecewiseFunction.html)</li>
<li>[Plane](Common_DataModel_Plane.html)</li>
<li>[PointSet](Common_DataModel_PointSet.html)</li>
<li>[PolyData](Common_DataModel_PolyData.html)</li>
<li>[SelectionNode](Common_DataModel_SelectionNode.html)</li>
<li>[Sphere](Common_DataModel_Sphere.html)</li>
<li>[StructuredData](Common_DataModel_StructuredData.html)</li>
<li>[Triangle](Common_DataModel_Triangle.html)</li>
</ul>
</div>

<div class="category">
__Common/System__

<ul>
<li>[MobileVR](Common_System_MobileVR.html)</li>
<li>[TimerLog](Common_System_TimerLog.html)</li>
</ul>
</div>

<div class="category">
__Common/Transform__

<ul>
<li>[LandmarkTransform](Common_Tranform_LandmarkTransform.html)</li>
</ul>
</div>

<div class="category">__Filters/Core__

<ul>
<li>[Cutter](Filters_Core_Cutter.html)</li>
</ul>

</div>
<div class="category">__Filters/Cornerstone__

<ul>
<li>[ImageDataToCornerstoneImage](Filters_Conerstone_ImageDataToCornerstoneImage.html)</li>
</ul>

</div>
<div class="category">__Filters/General__>

<ul>
<li>[AppendPolyData](Filters_General_AppendPolyData.html)</li>
<li>[Calculator](Filters_General_Calculator.html)</li>
<li>[ImageCropFilter](Filters_General_ImageCropFilter.html)</li>
<li>[ImageMarchingCubes](Filters_General_ImageMarchingCubes.html)</li>
<li>[ImageMarchingSquares](Filters_General_ImageMarchingSquares.html)</li>
<li>[ImageSliceFilter](Filters_General_ImageSliceFilter.html)</li>
<li>[ImageStreamline](Filters_General_ImageStreamline.html)</li>
<li>[MoleculeToRepresentation](Filters_General_MoleculeToRepresentation.html)</li>
<li>[OutlineFilter](Filters_General_OutlineFilter.html)</li>
<li>[ScalarToRGBA](Filters_General_ScalarToRGBA.html)</li>
<li>[TubeFilter](Filters_General_TubeFilter.html)</li>
<li>[WarpScalar](Filters_General_WarpScalar.html)</li>
</ul>

</div>
<div class="category">__Filters/Sources__

<ul>
<li>[ArrowSource](Filters_Sources_ArrowSource.html)</li>
<li>[ConcentricCylinderSource](Filters_Sources_ConcentricCylinderSource.html)</li>
<li>[ConeSource](Filters_Sources_ConeSource.html)</li>
<li>[CubeSource](Filters_Sources_CubeSource.html)</li>
<li>[CylinderSource](Filters_Sources_CylinderSource.html)</li>
<li>[ImageGridSource](Filters_Sources_ImageGridSource.html)</li>
<li>[LineSource](Filters_Sources_LineSource.html)</li>
<li>[PlaneSource](Filters_Sources_PlaneSource.html)</li>
<li>[PointSource](Filters_Sources_PointSource.html)</li>
<li>[RTAnalyticSource](Filters_Sources_RTAnalyticSource.html)</li>
<li>[SLICSource](Filters_Sources_SLICSource.html)</li>
<li>[SphereSource](Filters_Sources_SphereSource.html)</li>
</ul>

</div>
<div class="category">__Filters/Texture__

<ul>
<li>[TextureMapToSphere](Filters_Texture_TextureMapToSphere.html)</li>
</ul>

</div>
<div class="category">__Imaging/Core__

<ul>
<li>[AbstractImageInterpolator](Imaging_Core_AbstractImageInterpolator.html)</li>
<li>[ImageInterpolator](Imaging_Core_ImageInterpolator.html)</li>
<li>[ImagePointDataIterator](Imaging_Core_ImagePointDataIterator.html)</li>
<li>[ImageReslice](Imaging_Core_ImageReslice.html)</li>
</ul>

</div>
<div class="category">__Imaging/Hybrid__

<ul>
<li>[SampleFunction](Imaging_Hybrid_SampleFunction.html)</li>
</ul>

</div>
<div class="category">__Interaction/Manipulators__

<ul>
<li>[CompositeCameraManipulator](Interaction_Manipulators_CompositeCameraManipulator.html)</li>
<li>[CompositeGestureManipulator](Interaction_Manipulators_CompositeGestureManipulator.html)</li>
<li>[CompositeMouseManipulator](Interaction_Manipulators_CompositeMouseManipulator.html)</li>
<li>[CompositeVRManipulator](Interaction_Manipulators_CompositeVRManipulator.html)</li>
<li>[GestureCameraManipulator](Interaction_Manipulators_GestureCameraManipulator.html)</li>
<li>[MouseCameraSliceManipulator](Interaction_Manipulators_MouseCameraSliceManipulator.html)</li>
<li>[MouseCameraTrackballMultiRotateManipulator](Interaction_Manipulators_MouseCameraTrackballMultiRotateManipulator.html)</li>
<li>[MouseCameraTrackballPanManipulator](Interaction_Manipulators_MouseCameraTrackballPanManipulator.html)</li>
<li>[MouseCameraTrackballRollManipulator](Interaction_Manipulators_MouseCameraTrackballRollManipulator.html)</li>
<li>[MouseCameraTrackballRotateManipulator](Interaction_Manipulators_MouseCameraTrackballRotateManipulator.html)</li>
<li>[MouseCameraTrackballZoomManipulator](Interaction_Manipulators_MouseCameraTrackballZoomManipulator.html)</li>
<li>[MouseCameraTrackballZoomToMouseManipulator](Interaction_Manipulators_MouseCameraTrackballZoomToMouseManipulator.html)</li>
<li>[MouseRangeManipulator](Interaction_Manipulators_MouseRangeManipulator.html)</li>
<li>[VRButtonPanManipulator](Interaction_Manipulators_VRButtonPanManipulator.html)</li>
</ul>

</div>
<div class="category">__Interaction/Misc__

<ul>
  <li>[DeviceOrientationToCamera](Interaction_Misc_DeviceOrientationToCamera.html)</li>
</ul>

</div>
<div class="category">__Interaction/Style__

<ul>
<li>[InteractorStyleImage](Interaction_Style_InteractorStyleImage.html)</li>
<li>[InteractorStyleManipulator](Interaction_Style_InteractorStyleManipulator.html)</li>
<li>[InteractorStyleTrackballCamera](Interaction_Style_InteractorStyleTrackballCamera.html)</li>
</ul>

</div>
<div class="category">__Interaction/UI__

<ul>
<li>[CornerAnnotation](Interaction_UI_CornerAnnotation.html)</li>
<li>[FPSMonitor](Interaction_UI_FPSMonitor.html)</li>
<li>[Icons](Interaction_UI_Icons.html)</li>
<li>[Slider](Interaction_UI_Slider.html)</li>
<li>[VolumeController](Interaction_UI_VolumeController.html)</li>
</ul>

</div>
<div class="category">__Interaction/Widgets__

<ul>
<li>[AbstractWidget](Interaction_Widgets_AbstractWidget.html)</li>
<li>[DistanceRepresentation](Interaction_Widgets_DistanceRepresentation.html)</li>
<li>[DistanceWidget](Interaction_Widgets_DistanceWidget.html)</li>
<li>[HandleRepresentation](Interaction_Widgets_HandleRepresentation.html)</li>
<li>[HandleWidget](Interaction_Widgets_HandleWidget.html)</li>
<li>[ImageCroppingRegionsRepresentation](Interaction_Widgets_ImageCroppingRegionsRepresentation.html)</li>
<li>[ImageCroppingRegionsWidget](Interaction_Widgets_ImageCroppingRegionsWidget.html)</li>
<li>[LabelRepresentation](Interaction_Widgets_LabelRepresentation.html)</li>
<li>[LabelWidget](Interaction_Widgets_LabelWidget.html)</li>
<li>[LineRepresentation](Interaction_Widgets_LineRepresentation.html)</li>
<li>[LineWidget](Interaction_Widgets_LineWidget.html)</li>
<li>[OrientationMarkerWidget](Interaction_Widgets_OrientationMarkerWidget.html)</li>
<li>[PiecewiseGaussianWidget](Interaction_Widgets_PiecewiseGaussianWidget.html)</li>
<li>[PointPlacer](Interaction_Widgets_PointPlacer.html)</li>
<li>[SphereHandleRepresentation](Interaction_Widgets_SphereHandleRepresentation.html)</li>
<li>[WidgetRepresentation](Interaction_Widgets_WidgetRepresentation.html)</li>
</ul>

</div>
<div class="category">__IO/Core__

<ul>
<li>[BinaryHelper](IO_Core_BinaryHelper.html)</li>
<li>[DataAccessHelper](IO_Core_DataAccessHelper.html)</li>
<li>[HttpDataSetReader](IO_Core_HttpDataSetReader.html)</li>
<li>[HttpSceneLoader](IO_Core_HttpSceneLoader.html)</li>
</ul>

</div>
<div class="category">__IO/Geometry__

<ul>
  <li>[STLReader](IO_Geometry_STLReader.html)</li>
</ul>

</div>
<div class="category">__IO/Legacy__

<ul>
<li>[LegacyAsciiParser](IO_Legacy_LegacyAsciiParser.html)</li>
<li>[PolyDataReader](IO_Legacy_PolyDataReader.html)</li>
</ul>

</div>
<div class="category">__IO/Misc__

<ul>
<li>[ElevationReader](IO_Misc_ElevationReader.html)</li>
<li>[ITKImageReader](IO_Misc_ITKImageReader.html)</li>
<li>[JSONNucleoReader](IO_Misc_JSONNucleoReader.html)</li>
<li>[JSONReader](IO_Misc_JSONReader.html)</li>
<li>[MTLReader](IO_Misc_MTLReader.html)</li>
<li>[OBJReader](IO_Misc_OBJReader.html)</li>
<li>[PDBReader](IO_Misc_PDBReader.html)</li>
<li>[SkyboxReader](IO_Misc_SkyboxReader.html)</li>
</ul>

</div>
<div class="category">__IO/XML__

<ul>
<li>[XMLImageDataReader](IO_XML_XMLImageDataReader.html)</li>
<li>[XMLPolyDataReader](IO_XML_XMLPolyDataReader.html)</li>
<li>[XMLReader](IO_XML_XMLReader.html)</li>
</ul>

</div>
<div class="category">__Proxy/Core__

<ul>
<li>[AbstractRepresentationProxy](Proxy_Core_AbstractRepresentationProxy.html)</li>
<li>[LookupTableProxy](Proxy_Core_LookupTableProxy.html)</li>
<li>[PiecewiseFunctionProxy](Proxy_Core_PiecewiseFunctionProxy.html)</li>
<li>[ProxyManager](Proxy_Core_ProxyManager.html)</li>
<li>[SourceProxy](Proxy_Core_SourceProxy.html)</li>
<li>[View2DProxy](Proxy_Core_View2DProxy.html)</li>
<li>[ViewProxy](Proxy_Core_ViewProxy.html)</li>
</ul>

</div>
<div class="category">__Proxy/Representations__

<ul>
<li>[GeometryRepresentationProxy](Proxy_Representations_GeometryRepresentationProxy.html)</li>
<li>[GlyphRepresentationProxy](Proxy_Representations_GlyphRepresentationProxy.html)</li>
<li>[MoleculeRepresentationProxy](Proxy_Representations_MoleculeRepresentationProxy.html)</li>
<li>[SkyboxRepresentationProxy](Proxy_Representations_SkyboxRepresentationProxy.html)</li>
<li>[SliceRepresentationProxy](Proxy_Representations_SliceRepresentationProxy.html)</li>
<li>[SlicedGeometryRepresentationProxy](Proxy_Representations_SlicedGeometryRepresentationProxy.html)</li>
<li>[VolumeRepresentationProxy](Proxy_Representations_VolumeRepresentationProxy.html)</li>
</ul>

</div>
<div class="category">__Rendering/Core__

<ul>
<li>[AbstractMapper](Rendering_Core_AbstractMapper.html)</li>
<li>[AbstractMapper3D](Rendering_Core_AbstractMapper3D.html)</li>
<li>[AbstractPicker](Rendering_Core_AbstractPicker.html)</li>
<li>[Actor](Rendering_Core_Actor.html)</li>
<li>[Actor2D](Rendering_Core_Actor2D.html)</li>
<li>[AnnotatedCubeActor](Rendering_Core_AnnotatedCubeActor.html)</li>
<li>[AxesActor](Rendering_Core_AxesActor.html)</li>
<li>[Camera](Rendering_Core_Camera.html)</li>
<li>[CellPicker](Rendering_Core_CellPicker.html)</li>
<li>[ColorTransferFunction](Rendering_Core_ColorTransferFunction.html)</li>
<li>[Coordinate](Rendering_Core_Coordinate.html)</li>
<li>[Glyph3DMapper](Rendering_Core_Glyph3DMapper.html)</li>
<li>[ImageMapper](Rendering_Core_ImageMapper.html)</li>
<li>[ImageProperty](Rendering_Core_ImageProperty.html)</li>
<li>[ImageSlice](Rendering_Core_ImageSlice.html)</li>
<li>[InteractorObserver](Rendering_Core_InteractorObserver.html)</li>
<li>[InteractorStyle](Rendering_Core_InteractorStyle.html)</li>
<li>[Light](Rendering_Core_Light.html)</li>
<li>[Mapper](Rendering_Core_Mapper.html)</li>
<li>[Picker](Rendering_Core_Picker.html)</li>
<li>[PixelSpaceCallbackMapper](Rendering_Core_PixelSpaceCallbackMapper.html)</li>
<li>[PointPicker](Rendering_Core_PointPicker.html)</li>
<li>[Prop](Rendering_Core_Prop.html)</li>
<li>[Prop3D](Rendering_Core_Prop3D.html)</li>
<li>[Property](Rendering_Core_Property.html)</li>
<li>[Property2D](Rendering_Core_Property2D.html)</li>
<li>[RenderWindow](Rendering_Core_RenderWindow.html)</li>
<li>[RenderWindowInteractor](Rendering_Core_RenderWindowInteractor.html)</li>
<li>[Renderer](Rendering_Core_Renderer.html)</li>
<li>[Representation](Rendering_Core_Representation.html)</li>
<li>[Skybox](Rendering_Core_Skybox.html)</li>
<li>[SphereMapper](Rendering_Core_SphereMapper.html)</li>
<li>[StickMapper](Rendering_Core_StickMapper.html)</li>
<li>[Texture](Rendering_Core_Texture.html)</li>
<li>[Viewport](Rendering_Core_Viewport.html)</li>
<li>[Volume](Rendering_Core_Volume.html)</li>
<li>[VolumeMapper](Rendering_Core_VolumeMapper.html)</li>
<li>[VolumeProperty](Rendering_Core_VolumeProperty.html)</li>
</ul>

</div>
<div class="category">__Rendering/Misc__

<ul>
<li>[FullScreenRenderWindow](Rendering_Misc_FullScreenRenderWindow.html)</li>
<li>[GenericRenderWindow](Rendering_Misc_GenericRenderWindow.html)</li>
<li>[RenderWindowWithControlBar](Rendering_Misc_RenderWindowWithControlBar.html)</li>
<li>[SynchronizableRenderWindow](Rendering_Misc_SynchronizableRenderWindow.html)</li>
</ul>

</div>
<div class="category">__Rendering/OpenGL__

<ul>
<li>[Actor](Rendering_OpenGL_Actor.html)</li>
<li>[Actor2D](Rendering_OpenGL_Actor2D.html)</li>
<li>[BufferObject](Rendering_OpenGL_BufferObject.html)</li>
<li>[Camera](Rendering_OpenGL_Camera.html)</li>
<li>[CellArrayBufferObject](Rendering_OpenGL_CellArrayBufferObject.html)</li>
<li>[ForwardPass](Rendering_OpenGL_ForwardPass.html)</li>
<li>[Framebuffer](Rendering_OpenGL_Framebuffer.html)</li>
<li>[Glyph3DMapper](Rendering_OpenGL_Glyph3DMapper.html)</li>
<li>[HardwareSelector](Rendering_OpenGL_HardwareSelector.html)</li>
<li>[Helper](Rendering_OpenGL_Helper.html)</li>
<li>[ImageMapper](Rendering_OpenGL_ImageMapper.html)</li>
<li>[ImageSlice](Rendering_OpenGL_ImageSlice.html)</li>
<li>[PixelSpaceCallbackMapper](Rendering_OpenGL_PixelSpaceCallbackMapper.html)</li>
<li>[PolyDataMapper](Rendering_OpenGL_PolyDataMapper.html)</li>
<li>[RadialDistortionPass](Rendering_OpenGL_RadialDistortionPass.html)</li>
<li>[RenderWindow](Rendering_OpenGL_RenderWindow.html)</li>
<li>[Renderer](Rendering_OpenGL_Renderer.html)</li>
<li>[Shader](Rendering_OpenGL_Shader.html)</li>
<li>[ShaderCache](Rendering_OpenGL_ShaderCache.html)</li>
<li>[ShaderProgram](Rendering_OpenGL_ShaderProgram.html)</li>
<li>[Skybox](Rendering_OpenGL_Skybox.html)</li>
<li>[SphereMapper](Rendering_OpenGL_SphereMapper.html)</li>
<li>[StickMapper](Rendering_OpenGL_StickMapper.html)</li>
<li>[Texture](Rendering_OpenGL_Texture.html)</li>
<li>[TextureUnitManager](Rendering_OpenGL_TextureUnitManager.html)</li>
<li>[VertexArrayObject](Rendering_OpenGL_VertexArrayObject.html)</li>
<li>[ViewNodeFactory](Rendering_OpenGL_ViewNodeFactory.html)</li>
<li>[Volume](Rendering_OpenGL_Volume.html)</li>
<li>[VolumeMapper](Rendering_OpenGL_VolumeMapper.html)</li>
</ul>

</div>
<div class="category">__Rendering/SceneGraph__

<ul>
<li>[GenericWidgetRepresentation](Rendering_SceneGraph_GenericWidgetRepresentation.html)</li>
<li>[RenderPass](Rendering_SceneGraph_RenderPass.html)</li>
<li>[ViewNode](Rendering_SceneGraph_ViewNode.html)</li>
<li>[ViewNodeFactory](Rendering_SceneGraph_ViewNodeFactory.html)</li>
</ul>

</div>
</div>

<!--
Some of the vtk.js classes may be missing a dedicated API guide and only its source code may be presented as a reference. A good starting point is to look at the `DEFAULT_VALUES` section which will quickly list the set of properties the class is using along with their initial value. Usually those properties will have a setter and a getter associated to them. Custom/add-on methods will looks like `publicAPI.methodName = [...]` while the generated methods will be in the `export function extend(publicAPI, model, initialValues = {})` function prefixed with `macro.[name]` like `macro.obj()`, `macro.algo()`, `macro.event()`... 
-->

[Book]: ./books_VTK_guide.png

