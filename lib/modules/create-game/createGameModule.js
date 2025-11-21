import { GameComponent } from "./gameComponent/gameComponent";
import { GameEngine } from "./gameEngine";
import { GamePlayer } from "./gamePlayer/gamePlayer";
import { GameState } from "./gameState/gameState";
export function createGameModule(options) {
    const playerClass = options.playerClass ?? GamePlayer;
    class Engine extends GameEngine {
        constructor(key, config) {
            super(playerClass, key, config);
        }
    }
    class State extends GameState {
    }
    class Component extends GameComponent {
    }
    return {
        Engine,
        State,
        Component,
    };
}
