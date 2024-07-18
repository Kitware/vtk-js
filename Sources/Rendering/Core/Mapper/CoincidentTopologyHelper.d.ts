export interface ICoincidentTopology {
  factor: number;
  offset: number;
}

export enum Resolve {
  Off,
  PolygonOffset,
}

export interface StaticCoincidentTopologyMethods {
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

  /**
   *
   */
  getResolveCoincidentTopologyPolygonOffsetFaces(): ICoincidentTopology;

  /**
   *
   * @param {Number} value
   */
  setResolveCoincidentTopologyPolygonOffsetFaces(value: number): boolean;

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

export default interface CoincidentTopologyHelper
  extends StaticCoincidentTopologyMethods {
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
  getCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getCoincidentTopologyPointOffsetParameters(): ICoincidentTopology;
}
