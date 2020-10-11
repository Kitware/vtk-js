export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  extend: typeof extend_1;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_5;
  Presets: any;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T107 {
  newInstance: any;
  extend: typeof extend_6;
}
declare function extend_7(publicAPI: any, model: any, initialValues?: T100): void;
export interface T108 {
  newInstance: any;
  extend: typeof extend_7;
}
export interface T109 {
  planeId: number;
  t1: number;
  t2: number;
  intersect: number;
}
declare function clipLineWithPlane(mapper: any, matrix: any, p1: any, p2: any): number | T109;
declare function extend_8(publicAPI: any, model: any, initialValues?: T100): void;
export interface T110 {
  clipLineWithPlane: typeof clipLineWithPlane;
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T100): void;
export interface T113 {
  newInstance: any;
  extend: typeof extend_11;
}
declare function computeWorldToDisplay(renderer: any, x: any, y: any, z: any): any;
declare function computeDisplayToWorld(renderer: any, x: any, y: any, z: any): any;
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T114 {
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T100): void;
export interface T115 {
  newInstance: any;
  extend: typeof extend_13;
  LIGHT_TYPES: string[];
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T100): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function extend_15(publicAPI: any, model: any, initialValues?: T100): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_15;
}
declare function extend_16(publicAPI: any, model: any, initialValues?: T100): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_16;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T100): void;
export interface T119 {
  newInstance: any;
  extend: typeof extend_17;
}
declare function extend_18(publicAPI: any, model: any, initialValues?: T100): void;
export interface T120 {
  newInstance: any;
  extend: typeof extend_18;
}
declare function extend_19(publicAPI: any, model: any, initialValues?: T100): void;
export interface T121 {
  newInstance: any;
  extend: typeof extend_19;
}
declare function extend_20(publicAPI: any, model: any, initialValues?: T100): void;
export interface T122 {
  newInstance: any;
  extend: typeof extend_20;
}
declare function extend_21(publicAPI: any, model: any, initialValues?: T100): void;
export interface T123 {
  newInstance: any;
  extend: typeof extend_21;
}
declare function extend_22(publicAPI: any, model: any, initialValues?: T100): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_22;
}
declare function extend_23(publicAPI: any, model: any, initialValues?: T100): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_23;
}
declare function extend_24(publicAPI: any, model: any, initialValues?: T100): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_24;
}
declare function extend_25(publicAPI: any, model: any, initialValues?: T100): void;
export interface T127 {
  newInstance: any;
  extend: typeof extend_25;
}
declare function extend_26(publicAPI: any, model: any, initialValues?: T100): void;
export interface T128 {
  newInstance: any;
  extend: typeof extend_26;
}
declare function extend_27(publicAPI: any, model: any, initialValues?: T100): void;
export interface T129 {
  newInstance: any;
  extend: typeof extend_27;
}
declare function extend_28(publicAPI: any, model: any, initialValues?: T100): void;
export interface T130 {
  newInstance: any;
  extend: typeof extend_28;
}
export interface T131 {
  vtkAbstractMapper: T101;
  vtkAbstractMapper3D: T102;
  vtkAbstractPicker: T103;
  vtkActor: T104;
  vtkActor2D: T105;
  vtkAnnotatedCubeActor: T106;
  vtkAxesActor: T107;
  vtkCamera: T108;
  vtkCellPicker: T110;
  vtkColorTransferFunction: any;
  vtkCoordinate: any;
  vtkFollower: T111;
  vtkGlyph3DMapper: any;
  vtkImageMapper: any;
  vtkImageProperty: T112;
  vtkImageSlice: T113;
  vtkInteractorObserver: T114;
  vtkInteractorStyle: any;
  vtkLight: T115;
  vtkMapper: any;
  vtkPicker: T116;
  vtkPixelSpaceCallbackMapper: T117;
  vtkPointPicker: T118;
  vtkProp: T119;
  vtkProp3D: T120;
  vtkProperty: any;
  vtkProperty2D: T121;
  vtkRenderer: T122;
  vtkRenderWindow: T123;
  vtkRenderWindowInteractor: any;
  vtkSkybox: T124;
  vtkSphereMapper: T125;
  vtkStickMapper: T126;
  vtkTexture: T127;
  vtkViewport: T128;
  vtkVolume: T129;
  vtkVolumeMapper: T130;
  vtkVolumeProperty: any;
}
declare function extend_29(publicAPI: any, model: any, initialValues?: T100): void;
export interface T132 {
  newInstance: any;
  extend: typeof extend_29;
}
declare function extend_30(publicAPI: any, model: any, initialValues?: T100): void;
export interface T133 {
  newInstance: any;
  extend: typeof extend_30;
}
declare function extend_31(publicAPI: any, model: any, initialValues?: T100): void;
export interface T134 {
  newInstance: any;
  extend: typeof extend_31;
}
declare function extend_32(publicAPI: any, model: any, initialValues?: T100): void;
export interface T135 {
  newInstance: any;
  extend: typeof extend_32;
  SHARED_IMAGE_STREAM: any;
  connectImageStream: any;
  disconnectImageStream: any;
}
declare function extend_33(publicAPI: any, model: any, initialValues?: T100): void;
export interface T136 {
  newInstance: any;
  extend: typeof extend_33;
}
declare function extend_34(publicAPI: any, model: any, initialValues?: T100): void;
declare function getSynchronizerContext(name?: string): any;
declare function setSynchronizerContext(name: any, ctx: any): void;
declare function decorate(renderWindow: any, name?: string): any;
export interface T137 {
  getInstance: (id: any) => any;
  getInstanceId: (instance: any) => any;
  registerInstance: (id: any, instance: any) => void;
  unregisterInstance: (id: any) => void;
  emptyCachedInstances: () => void;
}
declare function createInstanceMap(): T137;
export interface T138 {
  setFetchArrayFunction: (fetcher: any) => void;
  getArray: (sha: any, dataType: any, context: any) => Promise<any>;
  emptyCachedArrays: () => void;
  freeOldArrays: (threshold: any, context: any) => void;
}
declare function createArrayHandler(): T138;
export interface T139 {
  start(): void;
  end(): void;
  resetProgress(): void;
}
declare function createProgressHandler(): T139;
export interface T140 {
  getMTime: (viewId: any) => any;
  incrementMTime: (viewId: any) => void;
  setActiveViewId: (viewId: any) => void;
  getActiveViewId: () => string;
}
declare function createSceneMtimeHandler(): T140;
declare function build(type: any, initialProps?: T100): any;
declare function update(type: any, instance: any, props: any, context: any): void;
declare function genericUpdater(instance: any, state: any, context: any): void;
declare function oneTimeGenericUpdater(instance: any, state: any, context: any): void;
declare function setTypeMapping(type: any, buildFn?: any, updateFn?: typeof genericUpdater): void;
declare function clearTypeMapping(): void;
declare function getSupportedTypes(): string[];
declare function clearOneTimeUpdaters(...ids: any[]): void | any[];
declare function updateRenderWindow(instance: any, props: any, context: any): void;
declare function excludeInstance(type: any, propertyName: any, propertyValue: any): void;
declare function setDefaultMapping(reset?: boolean): void;
declare function applyDefaultAliases(): void;
declare function alwaysUpdateCamera(): void;
export interface T141 {
  build: typeof build;
  update: typeof update;
  genericUpdater: typeof genericUpdater;
  oneTimeGenericUpdater: typeof oneTimeGenericUpdater;
  setTypeMapping: typeof setTypeMapping;
  clearTypeMapping: typeof clearTypeMapping;
  getSupportedTypes: typeof getSupportedTypes;
  clearOneTimeUpdaters: typeof clearOneTimeUpdaters;
  updateRenderWindow: typeof updateRenderWindow;
  excludeInstance: typeof excludeInstance;
  setDefaultMapping: typeof setDefaultMapping;
  applyDefaultAliases: typeof applyDefaultAliases;
  alwaysUpdateCamera: typeof alwaysUpdateCamera;
}
export interface T142 {
  newInstance: any;
  extend: typeof extend_34;
  getSynchronizerContext: typeof getSynchronizerContext;
  setSynchronizerContext: typeof setSynchronizerContext;
  decorate: typeof decorate;
  createInstanceMap: typeof createInstanceMap;
  createArrayHandler: typeof createArrayHandler;
  createProgressHandler: typeof createProgressHandler;
  createSceneMtimeHandler: typeof createSceneMtimeHandler;
  vtkObjectManager: T141;
}
declare function extend_35(publicAPI: any, model: any, initialValues?: T100): void;
export interface T143 {
  newInstance: any;
  extend: typeof extend_35;
}
export interface T144 {
  vtkCanvasView: T132;
  vtkFullScreenRenderWindow: T133;
  vtkGenericRenderWindow: T134;
  vtkRemoteView: T135;
  vtkRenderWindowWithControlBar: T136;
  vtkSynchronizableRenderWindow: T142;
  vtkTextureLODsDownloader: T143;
}
declare function extend_36(publicAPI: any, model: any, initialValues?: T100): void;
export interface T145 {
  newInstance: any;
  extend: typeof extend_36;
}
declare function extend_37(publicAPI: any, model: any, initialValues?: T100): void;
export interface T146 {
  newInstance: any;
  extend: typeof extend_37;
}
declare function extend_38(publicAPI: any, model: any, initialValues?: T100): void;
export interface T147 {
  newInstance: any;
  extend: typeof extend_38;
}
declare function extend_39(publicAPI: any, model: any, initialValues?: T100): void;
export interface T148 {
  newInstance: any;
  extend: typeof extend_39;
}
declare function extend_40(publicAPI: any, model: any, initialValues?: T100): void;
export interface T149 {
  newInstance: any;
  extend: typeof extend_40;
}
declare function extend_41(publicAPI: any, model: any, initialValues?: T100): void;
export interface T150 {
  newInstance: any;
  extend: typeof extend_41;
}
declare function extend_42(publicAPI: any, model: any, initialValues?: T100): void;
export interface T151 {
  newInstance: any;
  extend: typeof extend_42;
}
declare function extend_43(publicAPI: any, model: any, initialValues?: T100): void;
export interface T152 {
  newInstance: any;
  extend: typeof extend_43;
}
declare function extend_44(publicAPI: any, model: any, initialValues?: T100): void;
export interface T153 {
  newInstance: any;
  extend: typeof extend_44;
}
declare function extend_45(publicAPI: any, model: any, initialValues?: T100): void;
export interface T154 {
  newInstance: any;
  extend: typeof extend_45;
}
declare function extend_46(publicAPI: any, model: any, initialValues?: T100): void;
export interface T155 {
  newInstance: any;
  extend: typeof extend_46;
}
declare function extend_47(publicAPI: any, model: any, initialValues?: T100): void;
export interface T156 {
  newInstance: any;
  extend: typeof extend_47;
}
declare function extend_48(publicAPI: any, model: any, initialValues?: T100): void;
export interface T157 {
  newInstance: any;
  extend: typeof extend_48;
}
declare function extend_49(publicAPI: any, model: any, initialValues?: T100): void;
declare function pushMonitorGLContextCount(cb: any): void;
declare function popMonitorGLContextCount(cb: any): any;
export interface T158 {
  newInstance: any;
  extend: typeof extend_49;
  pushMonitorGLContextCount: typeof pushMonitorGLContextCount;
  popMonitorGLContextCount: typeof popMonitorGLContextCount;
}
declare function extend_50(publicAPI: any, model: any, initialValues?: T100): void;
export interface T159 {
  newInstance: any;
  extend: typeof extend_50;
}
declare function extend_51(publicAPI: any, model: any, initialValues?: T100): any;
export interface T160 {
  newInstance: any;
  extend: typeof extend_51;
}
declare function extend_52(publicAPI: any, model: any, initialValues?: T100): void;
export interface T161 {
  replace: boolean;
  result: any;
}
declare function substitute(source: any, search: any, replace: any, all?: boolean): T161;
export interface T162 {
  newInstance: any;
  extend: typeof extend_52;
  substitute: typeof substitute;
}
declare function extend_53(publicAPI: any, model: any, initialValues?: T100): void;
export interface T163 {
  newInstance: any;
  extend: typeof extend_53;
}
declare function extend_54(publicAPI: any, model: any, initialValues?: T100): void;
export interface T164 {
  newInstance: any;
  extend: typeof extend_54;
}
declare function extend_55(publicAPI: any, model: any, initialValues?: T100): void;
export interface T165 {
  newInstance: any;
  extend: typeof extend_55;
}
declare function extend_56(publicAPI: any, model: any, initialValues?: T100): void;
export interface T166 {
  newInstance: any;
  extend: typeof extend_56;
}
declare function extend_57(publicAPI: any, model: any, initialValues?: T100): void;
export interface T167 {
  newInstance: any;
  extend: typeof extend_57;
}
declare function extend_58(publicAPI: any, model: any, initialValues?: T100): void;
export interface T168 {
  newInstance: any;
  extend: typeof extend_58;
}
declare function extend_59(publicAPI: any, model: any, initialValues?: T100): void;
export interface T169 {
  newInstance: any;
  extend: typeof extend_59;
}
declare function extend_60(publicAPI: any, model: any, initialValues?: T100): void;
export interface T170 {
  newInstance: any;
  extend: typeof extend_60;
}
export interface T171 {
  vtkActor: T145;
  vtkActor2D: T146;
  vtkBufferObject: any;
  vtkCamera: T147;
  vtkCellArrayBufferObject: T148;
  vtkConvolution2DPass: T149;
  vtkFramebuffer: T150;
  vtkGlyph3DMapper: T151;
  vtkHardwareSelector: any;
  vtkHelper: T152;
  vtkImageMapper: T153;
  vtkImageSlice: T154;
  vtkPixelSpaceCallbackMapper: T155;
  vtkPolyDataMapper: T156;
  vtkRenderer: T157;
  vtkRenderWindow: T158;
  vtkShader: T159;
  vtkShaderCache: T160;
  vtkShaderProgram: T162;
  vtkSkybox: T163;
  vtkSphereMapper: T164;
  vtkStickMapper: T165;
  vtkTexture: any;
  vtkTextureUnitManager: T166;
  vtkVertexArrayObject: T167;
  vtkViewNodeFactory: T168;
  vtkVolume: T169;
  vtkVolumeMapper: T170;
}
declare function extend_61(publicAPI: any, model: any, initialValues?: T100): void;
export interface T172 {
  newInstance: any;
  extend: typeof extend_61;
}
declare function extend_62(publicAPI: any, model: any, initialValues?: T100): void;
export interface T173 {
  newInstance: any;
  extend: typeof extend_62;
}
declare function extend_63(publicAPI: any, model: any, initialValues?: T100): void;
export interface T174 {
  newInstance: any;
  extend: typeof extend_63;
  PASS_TYPES: string[];
}
declare function extend_64(publicAPI: any, model: any, initialValues?: T100): void;
export interface T175 {
  newInstance: any;
  extend: typeof extend_64;
}
export interface T176 {
  vtkGenericWidgetRepresentation: T172;
  vtkRenderPass: T173;
  vtkViewNode: T174;
  vtkViewNodeFactory: T175;
}
export interface T177 {
  Core: T131;
  Misc: T144;
  OpenGL: T171;
  SceneGraph: T176;
}
declare const T178: T177;
export default T178;
