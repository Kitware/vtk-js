const Defaults = {
  Gaussians: [{ position: 0.5, height: 1, width: 0.5, xBias: 0.5, yBias: 0.5 }],
  Points: [[0, 0], [1, 1]],
  Nodes: [
    { x: 0, y: 0, midpoint: 0.5, sharpness: 0 },
    { x: 1, y: 1, midpoint: 0.5, sharpness: 0 },
  ],
};

const Mode = {
  Gaussians: 0,
  Points: 1,
  Nodes: 2,
};

export default {
  Defaults,
  Mode,
};
