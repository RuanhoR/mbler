export declare class GameError extends Error {
    constructor(mes: string, options?: ErrorOptions);
}
export declare class GameManagerError extends GameError {
    constructor(mes: string, options?: ErrorOptions);
}
export declare class GameEngineError extends GameError {
    constructor(mes: string, options?: ErrorOptions);
}
export declare class GameStateError extends GameError {
    constructor(mes: string, options?: ErrorOptions);
}
