import { CubeRegion } from "./gameRegion.js";
/**游戏区域 */
declare class RegionHelper {
    /**填充方块，需自己保证区块已加载 */
    fillGenerator(region: CubeRegion, block: string, batchSize?: number): Generator<undefined, void, unknown>;
    private fillGen;
    /**分割Region，保证每块小于32767 */
    splitCubeRegion(initialRegion: CubeRegion, batchSize?: number): CubeRegion[];
}
export declare const regionHelper: RegionHelper;
export {};
