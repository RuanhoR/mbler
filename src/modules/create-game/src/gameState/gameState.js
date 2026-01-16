import { EventManager } from "../gameEvent/eventManager.js";
import { RunnerManager } from "../Runner/RunnerManager.js";
import { Logger } from "../utils/logger.js";
import { ComponentDeleteFailedError, GameComponentAlreadyExistsError, GameComponentNotExistsError, } from "./types.js";
/**游戏状态 */
export class GameState {
    logger = new Logger(this.constructor.name);
    engine;
    components = new Map();
    eventManager = new EventManager();
    runner = new RunnerManager(this.constructor.name);
    config;
    constructor(engine, config) {
        this.engine = engine;
        this.config = config;
    }
    /**全局上下文 */
    get context() {
        return this.engine.context;
    }
    /**玩家管理器 */
    get playerManager() {
        return this.engine.playerManager;
    }
    get gameKey() {
        return this.engine.key;
    }
    /**获取子状态 */
    get nextState() {
        return this.engine.getNextState(this);
    }
    get lastState() {
        return this.engine.getLastState(this);
    }
    /**
     * 添加组件到当前状态
     * @param component 组件类型
     * @param options 组件参数
     * @param tag 组件标签(唯一)
     * @throws {GameComponentAlreadyExistsError} 组件已存在时抛出
     * @throws {ComponentLoadFailedError} 组件加载失败时抛出
     */
    addComponent(component, options, tag) {
        if (!this.engine.isActive)
            return this;
        this.logger.debug(`添加组件:${component.name}` +
            (tag != undefined ? `(tag=${tag})` : ""));
        //判断是否重复
        const list = this.components.get(component) ?? [];
        if (list.some((c) => c.tag === tag)) {
            throw new GameComponentAlreadyExistsError(component, tag);
        }
        //没有数组就设置
        if (!this.components.has(component))
            this.components.set(component, list);
        //添加到数组
        const componentInstance = new component(this, options, tag);
        list.push(componentInstance);
        //加载
        try {
            const comp = componentInstance;
            comp._onAttach();
        }
        catch (err) {
            this.logger.error(`组件 ${component.name} tag=${tag} 加载失败`, err);
        }
        return this;
    }
    /**添加多个components(不能带参数和tag) */
    addComponents(components) {
        for (const comp of components) {
            this.addComponent(comp);
        }
    }
    /**
     * 获取当前状态中的组件
     * @param type 组件类型
     * @param tag 组件标签
     * @throws {GameComponentNotExistsError} 若组件不存在，则抛出
     */
    getComponent(type, tag) {
        const list = this.components.get(type);
        const component = list?.find((c) => c.tag === tag);
        if (!component) {
            throw new GameComponentNotExistsError(type, tag);
        }
        return component;
    }
    /**删除当前状态中的组件
     * @throws {ComponentDeleteFailedError} 组件删除失败时
     */
    deleteComponent(component, tag) {
        this.logger.debug(`删除组件:${component.name}`);
        const list = this.components.get(component);
        if (!list)
            return this;
        const index = list?.findIndex((c) => c.tag === tag);
        if (index === -1)
            return this;
        const comp = list[index];
        try {
            //取消订阅
            comp._onDetach();
            list.splice(index, 1);
            if (list.length === 0)
                this.components.delete(component);
        }
        catch (err) {
            throw new ComponentDeleteFailedError(component, comp.tag, {
                cause: err,
            });
        }
        return this;
    }
    /**删除所有组件
     * @throws {ComponentDeleteFailedError} 删除失败时
     */
    deleteAllComponents() {
        this.logger.debug(`删除所有组件`);
        for (let [compType, list] of this.components.entries()) {
            for (const comp of list) {
                const instance = comp;
                try {
                    instance._onDetach();
                }
                catch (err) {
                    throw new ComponentDeleteFailedError(compType, instance.tag, { cause: err });
                }
            }
        }
        this.components.clear();
    }
    subscribe(event, ...args) {
        return this.eventManager.subscribe(this, event, ...args);
    }
    /** 进入一个新的子状态 */
    pushState(stateType, config) {
        this.engine.pushState(stateType, config);
    }
    /** 返回到父状态 */
    popState() {
        this.engine.popState();
    }
    /**将当前状态及其所有子状态，替换为一个新状态。*/
    transitionTo(stateType, config) {
        this.engine.replaceFrom(this, stateType, config);
    }
    _onExit() {
        this.logger.debug(`onExit`);
        this.onExit();
        this.eventManager.dispose();
        this.deleteAllComponents();
        this.runner.dispose();
    }
    onExit() { }
    /**返回基本信息 */
    stats() {
        const stateName = this.constructor.name;
        const componentNames = [...this.components.values()]
            .map((l) => l.map((c) => c.constructor.name +
            (c.tag != undefined ? `(tag=${c.tag})` : "")))
            .flat();
        return `§b${stateName}§r(${componentNames.length}): §i${componentNames.length ? componentNames.join(",") : "<none>"}`;
    }
}
