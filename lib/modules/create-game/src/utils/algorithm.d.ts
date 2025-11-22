import { Block, Vector3 } from "@minecraft/server";
/**
 * BFS 遍历方块
 * @param startBlock 起始方块
 * @param condition 判断方块是否满足条件
 * @param maxDistance 可选，最大遍历距离
 */
declare function bfsBlocks(startBlock: Block, condition: (block: Block, distance: number) => boolean, maxDistance?: number, maxBlocks?: number): Block[];
/** 线性插值 */
declare function linspace(start: Vector3, end: Vector3, num: number): Vector3[];
export { bfsBlocks, linspace };
