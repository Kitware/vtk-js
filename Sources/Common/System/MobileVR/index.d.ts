declare namespace _default {
    export { isMobile };
    export { isIOS };
    export { isWebViewAndroid };
    export { isSafari };
    export { isFirefoxAndroid };
    export { hardware };
    export { getVRHeadset };
}
export default _default;
declare const isMobile: boolean;
declare const isIOS: boolean;
declare const isWebViewAndroid: boolean;
declare const isSafari: boolean;
declare const isFirefoxAndroid: boolean;
declare namespace hardware {
    export { width };
    export { height };
}
declare function getVRHeadset(): any;
declare const width: number;
declare const height: number;
