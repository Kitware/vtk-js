import ConeSource from '..';

// Create cone source instance
const coneSource = ConeSource.newInstance({ height: 2.0 });

let subscription = coneSource.onModified(s => {
  console.log('source modified', s.getOutput().get('metadata').metadata.state);
});

console.log('height', coneSource.getHeight());
console.log('resolution', coneSource.getResolution());
console.log('radius', coneSource.getRadius());
console.log('center', coneSource.getCenter());

// Create dataset
console.log('Output (height:2)', coneSource.getOutput());

coneSource.setResolution(10);
coneSource.setResolution(20);

console.log('unsubscribe');
subscription.unsubscribe();
subscription = null;

coneSource.setResolution(30);
coneSource.setResolution(10);
console.log('resolution', coneSource.getResolution());
console.log('Output (resolution:10)', coneSource.getOutput());

window.ds = coneSource.getOutput();

// Delete source
coneSource.delete();

// Ask for dataset => should fail
console.log('after delete ------------');
console.log('output (delete)', coneSource.getOutput());
console.log('height (delete)', coneSource.getHeight());
console.log('resolution (delete)', coneSource.getResolution());
console.log('radius (delete)', coneSource.getRadius());
console.log('center (delete)', coneSource.getCenter());


