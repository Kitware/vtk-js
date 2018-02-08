const STYLES = {
  default: {
    defaultStyle: {
      fontStyle: 'bold',
      fontFamily: 'Arial',
      fontColor: 'black',
      fontSizeScale: (res) => res / 2,
      faceColor: 'white',
      edgeThickness: 0.1,
      edgeColor: 'black',
      resolution: 400,
    },
    xMinusFaceProperty: {
      text: 'X-',
      faceColor: 'yellow',
    },
    xPlusFaceProperty: {
      text: 'X+',
      faceColor: 'yellow',
    },
    yMinusFaceProperty: {
      text: 'Y-',
      faceColor: 'red',
    },
    yPlusFaceProperty: {
      text: 'Y+',
      faceColor: 'red',
    },
    zMinusFaceProperty: {
      text: 'Z-',
      faceColor: '#008000',
    },
    zPlusFaceProperty: {
      text: 'Z+',
      faceColor: '#008000',
    },
  },
};

function applyDefinitions(definitions, cubeActor) {
  cubeActor.set(definitions);
}

function applyPreset(name, cubeActor) {
  return applyDefinitions(STYLES[name], cubeActor);
}

function registerStylePreset(name, definitions) {
  STYLES[name] = definitions;
}

export default {
  applyDefinitions,
  applyPreset,
  registerStylePreset,
};
