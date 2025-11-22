import { GameComponent } from "./gameComponent/gameComponent.js";
import { GameEngine } from "./gameEngine.js";
import { GamePlayer } from "./gamePlayer/gamePlayer.js";
import { GameState } from "./gameState/gameState.js";
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
