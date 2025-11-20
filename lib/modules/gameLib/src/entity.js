import {
  world,
  system
} from "@minecraft/server";
import {
  utils,
  Vector3
} from "./utils.js";
import {
  EntityDamageCause
} from "./data.js";

let seter = ["isSneaking", "nameTag"];

/**
 * 实体封装类，用于安全封装和映射Minecraft原生实体API。
 * 可实现对属性的监听（通过Proxy自动映射到原始实体）。
 */
export class entity {
  constructor(loger, source) {
    this.loger = loger;
    this._source = source;
    if (!utils.isEntityObject(source)) throw new TypeError("ERR_invalid_input");

    // 同步数据缓存
    this.data = {};

    // 初始化所有静态属性
    this.__init();

    // 创建Proxy以监听属性修改
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (seter.includes(prop)) {
          // 若修改的是映射属性，则同步到游戏实体
          try {
            target._source[prop] = value;
            target.data[prop] = value;
          } catch (err) {
            target.loger.e(`Set property ${prop} failed: ${err}`);
          }
        }
        return true;
      },
      get: (target, prop) => {
        if (seter.includes(prop)) {
          try {
            // 动态从实体读取最新值
            return target._source[prop];
          } catch {
            return target.data[prop];
          }
        }
        return prop in target ? target[prop] : target.data[prop];
      },
    });
  }
  kill() {
    this.__check_class()
    this._source.kill()
  }
  EffectAdd(name, duration, strength, show) {
    this.__check_class();
    let opt = {};
    if (typeof duration !== "number" || !utils.in(duration, 1, 20000000))
      throw new TypeError("ERR 'duration' Not Right");
    if (!(typeof name === "number" || typeof name === "string"))
      throw new TypeError("ERR Object 'name' Not Right");
    if (strength) {
      if (typeof strength !== "number" || !utils.in(strength, 0, 255))
        throw new TypeError("ERR Object 'amplifier' Not Right");
      opt.amplifier = strength;
    }
    if (show) {
      if (typeof show !== "boolean")
        throw new TypeError("ERR Object 'show' Not Right");
      opt.showParticles = show;
    }
    this._source.addEffect(utils.getEffect(name), duration, opt);
  }

  TagAdd(name) {
    this.__check_class();
    this.__check_tag_name(name);
    this._source.addTag(name);
  }

  TagCut(name) {
    this.__check_class();
    this.__check_tag_name(name);
    return this._source.removeTag(name);
  }

  EffectCut(name) {
    this.__check_class();
    return this._source.removeEffect(utils.getEffect(name));
  }

  damageA(hurt, cause, source) {
    this.__check_class();
    if (!Object.keys(EntityDamageCause).includes(cause))
      throw new TypeError("ERR Object 'cause' Not Right");
    const Use_source = this.__check_damage_param(hurt, source);
    this._source.applyDamage(hurt, {
      damagingEntity: Use_source,
      cause,
    });
  }

  damageB(hurt, source, Projectile) {
    this.__check_class();
    if (!(Projectile instanceof entity) || !Projectile._source.isValid)
      throw new TypeError("Projectile input Err: NOT A ENTITY");
    const projectile = Projectile._source;
    this._source.applyDamage(hurt, {
      damagingEntity: this.__check_damage_param(hurt, source),
      damagingProjectile: projectile,
    });
  }

  __check_class() {
    if (!this._source.isValid) throw new Error("this class is Not available");
  }

  __check_damage_param(hurt, source) {
    if (typeof hurt !== "number")
      throw new TypeError("ERR Object 'hurt' Is not Number");
    if (!(source instanceof entity))
      throw new TypeError("ERR Object 'damageingEntity' Not Right");
    const damageingEntity = source._source;
    if (!utils.isEntityObject(damageingEntity))
      throw new TypeError("ERR input entity is not entity");
    return damageingEntity;
  }

  __check_tag_name(name) {
    if (!utils.in(name.length, 1, 250) || typeof name !== "string")
      throw new TypeError("ERR Object 'name' Too short or Too Long");
  }

  /**
   * 初始化同步属性（部分属性只读）
   */
  __init() {
    // 同步属性
    // 实体id,string
    this.__static_set("id", "", true);
    // 同上
    this.__static_set("typeId", "", true);
    // 实体是否正在接触可攀爬的方块，比如玩家靠近梯子或蜘蛛靠近石墙的情况。
    this.__static_set("isClimbing", false, true);
    // 实体是否正在坠落（坠落距离大于 0），或在滑翔时坠落（坠落距离大于 1）。
    this.__static_set("isFalling", false, true);
    // 实体是否部分位于水中
    this.__static_set("isInWater", false, true);
    // 实体是否位于实心方块之上。
    this.__static_set("isOnGround", false, true);
    // 实体是否处于睡眠状态
    this.__static_set("isSleeping", false, true);
    // 是否处于潜行状态，可修改
    this.__static_set("isSneaking", false, false);
    // 是否处于奔跑状态，只读
    this.__static_set("isSprinting", false, true);
    // 本地化键
    this.__static_set("localizationKey", "", true);
    // 名称，可修改
    this.__static_set("nameTag", "", false);
    // 实体位置
    this.__static_set("location", new Vector3(), true);
    // 积分板身份
    this.__static_set("scoreboardIdentity", null, true);
  }

  __static(name) {
    try {
      return this._source?.[name] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 用于同步静态属性，内部方法
   * @param {string} name - 名称
   * @param {string|number|boolean|object} defaultValue - 默认值
   * @param {Boolean} isOnlyRead - 是否只读
   */
  __static_set(name, defaultValue, isOnlyRead) {
    try {
      const value = this.__static(name) ?? defaultValue;
      this.data[name] = value;
      if (isOnlyRead) Object.defineProperty(this.data, name, {
        writable: false
      });
    } catch (err) {
      this.loger.e(err);
      this.data[name] = defaultValue;
    }
  }
}