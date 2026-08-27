export declare const ProjectionMode: {
  readonly MAX: 0;
  readonly MIN: 1;
  readonly AVERAGE: 2;
};

export type ProjectionMode =
  (typeof ProjectionMode)[keyof typeof ProjectionMode];

declare const _default: {
  ProjectionMode: typeof ProjectionMode;
};
export default _default;
