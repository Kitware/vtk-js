The hardware selector works by rendering the current scene using multiple passes in a special way where each pass stores information into the color buffer. Once this is done the color buffer for these passes can be quickly queried to retrieve information such as prop, prop id, composite id, process id, etc depending on what passes were captured. We do not always capture every pass, for example on a single process run there is no need to capture a process id pass.

Once the buffers are captured you can then call generateSelection to get the results for a specific x,y, area. Here are two examples of making a selection

```
const hws = vtkOpenGLHardwareSelector.newInstance();
hws.attach(myOpenGLRenWin, renderer);
hws.setArea(...);
const selection = hwl.select();
```

select() will capture the bufferes needed and then call generateSelection() on the area specified in setArea.  If you want to perform multiple selections and you know your image is not changing, then you can capture the buffers once and then make multiple generateSelection calls for example

```
const hws = vtkOpenGLHardwareSelector.newInstance();
hws.attach(myOpenGLRenWin, renderer);
hws.setArea(0, 0, winSizeX, winSizeY);
if (hws.captureBuffers()) {
  while (...) {
    // do a bunch of selections
    const selection = hwl.generateSelection(x,y,x2,y2);
    // do something with it
  }
  // all done, free up the captured buffers
  hws.releasePixBuffers();
}
```
