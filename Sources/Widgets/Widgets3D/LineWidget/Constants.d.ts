export declare const ShapeType: {
  /**
   * A sphere handle that is always invisible, even on mouseover, which
   * prevents the user from moving the handle once it is placed.
   */
  readonly NONE: 'voidSphere';
  readonly SPHERE: 'sphere';
  readonly CUBE: 'cube';
  readonly CONE: 'cone';
  readonly ARROWHEAD3: 'triangle';
  readonly ARROWHEAD4: '4pointsArrowHead';
  readonly ARROWHEAD6: '6pointsArrowHead';
  readonly STAR: 'star';
  readonly DISK: 'disk';
  readonly CIRCLE: 'circle';
  readonly VIEWFINDER: 'viewFinder';
};

export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

export declare const Shapes2D: ShapeType[];

export declare const Shapes3D: ShapeType[];

export declare const ShapesOrientable: ShapeType[];

declare const _default: {
  ShapeType: typeof ShapeType;
  Shapes2D: typeof Shapes2D;
  Shapes3D: typeof Shapes3D;
  ShapesOrientable: typeof ShapesOrientable;
};

export default _default;
