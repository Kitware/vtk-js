import 'vtk.js/Sources/favicon';

import Actor from '..';

const test = (condition, message) => {
  if (!condition) {
    vtkErrorMacro(`ERROR: ${message}`);
  }
};
const zip = (rows) => rows[0].map((_, c) => rows.map((row) => row[c]));
const arraysEqual = (aa, bb) =>
  aa.length === bb.length &&
  zip([aa, bb]).reduce((a, b) => a && b[0] === b[1], true);

// Create actor instance
const actor = Actor.newInstance();

vtkDebugMacro(`visibility ${actor.getVisibility()}`);
vtkDebugmacro(`mapper ${actor.getMapper()}`);
vtkDebugMacro(`property ${actor.getProperty()}`);

test(actor.getProperty() !== null, 'Actor should create a default property.');
test(actor.getMapper() === null, 'Actor should not have a default mapper.');
test(actor.getVisibility(), 'Actor should be visible by default.');
test(
  arraysEqual(actor.getBounds(), [1, -1, 1, -1, 1, -1]),
  'Actor bounds should be invalid when there is no mapper.'
);

actor.setVisibility(!actor.getVisibility());
vtkDebugMacro(`visibility ${actor.getVisibility()}`);
test(!actor.getVisibility(), 'Actor visibility could not be modified.');

// Uncomment to debug in browser:
// window.actor = actor;
