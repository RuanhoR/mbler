/**获取两个setA-setB */
export declare function difference<T>(a: Set<T>, b: Set<T>): Set<T>;
/**对对象执行map方法 */
export declare function mapObject<T extends object, U>(obj: T, fn: (value: T[keyof T], key: keyof T) => U): {
    [K in keyof T]: U;
};
