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

// 定义可被 Proxy 代理读写的实体属性（同步到原生实体）
const PROXIED_PROPERTIES = ["isSneaking", "nameTag"];

/**
 * Entity 类：对 Minecraft 原生实体对象的封装，
 * 提供安全的 API 操作、属性代理同步、参数校验等功能。
 */
export class Entity {
  constructor(logger, source) {
    this.logger = logger; // 日志记录器，用于错误输出
    this._source = source; // 原生 Minecraft 实体对象

    if (!utils.isEntityObject(source)) {
      throw new TypeError("ERR_invalid_input: 传入的 source 不是有效的实体对象");
    }
    // 用于缓存部分同步数据
    this.data = {};
    // 初始化同步属性
    this._init();
    // 返回一个代理对象，拦截 get/set 操作
    return new Proxy(this, {
      set: (target, prop, value) => {
        if (PROXIED_PROPERTIES.includes(prop)) {
          // 只有在白名单中的属性才允许代理写入
          try {
            target._source[prop] = value; // 同步到原生实体
            target.data[prop] = value; // 同步到本地缓存
          } catch (err) {
            target.logger.e(`设置属性 "${prop}" 失败: ${err}`);
          }
        }
        return true;
      },
      get: (target, prop) => {
        if (PROXIED_PROPERTIES.includes(prop)) {
          // 优先从原生实体读取最新值（如 isSneaking, nameTag）
          try {
            return target._source[prop];
          } catch {
            // 如果失败，尝试从本地缓存返回
            return target.data[prop];
          }
        }

        // 优先从当前对象查找，否则从 data 缓存中返回
        return prop in target ? target[prop] : target.data[prop];
      }
    });
  }

  /// ---- 基础方法：实体操作 ----

  /**
   * 摧毁实体（调用原生 kill() 方法）
   */
  kill() {
    this._checkClass();
    this._source.kill();
  }

  /**
   * 给实体添加状态效果（如中毒、速度等）
   * @param {string | number} name - 效果 ID 或名称
   * @param {number} duration - 持续时间 ticks
   * @param {number} [strength] - 效果强度（0-255）
   * @param {boolean} [show] - 是否显示粒子效果
   */
  addEffect(name, duration, strength, show) {
    this._checkClass();

    if (typeof duration !== "number" || !utils.in(duration, 1, 20000000)) {
      throw new TypeError("ERR: 'duration' 必须是 1~20000000 的数字");
    }
    if (typeof name !== "number" && typeof name !== "string") {
      throw new TypeError("ERR: 'name' 必须是字符串或数字");
    }
    if (strength !== undefined) {
      if (typeof strength !== "number" || !utils.in(strength, 0, 255)) {
        throw new TypeError("ERR: 'strength' 必须是 0~255 的数字");
      }
    }
    if (show !== undefined) {
      if (typeof show !== "boolean") {
        throw new TypeError("ERR: 'show' 必须是布尔值");
      }
    }

    const effect = utils.getEffect(name);
    const options = {};

    if (strength !== undefined) options.amplifier = strength;
    if (show !== undefined) options.showParticles = show;

    this._source.addEffect(effect, duration, options);
  }

  /**
   * 给实体添加标签
   * @param {string} name - 标签名称
   */
  addTag(name) {
    this._checkClass();
    this._checkTagName(name);
    this._source.addTag(name);
  }

  /**
   * 移除实体标签
   * @param {string} name - 标签名称
   * @returns 是否移除成功
   */
  removeTag(name) {
    this._checkClass();
    this._checkTagName(name);
    return this._source.removeTag(name);
  }

  /**
   * 移除实体身上的某个效果
   * @param {string | number} name - 效果 ID 或名称
   */
  removeEffect(name) {
    this._checkClass();
    return this._source.removeEffect(utils.getEffect(name));
  }

  /// ---- 伤害相关方法 ----

  /**
   * 对实体造成伤害（来自某个实体）
   * @param {number} hurt - 伤害值
   * @param {string} cause - 伤害类型，参考 EntityDamageCause
   * @param {Entity} source - 伤害来源实体
   */
  damage(hurt, cause, source) {
    this._checkClass();
    if (!Object.keys(EntityDamageCause).includes(cause)) {
      throw new TypeError("ERR: 'cause' 必须是有效的伤害类型");
    }
    const damageSource = this._checkDamageParam(hurt, source);
    this._source.applyDamage(hurt, {
      damagingEntity: damageSource,
      cause: cause
    });
  }

  /**
   * 对实体造成伤害（来自投射物实体）
   * @param {number} hurt - 伤害值
   * @param {Entity} source - 伤害来源（通常是玩家）
   * @param {Entity} projectile - 投射物实体（如箭矢）
   */
  damageByProjectile(hurt, source, projectile) {
    this._checkClass();
    if (!(projectile instanceof Entity) || !projectile._source.isValid) {
      throw new TypeError("ERR: 投射物必须是一个有效的 Entity 实例");
    }
    const projSource = projectile._source;
    const damageSource = this._checkDamageParam(hurt, source);
    this._source.applyDamage(hurt, {
      damagingEntity: damageSource,
      damagingProjectile: projSource
    });
  }

  /// ---- 内部工具方法 ----

  /**
   * 检查当前封装的实体是否有效（未被销毁）
   */
  _checkClass() {
    if (!this._source.isValid) {
      throw new Error("ERR: 该实体对象已无效（可能已被销毁）");
    }
  }

  /**
   * 检查伤害来源参数是否合法
   */
  _checkDamageParam(hurt, source) {
    if (typeof hurt !== "number") {
      throw new TypeError("ERR: 伤害值 'hurt' 必须是数字");
    }
    if (!(source instanceof Entity)) {
      throw new TypeError("ERR: 伤害来源必须是一个 Entity 实例");
    }
    const dmgSource = source._source;
    if (!utils.isEntityObject(dmgSource)) {
      throw new TypeError("ERR: 传入的伤害来源不是有效的实体对象");
    }
    return dmgSource;
  }

  /**
   * 检查标签名称是否合法
   */
  _checkTagName(name) {
    if (typeof name !== "string" || !utils.in(name.length, 1, 250)) {
      throw new TypeError("ERR: 标签名称必须是 1~250 长度的字符串");
    }
  }

  /// ---- 属性同步初始化 ----

  /**
   * 初始化需要同步的实体属性（部分只读）
   */
  _init() {
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

  /**
   * 尝试从原生实体获取某个属性，出错时返回 null
   */
  _static(name) {
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
  _staticSet(name, defaultValue, isReadOnly) {
    try {
      const value = this._static(name) ?? defaultValue;
      this.data[name] = value;
      if (isReadOnly) {
        Object.defineProperty(this.data, name, {
          writable: false
        });
      }
    } catch (err) {
      this.logger.e(err);
      this.data[name] = defaultValue;
    }
  }
}