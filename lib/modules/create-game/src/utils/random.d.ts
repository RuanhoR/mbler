export declare class RandomUtils {
    /** 返回 [0, max) 的随机整数 */
    static int(max: number): number;
    /** 返回 [min, max) 的随机整数 */
    static intRange(min: number, max: number): number;
    /** 从数组中随机取一个元素 */
    static choice<T>(arr: T[]): T | undefined;
    /** 从数组中随机取多个不重复元素(洗牌算法) */
    static choices<T>(arr: T[], count: number): T[];
    /** 纯洗牌算法，返回一个新数组（Fisher–Yates Shuffle） */
    static shuffle<T>(arr: T[]): T[];
    /** 就地洗牌（直接修改原数组） */
    static shuffleInPlace<T>(arr: T[]): void;
    /** 随机布尔值（true/false） */
    static bool(): boolean;
    /** 按权重随机选择一个元素 */
    static weightedChoice<T>(arr: T[], weights: number[]): T | undefined;
    /**在圆形区域内随机选点 */
    static randomPointInCircle(x: number, y: number, rMax: number): [number, number];
}
