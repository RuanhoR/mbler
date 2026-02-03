import { GameError } from "./GameError.js";
export function createDeferredObject() {
    let target = null;
    const proxy = new Proxy({}, {
        get(_, prop) {
            if (!target) {
                throw new DeferredObjectError("对象未初始化，不能访问属性: " + String(prop));
            }
            return target[prop];
        },
    });
    return {
        setTarget(obj) {
            target = obj;
        },
        proxy,
    };
}
class DeferredObjectError extends GameError {
    constructor(mes, options) {
        super(mes, options);
        this.name = "DeferredObjectError";
    }
}
