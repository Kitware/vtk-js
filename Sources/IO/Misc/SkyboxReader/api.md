vtkSkyboxReader will read a zip file that should contain one or more camera position that would compose a skybox texture.
In order to let the skybox reader apply the correct mapping of the 6 textures to the skybox, you will have to either call `setFaceMapping` function with the proper arguments or embed inside your zip file a file named `index.json` which should contains the following structure:

```
{
  [...],
  skybox: {
    faceMapping: [
      { fileName: 'front.jpg', transform: { flipX: true } },
      { fileName: 'back.jpg', transform: { flipX: true } },
      { fileName: 'up.jpg', transform: { flipX: true, rotate: 90 } },
      { fileName: 'down.jpg', transform: { flipX: true, rotate: -90 } },
      { fileName: 'right.jpg', transform: { flipX: true } },
      { fileName: 'left.jpg', transform: { flipX: true } },
    ]
  }
  // or
  metadata: {
    skybox: {...}
  }
}
```

The transform can be omited if no transformation are required. The possible options are `flipX`, `flipY`, `rotation`.
