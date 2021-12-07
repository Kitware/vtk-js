// Bundle size management - start
import vtkColorMaps from './ColorTransferFunction/ColorMaps';
// Bundle size management - end

import vtkAbstractMapper from './AbstractMapper';
import vtkAbstractMapper3D from './AbstractMapper3D';
import vtkAbstractPicker from './AbstractPicker';
import vtkActor from './Actor';
import vtkActor2D from './Actor2D';
import vtkAnnotatedCubeActor from './AnnotatedCubeActor';
import vtkAxesActor from './AxesActor';
import vtkCamera from './Camera';
import vtkCellPicker from './CellPicker';
import vtkColorTransferFunction from './ColorTransferFunction';
import vtkCoordinate from './Coordinate';
import vtkCubeAxesActor from './CubeAxesActor';
import vtkFollower from './Follower';
import vtkGlyph3DMapper from './Glyph3DMapper';
import vtkHardwareSelector from './HardwareSelector';
import vtkImageMapper from './ImageMapper';
import vtkImageProperty from './ImageProperty';
import vtkImageSlice from './ImageSlice';
import vtkInteractorObserver from './InteractorObserver';
import vtkInteractorStyle from './InteractorStyle';
import vtkLight from './Light';
import vtkMapper from './Mapper';
import vtkMapper2D from './Mapper2D';
import vtkPicker from './Picker';
import vtkPixelSpaceCallbackMapper from './PixelSpaceCallbackMapper';
import vtkPointPicker from './PointPicker';
import vtkProp from './Prop';
import vtkProp3D from './Prop3D';
import vtkProperty from './Property';
import vtkProperty2D from './Property2D';
import vtkRenderer from './Renderer';
import vtkRenderWindow from './RenderWindow';
import vtkRenderWindowInteractor from './RenderWindowInteractor';
import vtkScalarBarActor from './ScalarBarActor';
import vtkSkybox from './Skybox';
import vtkSphereMapper from './SphereMapper';
import vtkStickMapper from './StickMapper';
import vtkTexture from './Texture';
import vtkViewport from './Viewport';
import vtkVolume from './Volume';
import vtkVolumeMapper from './VolumeMapper';
import vtkVolumeProperty from './VolumeProperty';

export default {
  vtkAbstractMapper,
  vtkAbstractMapper3D,
  vtkAbstractPicker,
  vtkActor,
  vtkActor2D,
  vtkAnnotatedCubeActor,
  vtkAxesActor,
  vtkCamera,
  vtkCellPicker,
  vtkColorTransferFunction: { vtkColorMaps, ...vtkColorTransferFunction },
  vtkCoordinate,
  vtkCubeAxesActor,
  vtkFollower,
  vtkGlyph3DMapper,
  vtkHardwareSelector,
  vtkImageMapper,
  vtkImageProperty,
  vtkImageSlice,
  vtkInteractorObserver,
  vtkInteractorStyle,
  vtkLight,
  vtkMapper,
  vtkMapper2D,
  vtkPicker,
  vtkPixelSpaceCallbackMapper,
  vtkPointPicker,
  vtkProp,
  vtkProp3D,
  vtkProperty,
  vtkProperty2D,
  vtkRenderer,
  vtkRenderWindow,
  vtkRenderWindowInteractor,
  vtkScalarBarActor,
  vtkSkybox,
  vtkSphereMapper,
  vtkStickMapper,
  vtkTexture,
  vtkViewport,
  vtkVolume,
  vtkVolumeMapper,
  vtkVolumeProperty,
};
