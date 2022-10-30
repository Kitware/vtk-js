import vtk;
dims = [10, 10, 10];
s = 0.1;
imageData = vtk.vtkImageData()
imageData.SetDimensions(dims[0], dims[1], dims[2]);
imageData.SetSpacing(s, s, s);
imageData.AllocateScalars(vtk.VTK_UNSIGNED_CHAR, 1);
for z in range(dims[2]):
    for y in range(dims[1]):
        for x in range(dims[0]):
            imageData.SetScalarComponentFromDouble(x, y, z, 0, 256 * ((z * dims[0] * dims[1] + y * dims[0] + x) % (dims[0] * dims[1])) / (dims[0] * dims[1]));

axes = vtk.vtkTransform();
# axes.RotateZ(45);
reslice = vtk.vtkImageReslice();
reslice.SetOutputDimensionality(2);
reslice.SetInputData(imageData);
reslice.SetResliceAxes(axes.GetMatrix());
reslice.SetInterpolationModeToNearestNeighbor();
reslice.BorderOn();
reslice.SetOutputScalarType(vtk.VTK_UNSIGNED_SHORT);
reslice.SetScalarScale(65535 / 255);
reslice.SetAutoCropOutput(1);
# reslice.SetOutputOrigin(dims[0] * s/2, dims[1] * s/2, dims[2] *s/2);

mapper = vtk.vtkImageSliceMapper();
# mapper.SetInputData(imageData);
mapper.SetInputConnection(reslice.GetOutputPort());
actor = vtk.vtkImageActor();
actor.SetMapper(mapper);
actor.GetProperty().SetInterpolationTypeToNearest();


ip = actor.GetProperty();
ip.SetColorLevel(65535/2);
ip.SetColorWindow(65535);

renderer = vtk.vtkRenderer();
renderer.AddActor(actor);
renderer.SetBackground(0.32, 0.34, 0.43);

vm = vtk.vtkSmartVolumeMapper();
vm.SetBlendModeToComposite();
vm.SetInputData(imageData);
#vm.SetInputConnection(reslice.GetOutputPort());

volumeProperty = vtk.vtkVolumeProperty();
volumeProperty.ShadeOff();

compositeOpacity = vtk.vtkPiecewiseFunction();
compositeOpacity.AddPoint(255.0,0.0);
compositeOpacity.AddPoint(255.0,1.0);
volumeProperty.SetScalarOpacity(compositeOpacity);

color = vtk.vtkColorTransferFunction();
color.AddRGBPoint(0.0,  0.0,0.0,0.0);
color.AddRGBPoint(255.0,1.0,1.0,1.0);
volumeProperty.SetColor(color);

volume = vtk.vtkVolume();
volume.SetMapper(vm);
volume.SetProperty(volumeProperty);
actor.SetUserTransform(axes);

# volume.SetUserTransform(axes);
# renderer.AddViewProp(volume);

renderWindow = vtk.vtkRenderWindow();
renderWindow.SetSize(400,400);
renderWindow.AddRenderer(renderer);

renderWindowInteractor = vtk.vtkRenderWindowInteractor();
renderWindowInteractor.SetRenderWindow(renderWindow);
renderWindowInteractor.Initialize();
renderWindowInteractor.Start();