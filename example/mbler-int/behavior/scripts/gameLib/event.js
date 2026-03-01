import {
  world,
  system
} from "@minecraft/server";
import {
  utils
} from "./utils.js";
import {
  Entity as EntityWrapper
} from "./entity.js";

export const event = class GameEventManager {
  constructor(logger) {
    this.runningSubscriptions = new Map(); // 存储事件订阅
    this.runningTimers = new Map(); // 存储定时任务
    this.logger = logger;
    this.entityWrapperMap = {
      entity: (logger, entity) => new EntityWrapper(logger, entity),
    };
    this._isInternalCall = false; // 用于控制 __Event__ 的调用权限
  }

  /**
   * 通用事件绑定方法（内部使用，请通过 PlayerAdd / EntityDie 等方法调用）
   */
  _bindEvent(callback, timing, eventName, params = [], source = "world") {
    try {
      if (!this._isInternalCall) {
        this.logger.e("错误：不允许直接调用 _bindEvent，请使用封装方法（如 PlayerAdd）");
        throw new Error("请通过 PlayerAdd、EntityDie 等公开方法注册事件");
      }

      const eventSystem = {
        world: world,
        system: system,
      } [source];

      if (!eventSystem) throw new Error(`无效的事件来源: ${source}`);

      if (typeof callback !== "function" && typeof callback !== "string") {
        throw new Error("callback 必须是函数或字符串命令");
      }

      if (!["<", ">"].includes(timing)) {
        throw new Error("timing 必须是 '<'（after）或 '>'（before）");
      }

      const eventPhaseMap = {
        "<": "afterEvents",
        ">": "beforeEvents",
      };

      const eventRoot = eventSystem[eventPhaseMap[timing]];
      if (!eventRoot) throw new Error("事件系统未找到对应阶段");

      const eventHandler = eventRoot[eventName];
      if (typeof eventHandler === "undefined") {
        throw new Error(`未找到事件: ${eventName}`);
      }

      const eventCallback = (eventData) => {
        try {
          if (typeof callback === "string") {
            // 命令模式：为所有玩家执行命令
            let errorLog = "";
            const commands = callback.split(/\n+/).filter(Boolean);
            commands.forEach((cmd) => {
              try {
                system.run(() => {
                  for (const player of world.getPlayers()) {
                    player.runCommand(cmd);
                  }
                });
              } catch (cmdError) {
                errorLog += `[命令执行失败] ${cmdError.message}\n`;
              }
            });
            if (errorLog) this.logger.d(errorLog);
            return;
          }

          // 函数模式：构造参数对象
          const paramObj = {};
          for (const p of params) {
            const sourceValue = eventData[p.source];
            paramObj[p.name] = sourceValue;

            if (typeof p.type === "string") {
              const wrapperKey = p.type.replace(/\./g, "");
              const wrapperFn = this.entityWrapperMap[wrapperKey];
              if (typeof wrapperFn === "function") {
                paramObj[p.name] = wrapperFn(this.logger, sourceValue);
              }
            }
          }

          callback(paramObj, eventData);
        } catch (err) {
          this.logger.e(`[事件执行错误 - ${eventName}] ${err.message}`);
        }
      };

      const subscription = eventHandler.subscribe(eventCallback);
      const id = this._generateId();

      this.runningSubscriptions.set(id, {
        unsubscribe: () => eventHandler.unsubscribe(subscription),
      });

      return {
        code: 200,
        id,
        msg: `事件注册成功: ${eventName}`,
      };
    } catch (e) {
      return {
        code: -1,
        id: 0,
        msg: e.message,
      };
    } finally {
      this._isInternalCall = false;
    }
  }

  _generateId() {
    return Date.now() + Math.floor(Math.random() * 9999);
  }

  /**
   * 停止指定 id 的事件订阅或定时任务
   */
  stop(id) {
    try {
      if (this.runningTimers.has(id)) {
        const timer = this.runningTimers.get(id);
        if (timer.isInterval) {
          system.clearRunInterval(timer.handle);
        } else {
          system.clearRunTimeout(timer.handle);
        }
        this.runningTimers.delete(id);
        return {
          code: 200,
          msg: "定时任务已停止"
        };
      }

      if (this.runningSubscriptions.has(id)) {
        const sub = this.runningSubscriptions.get(id);
        sub.unsubscribe();
        this.runningSubscriptions.delete(id);
        return {
          code: 200,
          msg: "事件订阅已取消"
        };
      }

      return {
        code: 404,
        msg: "未找到对应 ID"
      };
    } catch (e) {
      return {
        code: -1,
        msg: e.message
      };
    }
  }
  PlayerAdd(callback, timing = "<") {
    this._isInternalCall = true;
    return this._bindEvent(callback, timing, "playerSpawn", [{
        source: "player",
        name: "player"
      },
      {
        source: "initialSpawn",
        name: "ok"
      },
    ]);
  }

  EntityDie(callback) {
    this._isInternalCall = true;
    return this._bindEvent(callback, "<", "entityDie", [{
        source: "deadEntity",
        name: "entity"
      },
      {
        source: "damageSource",
        name: "source"
      },
      {
        source: "projectile",
        name: "source_v2"
      },
    ]);
  }

  EntityHitE(callback) {
    this._isInternalCall = true;
    return this._bindEvent(callback, "<", "entityHitEntity", [{
        source: "damagingEntity",
        name: "damage",
        type: "entity"
      },
      {
        source: "hitEntity",
        name: "entity",
        type: "entity"
      },
    ]);
  }

  EntityHitB(callback) {
    this._isInternalCall = true;
    return this._bindEvent(callback, "<", "entityHitBlock", [{
        source: "hitBlock",
        name: "block"
      },
      {
        source: "damagingEntity",
        name: "entity"
      },
    ]);
  }

  BreakB(callback, timing = "<") {
    this._isInternalCall = true;
    return this._bindEvent(callback, timing, "playerBreakBlock", [{
        source: "player",
        name: "player"
      },
      {
        source: "block",
        name: "block"
      },
    ]);
  }

  EntityAdd(callback) {
    this._isInternalCall = true;
    return this._bindEvent(callback, "<", "entitySpawn", [{
        source: "entity",
        name: "entity"
      },
      {
        source: "cause",
        name: "source"
      },
    ]);
  }

  UseItem(callback, timing = "<") {
    this._isInternalCall = true;
    return this._bindEvent(callback, timing, "itemUse", [{
        source: "source",
        name: "player"
      },
      {
        source: "itemStack",
        name: "item"
      },
    ]);
  }

  WatchDogStop(callback) {
    this._isInternalCall = true;
    return this._bindEvent(callback, ">", "watchdogTerminate", [{
        source: "terminateReason",
        name: "res"
      },
      {
        source: "cancel",
        name: "cancel"
      },
    ], "system");
  }

  setTimer(callback, tickDelay, isInterval = false) {
    try {
      if (typeof callback !== "function" || typeof tickDelay !== "number") {
        throw new Error("参数错误：callback 必须为函数，tickDelay 必须为数字");
      }
      const id = this._generateId();
      const handle = isInterval ?
        system.runInterval(callback, tickDelay) :
        system.runTimeout(callback, tickDelay);

      this.runningTimers.set(id, {
        handle,
        isInterval
      });
      return {
        code: 200,
        id,
        msg: "定时任务已创建"
      };
    } catch (e) {
      return {
        code: -1,
        id: 0,
        msg: e.message
      };
    }
  }
}