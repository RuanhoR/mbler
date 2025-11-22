import { GameStateError } from "../utils/GameError.js";
export class GameComponentNotExistsError extends GameStateError {
    constructor(componentType, tag, options) {
        const msg = tag
            ? `组件 ${componentType.name} (tag=${tag}) 不存在于当前状态中`
            : `组件 ${componentType.name} 不存在于当前状态中`;
        super(msg, options);
    }
}
// 组件已存在
export class GameComponentAlreadyExistsError extends GameStateError {
    constructor(componentType, tag, options) {
        const msg = tag
            ? `组件 ${componentType.name} (tag=${tag}) 已经存在于当前状态中`
            : `组件 ${componentType.name} 已经存在于当前状态中`;
        super(msg, options);
    }
}
export class ComponentLoadFailedError extends GameStateError {
    constructor(componentType, tag, options) {
        super(`组件 ${componentType.name} tag=${tag} 加载失败`, options);
    }
}
export class ComponentDeleteFailedError extends GameStateError {
    constructor(componentType, tag, options) {
        super(`组件 ${componentType.name} tag=${tag} 卸载失败`, options);
    }
}
