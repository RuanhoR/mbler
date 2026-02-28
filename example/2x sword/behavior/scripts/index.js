const config = {
  itemId: "§r§6§lmbler_test_2xsword:as§r§l	§8 二倍剑",
  ForRanger: 2
}
import {
  EntityComponentTypes,
  EquipmentSlot,
  world,
  system
} from "@minecraft/server"
world.afterEvents.entityDie.subscribe(({
  deadEntity: entity,
  damageSource: source
}) => {
system.run(()=>{  try { // 排除非正常人
    if (!source.typeId.includes("player") || !getMainHand(source).nameTag.includes(config.itemId)) return;
  } catch {}
  for (let i = 0; i < config.ForRanger; i++) {
    try {
      entity.dimension.spawnEntity(entity.typeId)
    } catch (err){
      console.error(err)
    }
  }})
})