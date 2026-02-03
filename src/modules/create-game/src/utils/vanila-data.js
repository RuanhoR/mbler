/**维度 */
export var DimensionIds;
(function (DimensionIds) {
    DimensionIds["Overworld"] = "minecraft:overworld";
    DimensionIds["Nether"] = "minecraft:nether";
    DimensionIds["End"] = "minecraft:the_end";
})(DimensionIds || (DimensionIds = {}));
/** 相机视角/预设 */
export var CameraPreset;
(function (CameraPreset) {
    /** 控制方案相机 [实验性功能: 创建者照相机] */
    CameraPreset["ControlSchemeCamera"] = "minecraft:control_scheme_camera";
    /** 第一人称视角 */
    CameraPreset["FirstPerson"] = "minecraft:first_person";
    /** 固定镜头视角的轨道相机 */
    CameraPreset["FixedBoom"] = "minecraft:fixed_boom";
    /** 轨道相机 */
    CameraPreset["FollowOrbit"] = "minecraft:follow_orbit";
    /** 自由视角 */
    CameraPreset["Free"] = "minecraft:free";
    /** 第三人称视角背面 */
    CameraPreset["ThirdPerson"] = "minecraft:third_person";
    /** 第三人称视角正面 */
    CameraPreset["ThirdPersonFront"] = "minecraft:third_person_front";
})(CameraPreset || (CameraPreset = {}));
export var EntityTypeIds;
(function (EntityTypeIds) {
    /**玩家 */
    EntityTypeIds["Player"] = "minecraft:player";
    /**盔甲架 */
    EntityTypeIds["ArmorStand"] = "minecraft:armor_stand";
})(EntityTypeIds || (EntityTypeIds = {}));
/**各种状态效果 */
export var EffectIds;
(function (EffectIds) {
    /** 迅捷 | speed */
    EffectIds["Speed"] = "speed";
    /** 缓慢 | slowness */
    EffectIds["Slowness"] = "slowness";
    /** 急迫 | haste */
    EffectIds["Haste"] = "haste";
    /** 挖掘疲劳 | mining_fatigue */
    EffectIds["MiningFatigue"] = "mining_fatigue";
    /** 力量 | strength */
    EffectIds["Strength"] = "strength";
    /** 瞬间治疗 | instant_health */
    EffectIds["InstantHealth"] = "instant_health";
    /** 瞬间伤害 | instant_damage */
    EffectIds["InstantDamage"] = "instant_damage";
    /** 跳跃提升 | jump_boost */
    EffectIds["JumpBoost"] = "jump_boost";
    /** 反胃 | nausea */
    EffectIds["Nausea"] = "nausea";
    /** 生命恢复 | regeneration */
    EffectIds["Regeneration"] = "regeneration";
    /** 抗性提升 | resistance */
    EffectIds["Resistance"] = "resistance";
    /** 抗火 | fire_resistance */
    EffectIds["FireResistance"] = "fire_resistance";
    /** 水下呼吸 | water_breathing */
    EffectIds["WaterBreathing"] = "water_breathing";
    /** 隐身 | invisibility */
    EffectIds["Invisibility"] = "invisibility";
    /** 失明 | blindness */
    EffectIds["Blindness"] = "blindness";
    /** 夜视 | night_vision */
    EffectIds["NightVision"] = "night_vision";
    /** 饥饿 | hunger */
    EffectIds["Hunger"] = "hunger";
    /** 虚弱 | weakness */
    EffectIds["Weakness"] = "weakness";
    /** 中毒 | poison */
    EffectIds["Poison"] = "poison";
    /** 凋零 | wither */
    EffectIds["Wither"] = "wither";
    /** 生命提升 | health_boost */
    EffectIds["HealthBoost"] = "health_boost";
    /** 伤害吸收 | absorption */
    EffectIds["Absorption"] = "absorption";
    /** 饱和 | saturation */
    EffectIds["Saturation"] = "saturation";
    /** 飘浮 | levitation */
    EffectIds["Levitation"] = "levitation";
    /** 中毒（致命） | fatal_poison */
    EffectIds["FatalPoison"] = "fatal_poison";
    /** 潮涌能量 | conduit_power */
    EffectIds["ConduitPower"] = "conduit_power";
    /** 缓降 | slow_falling */
    EffectIds["SlowFalling"] = "slow_falling";
    /** 不祥之兆 | bad_omen */
    EffectIds["BadOmen"] = "bad_omen";
    /** 村庄英雄 | village_hero */
    EffectIds["VillageHero"] = "village_hero";
    /** 黑暗 | darkness */
    EffectIds["Darkness"] = "darkness";
    /** 试炼之兆 | trial_omen */
    EffectIds["TrialOmen"] = "trial_omen";
    /** 蓄风 | wind_charged */
    EffectIds["WindCharged"] = "wind_charged";
    /** 盘丝 | weaving */
    EffectIds["Weaving"] = "weaving";
    /** 渗浆 | oozing */
    EffectIds["Oozing"] = "oozing";
    /** 寄生 | infested */
    EffectIds["Infested"] = "infested";
    /** 袭击之兆 | raid_omen */
    EffectIds["RaidOmen"] = "raid_omen";
})(EffectIds || (EffectIds = {}));
/** 颜色与ID 对应表*/
export const colorIdMap = [
    "white", // 0
    "orange", // 1
    "magenta", // 2
    "light_blue", // 3
    "yellow", // 4
    "lime", // 5
    "pink", // 6
    "gray", // 7
    "light_gray", // 8
    "cyan", // 9
    "purple", // 10
    "blue", // 11
    "brown", // 12
    "green", // 13
    "red", // 14
    "black", // 15
];
