/**获取两个setA-setB */
export function difference(a, b) {
    const result = new Set();
    for (const item of a) {
        if (!b.has(item))
            result.add(item);
    }
    return result;
}
/**对对象执行map方法 */
export function mapObject(obj, fn) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [
        k,
        fn(v, k),
    ]));
}
