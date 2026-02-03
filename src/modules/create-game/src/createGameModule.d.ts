import { GameComponent } from "./gameComponent/gameComponent.js";
import { GameContext } from "./gameContext.js";
import { GameEngine } from "./gameEngine.js";
import { GamePlayer } from "./gamePlayer/gamePlayer.js";
import { GameState } from "./gameState/gameState.js";
import { classConstructor } from "./utils/interfaces.js";
export interface GameModule<P extends GamePlayer, C extends GameContext> {
    Engine: abstract new <O = unknown>(key: string, config?: O) => GameEngine<P, C, O>;
    State: abstract new <TConfig = unknown, E extends GameEngine<P, C> = GameEngine<P, C, unknown>>(engine: E, config?: TConfig) => GameState<P, C, TConfig, E>;
    Component: abstract new <O = unknown, S extends GameState<P, C, any> = GameState<P, C, unknown>>(state: S, options?: O, tag?: string) => GameComponent<S, O>;
}
export declare function createGameModule<P extends GamePlayer = GamePlayer, C extends GameContext = GameContext>(options: {
    playerClass?: classConstructor<P>;
    contextClass?: classConstructor<C>;
}): GameModule<P, C>;
