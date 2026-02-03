/**向量工具类，提供向量相关的操作方法 */
export class Vector3Utils {
    /**距离 */
    static distance(v1, v2) {
        return Math.sqrt(this.squaredDistance(v1, v2));
    }
    /**距离(不开根号) */
    static squaredDistance(v1, v2) {
        return (Math.pow(v2.x - v1.x, 2) +
            Math.pow(v2.y - v1.y, 2) +
            Math.pow(v2.z - v1.z, 2));
    }
    /**将Vector3转为数组 */
    static toArray(vector) {
        return [vector.x, vector.y, vector.z];
    }
    /**转为字符串，用指定分隔符连接 */
    static toString(vector, sep = ",") {
        return this.toArray(vector).join(sep);
    }
    /**将数组转为Vector3 */
    static fromArray(array) {
        if (array.length !== 3) {
            throw new Error("必须为长度为3的数组");
        }
        if (!array.every(Number.isFinite)) {
            throw new Error("数组必须包含数字");
        }
        return { x: array[0], y: array[1], z: array[2] };
    }
    /**复制一个 */
    static clone(v) {
        return Object.assign({}, v);
    }
    /**v1+v2 */
    static add(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
    }
    /**v1-v2 */
    static subtract(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
    }
    /**v1*n */
    static scale(v, times) {
        return { x: v.x * times, y: v.y * times, z: v.z * times };
    }
    /**v1==v2? */
    static isEqual(v1, v2) {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }
    /**v1与v2在误差eps范围内相等? */
    static isApproxEqual(v1, v2, eps = 1e-6) {
        return (Math.abs(v1.x - v2.x) < eps &&
            Math.abs(v1.y - v2.y) < eps &&
            Math.abs(v1.z - v2.z) < eps);
    }
    /**向量长度 */
    static length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }
    /**点积 */
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }
    /**叉积 */
    static cross(v1, v2) {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x,
        };
    }
    /**归一化向量 */
    static normalize(v) {
        const len = this.length(v);
        if (len === 0)
            return { x: 0, y: 0, z: 0 };
        return { x: v.x / len, y: v.y / len, z: v.z / len };
    }
    /**返回上方指定距离(默认1)的Vector */
    static above(v, step = 1) {
        return this.add(v, { x: 0, y: step, z: 0 });
    }
    /**返回下方指定距离(默认1)的Vector */
    static below(v, step = 1) {
        return this.subtract(v, { x: 0, y: step, z: 0 });
    }
    /**获取坐标所在方块的位置，即浮点数坐标向下取整后的整数坐标。 */
    static intPos(v) {
        return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
    }
}
