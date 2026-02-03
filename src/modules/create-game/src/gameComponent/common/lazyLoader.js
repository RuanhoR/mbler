import { world } from "@minecraft/server";
import { Game } from "../../main.js";
import { Duration, Logger } from "../../utils/index.js";
import { GameComponent } from "../gameComponent.js";
/**用于懒加载区块 */
export class LazyLoader extends GameComponent {
    active = false;
    logger = new Logger(this.constructor.name);
    components = [];
    get isActive() {
        return this.active;
    }
    onAttach() {
        this.subscribe(Game.events.interval, () => {
            if (!this.options)
                return;
            const { dimensionId: dimension, pos, onLoad, onUnload, } = this.options;
            const load = world.getDimension(dimension).getBlock(pos);
            if (load) {
                if (!this.active) {
                    this.logger.log("load");
                    try {
                        onLoad(this);
                    }
                    catch (err) {
                        this.logger.error("onLoad error:", err);
                    }
                    this.active = true;
                }
            }
            else {
                if (this.active) {
                    this.logger.log("unload");
                    this.clearComponents();
                    try {
                        onUnload?.();
                    }
                    catch (e) {
                        this.logger.error("onUnload error", e);
                    }
                    this.active = false;
                }
            }
        }, this.options.interval ?? new Duration(20));
    }
    clearComponents() {
        //先取消所有订阅
        this.components.forEach((c) => {
            this.state.eventManager.unsubscribeBySubscriber(c);
        });
        //再删除所有组件
        this.components.forEach((c) => this.state.deleteComponent(c));
        this.components = [];
    }
    reload() {
        if (!this.options)
            return;
        const { onLoad, onUnload } = this.options;
        if (this.active) {
            onUnload?.();
            this.clearComponents();
            this.active = false;
        }
        onLoad(this);
        this.active = true;
    }
    addComponent(component, options) {
        this.state.addComponent(component, options);
        this.components.push(component);
        return this;
    }
}
