export interface HtmlDataAccessHelper {
  fetchArray(
    instance: any,
    baseURL: string,
    array: object,
    options?: object
  ): Promise<object>;
  fetchJSON(instance: any, url: string, options?: object): Promise<object>;
  fetchText(instance: any, url: string, options?: object): Promise<string>;
  fetchImage(
    instance: any,
    url: string,
    options?: object
  ): Promise<HTMLImageElement>;
}

declare const HtmlDataAccessHelper: HtmlDataAccessHelper;
export default HtmlDataAccessHelper;
