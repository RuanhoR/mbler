import { GameComponentType } from "../gameComponent/gameComponent.js";
import { GameStateError } from "../utils/GameError.js";
export declare class GameComponentNotExistsError extends GameStateError {
    constructor(componentType: GameComponentType<any>, tag?: string, options?: ErrorOptions);
}
export declare class GameComponentAlreadyExistsError extends GameStateError {
    constructor(componentType: GameComponentType<any>, tag?: string, options?: ErrorOptions);
}
export declare class ComponentLoadFailedError extends GameStateError {
    constructor(componentType: GameComponentType<any>, tag?: string, options?: ErrorOptions);
}
export declare class ComponentDeleteFailedError extends GameStateError {
    constructor(componentType: GameComponentType<any>, tag?: string, options?: ErrorOptions);
}
