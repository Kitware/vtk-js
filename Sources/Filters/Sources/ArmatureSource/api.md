# vtkArmatureSource

## Overview
Debug filter that generates a 3D visualization of a skeleton. Renders bones as cylinders and joints as spheres.

## Usage

```javascript
import vtkArmatureSource from 'vtk.js/Sources/Filters/Sources/ArmatureSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

const armatureSource = vtkArmatureSource.newInstance();
skeletonSource.setSkeleton(skeleton);
skeletonSource.setBoneRadius(0.1);
skeletonSource.setJointRadius(0.15);

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(skeletonSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setColor(0.8, 0.8, 0.8);

renderer.addActor(actor);
```

## Visualization
- **Joints (Bones)**: Spheres at each bone position
- **Bones (Connections)**: Cylinders connecting parent to child bones
- **Color**: White by default; customize with actor property

## Performance
Suitable for real-time skeleton visualization (few hundred bones). For complex rigs, consider reducing update frequency.
