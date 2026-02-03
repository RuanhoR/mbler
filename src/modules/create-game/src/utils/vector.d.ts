import { Vector3 } from "@minecraft/server";
/**向量工具类，提供向量相关的操作方法 */
export declare class Vector3Utils {
    /**距离 */
    static distance(v1: Vector3, v2: Vector3): number;
    /**距离(不开根号) */
    static squaredDistance(v1: Vector3, v2: Vector3): number;
    /**将Vector3转为数组 */
    static toArray(vector: Vector3): [number, number, number];
    /**转为字符串，用指定分隔符连接 */
    static toString(vector: Vector3, sep?: string): string;
    /**将数组转为Vector3 */
    static fromArray(array: number[]): Vector3;
    /**复制一个 */
    static clone(v: Vector3): Vector3;
    /**v1+v2 */
    static add(v1: Vector3, v2: Vector3): Vector3;
    /**v1-v2 */
    static subtract(v1: Vector3, v2: Vector3): Vector3;
    /**v1*n */
    static scale(v: Vector3, times: number): {
        x: number;
        y: number;
        z: number;
    };
    /**v1==v2? */
    static isEqual(v1: Vector3, v2: Vector3): boolean;
    /**v1与v2在误差eps范围内相等? */
    static isApproxEqual(v1: Vector3, v2: Vector3, eps?: number): boolean;
    /**向量长度 */
    static length(v: Vector3): number;
    /**点积 */
    static dot(v1: Vector3, v2: Vector3): number;
    /**叉积 */
    static cross(v1: Vector3, v2: Vector3): {
        x: number;
        y: number;
        z: number;
    };
    /**归一化向量 */
    static normalize(v: Vector3): {
        x: number;
        y: number;
        z: number;
    };
    /**返回上方指定距离(默认1)的Vector */
    static above(v: Vector3, step?: number): Vector3;
    /**返回下方指定距离(默认1)的Vector */
    static below(v: Vector3, step?: number): Vector3;
    /**获取坐标所在方块的位置，即浮点数坐标向下取整后的整数坐标。 */
    static intPos(v: Vector3): {
        x: number;
        y: number;
        z: number;
    };
}
