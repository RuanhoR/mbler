export declare function createDeferredObject<T extends object>(): {
    setTarget: (obj: T) => void;
    proxy: T;
};
