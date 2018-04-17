const Mode = {
  Preset: 0,
  RGBPoints: 1,
  HSVPoints: 2,
  Nodes: 3,
};

const Defaults = {
  Preset: 'Cool to Warm',
  RGBPoints: [[0, 0, 0, 0], [1, 1, 1, 1]],
  HSVPoints: [[0, 0, 0, 0], [1, 0, 0, 1]],
  Nodes: [
    { x: 0, r: 0, g: 0, b: 0, midpoint: 0.5, sharpness: 0 },
    { x: 1, r: 1, g: 1, b: 1, midpoint: 0.5, sharpness: 0 },
  ],
};

export default {
  Defaults,
  Mode,
};
