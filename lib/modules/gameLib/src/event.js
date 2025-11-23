import {
  world,
  system
} from "@minecraft/server";
import {
  utils
} from "./utils.js";
import {
  Entity as entity
} from "./entity.js";
let __useD = false;

export class event {
  constructor(loger) {
    this.RuningSubscribe = new Map();
    this.RuningSetTime = new Map();
    this.loger = loger;
    this.List = {
      'entity': (entity) => {
        return new entity(this.loger, entity)
      }
    }
  }
  __Event__(callback, timing, eventName, pre, from = 'world') {
    try {
      if (!__useD) {
        this.loger.e('❌ game 私有方法不允许外部调用！');
        throw new Error("请不要单独调用 __Event__");
      }
      __useD = false;
      const method = {
        "system": system,
        "world": world
      } [from];
      if (!method) throw new Error("事件来源错误: " + from);
      if (typeof callback !== "function" && typeof callback !== "string")
        throw new Error("callback 必须是 function 或 string");
      if (!["<", ">"].includes(timing))
        throw new Error("timing 必须为 '<' 或 '>'");
      const timingMap = {
        "<": "afterEvents",
        ">": "beforeEvents"
      };
      const eventRoot = method[timingMap[timing]];
      if (!eventRoot) throw new Error("事件系统错误");
      const run_place = eventRoot[eventName];
      if (typeof run_place === "undefined")
        throw new Error("事件名称错误: " + eventName);
      const run = (eventData) => {
        try {
          if (typeof callback === 'string') {
            // 命令模式
            let log = "";
            callback.split(/\n+/).forEach(cmd => {
              try {
                system.run(() => {
                  for (const player of world.getPlayers()) {
                    player.runCommand(cmd);
                  }
                })
              } catch (err) {
                log += `[命令执行错误] ${err.message}\n`;
              }
            });
            if (log) this.loger.d(log);
            return;
          }
          // 函数模式
          const paramObj = {};
          for (const e of pre) {
            const source = eventData[e.source];
            paramObj[e.name] = source
            if (typeof e.type === 'string') {
              const temp = this.List[e.type.replace('.', '')];
              if (typeof temp === "function") {
                paramObj[e.name] = temp(source)
              }
            }
          }
          callback(paramObj, eventData);
        } catch (err) {
          this.loger.e(`[事件执行错误] ${eventName}: ${err.message}`);
        }
      };

      // 注册事件
      const subscription = run_place.subscribe(run);
      const id = this.__getId()
      this.RuningSubscribe.set(id, {
        unsubscribe: () => run_place.unsubscribe(subscription)
      });
      return {
        code: 200,
        id,
        msg: `事件注册成功: ${eventName}`
      };
    } catch (e) {
      return {
        code: -1,
        id: 0,
        msg: e.message
      };
    }
  }
  // 事件封装模板
  PlayerAdd(callback, timing = '<') {
    __useD = true;
    return this.__Event__(callback, timing, "playerSpawn", [{
        source: 'player',
        name: 'player'
      },
      {
        source: 'initialSpawn',
        name: 'ok'
      }
    ]);
  }

  EntityHitE(callback) {
    __useD = true;
    return this.__Event__(callback, '<', "entityHitEntity", [{
        source: 'damagingEntity',
        name: 'damage',
        type: "entity"
      },
      {
        source: 'hitEntity',
        name: 'entity',
        type: "entity"
      }
    ]);
  }

  EntityDie(callback) {
    __useD = true;
    return this.__Event__(callback, '<', "entityDie", [{
        source: 'deadEntity',
        name: 'entity'
      },
      {
        source: 'damageSource',
        name: 'source'
      },
      {
        source: 'projectile',
        name: 'source_v2'
      }
    ]);
  }

  EntityHitB(callback) {
    __useD = true;
    return this.__Event__(callback, '<', "entityHitBlock", [{
        source: 'hitBlock',
        name: 'block'
      },
      {
        source: 'damagingEntity',
        name: 'entity'
      }
    ]);
  }

  BreakB(callback, timing = '<') {
    __useD = true;
    return this.__Event__(callback, timing, "playerBreakBlock", [{
        source: 'player',
        name: 'player'
      },
      {
        source: 'block',
        name: 'block'
      }
    ]);
  }

  EntityAdd(callback) {
    __useD = true;
    return this.__Event__(callback, "<", "entitySpawn", [{
        source: 'entity',
        name: 'entity'
      },
      {
        source: 'cause',
        name: 'source'
      }
    ]);
  }

  UseItem(callback, timing = '<') {
    __useD = true;
    return this.__Event__(callback, timing, "itemUse", [{
        source: 'source',
        name: 'player'
      },
      {
        source: 'itemStack',
        name: 'item'
      }
    ]);
  }

  WatchDogStop(callback) {
    __useD = true;
    return this.__Event__(callback, ">", 'watchdogTerminate', [{
        source: 'terminateReason',
        name: 'res'
      },
      {
        source: 'cancel',
        name: 'cancel'
      }
    ], 'system');
  }

  // -----------------------
  // 定时任务
  // -----------------------
  setTimer(callback, tickDelay, isInterval = false) {
    try {
      if (typeof callback !== "function" || typeof tickDelay !== "number")
        throw new Error('参数不正确');
      const id = this.__getId();
      const handle = isInterval ?
        system.runInterval(callback, tickDelay) :
        system.runTimeout(callback, tickDelay);

      this.RuningSetTime.set(id, {
        handle,
        isInterval
      });
      return {
        code: 200,
        id,
        msg: "计时任务已创建"
      };

    } catch (e) {
      return {
        code: -1,
        id: 0,
        msg: e.message
      };
    }
  }
  __getId() {
    return Date.now() + Math.floor(Math.random() * 9999);
  }
  stop(id) {
    try {
      if (this.RuningSetTime.has(id)) {
        const task = this.RuningSetTime.get(id);
        if (task.isInterval) system.clearRun(task.handle);
        else system.clearRun(task.handle);
        this.RuningSetTime.delete(id);
        return {
          code: 200,
          msg: '计时任务已清除'
        };
      }
      if (this.RuningSubscribe.has(id)) {
        const sub = this.RuningSubscribe.get(id);
        sub.unsubscribe();
        this.RuningSubscribe.delete(id);
        return {
          code: 200,
          msg: '事件已取消订阅'
        };
      }
      return {
        code: 404,
        msg: '未找到对应 id'
      };
    } catch (e) {
      return {
        code: -1,
        msg: e.message
      };
    }
  }
}