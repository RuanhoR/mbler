import {
  Logger
} from "./../utils/index";
/** 通用事件信号基类 */
export class BaseMapEventSignal {
  logger = new Logger(this.constructor.name);
  map = new Map();
  totalCount = 0;
  inited = false;
  nativeUnsub;
  subscribe(callback, options) {
    const key = this.buildKey(options);
    if (key == null) {
      throw new Error("必须提供有效的订阅 key");
    }
    if (!this.inited) {
      this.init();
    }
    let set = this.map.get(key);
    if (!set) {
      set = new Set();
      this.map.set(key, set);
    }
    const data = this.buildData(callback, options);
    set.add(data);
    this.totalCount++;
    return this.wrapUnsub(key, data);
  }
  wrapUnsub(key, data) {
    let unsubscribed = false;
    return {
      unsubscribe: () => {
        if (unsubscribed)
          return;
        unsubscribed = true;
        const set = this.map.get(key);
        if (!set)
          return;
        if (set.delete(data)) {
          this.totalCount--;
          if (set.size === 0)
            this.map.delete(key);
        }
        if (this.totalCount === 0)
          this.cleanup();
      },
    };
  }
  init() {
    this.inited = true;
    this.nativeUnsub = this.subscribeNative(this.publish.bind(this));
  }
  cleanup() {
    if (this.nativeUnsub) {
      try {
        this.unsubscribeNative(this.nativeUnsub);
      } catch (e) {
        this.logger.warn("取消底层订阅失败:", e);
      } finally {
        this.nativeUnsub = undefined;
      }
    }
    this.map.clear();
    this.totalCount = 0;
    this.inited = false;
  }
  publish(event) {
    if (!this.isTargetEvent(event))
      return;
    const key = this.extractKey(event);
    if (key == null)
      return;
    const callbacks = this.map.get(key);
    if (!callbacks || callbacks.size === 0)
      return;
    //包装
    const eventWrapped = this.eventWrapper(event);
    for (const data of Array.from(callbacks)) {
      if (!this.filter(data, event))
        continue;
      try {
        data.callback(eventWrapped);
      } catch (e) {
        this.logger.error("callback failed:", e);
      }
    }
  }
  /** 子类可重写：是否为需要的事件 */
  isTargetEvent(event) {
    return true;
  }
  /**自定义事件返回 */
  eventWrapper(event) {
    return event;
  }
}