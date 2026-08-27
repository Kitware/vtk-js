export interface ICoincidentTopology {
  factor: number;
  offset: number;
}

export enum Resolve {
  Off,
  PolygonOffset,
}

export const CATEGORIES: string[];

export interface StaticOffsetAPI {
  /**
   *
   */
  modified(): void;

  /**
   *
   * @param {ICoincidentTopology} params
   */
  setResolveCoincidentTopologyPolygonOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {ICoincidentTopology} params
   */
  setResolveCoincidentTopologyLineOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {ICoincidentTopology} params
   */
  setResolveCoincidentTopologyPointOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setResolveCoincidentTopologyPolygonOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setResolveCoincidentTopologyLineOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setResolveCoincidentTopologyPointOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   */
  getResolveCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyPointOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;
}

export interface OtherStaticMethods {
  Resolve: typeof Resolve;

  /**
   *
   */
  getResolveCoincidentTopologyPolygonOffsetFaces(): Resolve;

  /**
   *
   * @param {Number} value
   */
  setResolveCoincidentTopologyPolygonOffsetFaces(value: Resolve): boolean;

  /**
   *
   * @param mode
   */
  setResolveCoincidentTopology(mode?: Resolve): boolean;

  /**
   *
   */
  getResolveCoincidentTopology(): Resolve;

  /**
   *
   */
  setResolveCoincidentTopologyToDefault(): boolean;

  /**
   *
   */
  setResolveCoincidentTopologyToOff(): boolean;

  /**
   *
   */
  setResolveCoincidentTopologyToPolygonOffset(): boolean;

  /**
   *
   */
  getResolveCoincidentTopologyAsString(): string;
}

export interface StaticCoincidentTopologyMethods
  extends StaticOffsetAPI, OtherStaticMethods {}

export interface CoincidentTopologyHelper extends StaticCoincidentTopologyMethods {
  /**
   *
   * @param {ICoincidentTopology} params
   */
  setRelativeCoincidentTopologyLineOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {ICoincidentTopology} params
   */
  setRelativeCoincidentTopologyPointOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {ICoincidentTopology} params
   */
  setRelativeCoincidentTopologyPolygonOffsetParameters(
    params: ICoincidentTopology
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyLineOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyPointOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyPolygonOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   */
  getRelativeCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getRelativeCoincidentTopologyPointOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getRelativeCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getCoincidentTopologyPointOffsetParameter(): ICoincidentTopology;
}

declare const vtkCoincidentTopologyHelper: {
  /**
   * Method used to decorate a given object (publicAPI+model) with coincident
   * topology methods.
   *
   * @param publicAPI object on which methods will be bounds (public)
   * @param model object on which data structure will be bounds (protected)
   */
  implementCoincidentTopologyMethods(publicAPI: object, model: object): void;
  staticOffsetAPI: StaticOffsetAPI;
  otherStaticMethods: OtherStaticMethods;
  CATEGORIES: string[];
  Resolve: typeof Resolve;
};
export default vtkCoincidentTopologyHelper;
