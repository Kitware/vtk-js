## Piecewise Gaussian Widget

The widget can be used with either a mouse or a touch device. The interaction is as follow:

__With a mouse:__

- Double click: 
  - create a gaussian at that given position and height with no bias.
- Click: 
  - On a gaussian, that will active it so if you click on the (-) button, that will be the one removed.
  - On a button: perform the action of the button (add or remove a selected gaussian).
- Right click
  - delete the gaussian underneath.
- Drag: 
  - Bottom of a gaussian will adjust the width. From left to right will increase the width. 
  - Middle of the gaussian will adjust the biais (x and y).
  - Top of the gaussian will adjust height.
  - Anywhere else will adjust its position.

__With touch:__

- Double Tap:
  - One finger: create a gaussian at that given position and height with no bias.
  - Two fingers: delete the gaussian underneath.
- Single Tap:
  - On a gaussian, that will active it so if you click on the (-) button, that will be the one removed.
  - On a button: perform the action of the button (add or remove a selected gaussian).
- Drag: 
  - Bottom of a gaussian will adjust the width. From left to right will increase the width. 
  - Middle of the gaussian will adjust the biais (x and y).
  - Top of the gaussian will adjust height.
  - Anywhere else will adjust its position.

## Just for that example

You can stop the looping through the color presets by clicking on the preset name.
Moreover, clicking on the left side of that name will pick the previous preset while clicking on the right side of that name will move to the next one.

That logic was implemented in that example by the following set of code lines.

```
function changePreset(delta = 1) {
  presetIndex = (presetIndex + delta + presets.length) % presets.length;
  lookupTable.applyColorMap(presets[presetIndex]);
  lookupTable.setMappingRange(...globalDataRange);
  lookupTable.updateRange();
  labelContainer.innerHTML = presets[presetIndex].Name;
}

let intervalID = null;
function stopInterval() {
  if (intervalID !== null) {
    clearInterval(intervalID);
    intervalID = null;
  }
}

labelContainer.addEventListener('click', (event) => {
  if (event.pageX < 200) {
    stopInterval();
    changePreset(-1);
  } else {
    stopInterval();
    changePreset(1);
  }
});
```
