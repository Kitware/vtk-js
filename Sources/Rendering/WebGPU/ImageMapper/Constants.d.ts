export declare const TextureChannelMode: {
  readonly SINGLE: 'single';
  readonly DEPENDENT_LA: 'dependent-la';
  readonly DEPENDENT_RGB: 'dependent-rgb';
  readonly DEPENDENT_RGBA: 'dependent-rgba';
  readonly INDEPENDENT_1: 'independent-1';
  readonly INDEPENDENT_2: 'independent-2';
  readonly INDEPENDENT_3: 'independent-3';
  readonly INDEPENDENT_4: 'independent-4';
};

export type TextureChannelMode =
  (typeof TextureChannelMode)[keyof typeof TextureChannelMode];

export declare const TextureSlot: {
  readonly IMAGE: 0;
  readonly COLOR_LUT: 1;
  readonly OPACITY_LUT: 2;
  readonly LABEL_OUTLINE_THICKNESS: 3;
  readonly LABEL_OUTLINE_OPACITY: 4;
};

export type TextureSlot = (typeof TextureSlot)[keyof typeof TextureSlot];
