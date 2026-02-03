import { Player } from "@minecraft/server";
import { GameEngine } from "../gameEngine.js";
import { classConstructor } from "../utils/interfaces.js";
export declare class GameManager {
    private games;
    private readonly logger;
    private addGame;
    /**
     * 启动指定游戏
     * @throws GameManagerError 当游戏已存在时
     */
    startGame<T extends GameEngine<any, any, any>>(game: classConstructor<T>, config?: T extends GameEngine<any, any, infer P> ? P : unknown, tag?: string): void;
    /**获取指定tag游戏是否已存在 */
    hasGame<T extends GameEngine<any, any>>(game: classConstructor<T>, tag?: string): boolean;
    /**获取game */
    getGame<T extends GameEngine<any, any>>(game: classConstructor<T>, tag?: string): T | undefined;
    getGameByKey(key: string): GameEngine<any, any, unknown> | undefined;
    stopGame<T extends GameEngine<any, any>>(game: classConstructor<T>, tag?: string): void;
    stopGameByKey(key: string): void;
    /**停止所有普通游戏 */
    stopAll(): void;
    /**静默停止所有普通游戏 */
    end(): void;
    status(player?: Player, detail?: boolean): void;
    buildKey(game: Function, tag?: string): string;
}
