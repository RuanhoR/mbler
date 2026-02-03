
interface ItemComponentOpt {
  id: string
  name: string
  format: string
  components: {
    offHand: boolean
    damage: number
    DestroyInCreate: boolean
    icon: string
  }
}
type JSONValue<T> = T | {
  value: T
}
type ItemGroupEnum = "minecraft:itemGroup.name.planks" | "minecraft:itemGroup.name.walls" | "minecraft:itemGroup.name.fence" | "minecraft:itemGroup.name.fenceGate" | "minecraft:itemGroup.name.glass" | "minecraft:itemGroup.name.trapdoor" | "minecraft:itemGroup.name.door" | "minecraft:itemGroup.name.stairs" | "minecraft:itemGroup.name.glassPane" | "minecraft:itemGroup.name.slab" | "minecraft:itemGroup.name.stoneBrick" |  "minecraft:itemGroup.name.sandstone" | "minecraft:itemGroup.name.copper" | "minecraft:itemGroup.name.wool" | "minecraft:itemGroup.name.woolCarpet" | "minecraft:itemGroup.name.concretePowder" | "minecraft:itemGroup.name.concrete" | "minecraft:itemGroup.name.stainedClay" | "minecraft:itemGroup.name.glazedTerracotta" | "minecraft:itemGroup.name.ore" | "minecraft:itemGroup.name.stone" | "minecraft:itemGroup.name.log" | "minecraft:itemGroup.name.wood" | "minecraft:itemGroup.name.leaves" | "minecraft:itemGroup.name.sapling" | "minecraft:itemGroup.name.seed" | "minecraft:itemGroup.name.crop" | "minecraft:itemGroup.name.grass" | "minecraft:itemGroup.name.coral_decorations" | "minecraft:itemGroup.name.flower" | "minecraft:itemGroup.name.dye" | "minecraft:itemGroup.name.rawFood" | "minecraft:itemGroup.name.mushroom" | "minecraft:itemGroup.name.monsterStoneEgg" | "minecraft:itemGroup.name.mobEgg" |  "minecraft:itemGroup.name.coral" | "minecraft:itemGroup.name.sculk" | "minecraft:itemGroup.name.helmet" | "minecraft:itemGroup.name.chestplate" | "minecraft:itemGroup.name.leggings" | "minecraft:itemGroup.name.boots" | "minecraft:itemGroup.name.sword" | "minecraft:itemGroup.name.axe" | "minecraft:itemGroup.name.pickaxe" | "minecraft:itemGroup.name.shovel" | "minecraft:itemGroup.name.hoe" | "minecraft:itemGroup.name.arrow" | "minecraft:itemGroup.name.cookedFood" | "minecraft:itemGroup.name.miscFood" | "minecraft:itemGroup.name.goatHorn" | "minecraft:itemGroup.name.bundles" | "minecraft:itemGroup.name.horseArmor" | "minecraft:itemGroup.name.potion" | "minecraft:itemGroup.name.splashPotion" | "minecraft:itemGroup.name.lingeringPotion" | "minecraft:itemGroup.name.ominousBottle" | "minecraft:itemGroup.name.bed" | "minecraft:itemGroup.name.candles" | "minecraft:itemGroup.name.anvil" | "minecraft:itemGroup.name.chest" | "minecraft:itemGroup.name.shulkerBox" | "minecraft:itemGroup.name.record" | "minecraft:itemGroup.name.sign" | "minecraft:itemGroup.name.hanging_sign" | "minecraft:itemGroup.name.skull" | "minecraft:itemGroup.name.boat" | "minecraft:itemGroup.name.chestboat" | "minecraft:itemGroup.name.rail" | "minecraft:itemGroup.name.minecart" | "minecraft:itemGroup.name.buttons" | "minecraft:itemGroup.name.pressurePlate" | "minecraft:itemGroup.name.banner_pattern" | "minecraft:itemGroup.name.potterySherds" | "minecraft:itemGroup.name.smithing_templates" 
interface ItemJSON {
  format_version: string
  "minecraft:item": {
    description: {
      identifier: string
      category ?: string
      menu_category ?: {
        category: string
        group: ItemGroupEnum
      }
    }
    components: {
      "minecraft:display_name" ?: JSONValue<string>,
      "minecraft:allow_off_hand" ?: JSONValue<boolean>
      "minecraft:can_destroy_in_creative" ?: JSONValue<boolean>,
      "minecraft:compostable" ?: {
        composting_chance: number
      },
      "minecraft:cooldown" ?: {
        category: string
        // 正整数 10 进制
        duration: number
        type: "use" | "attack"
      },
      "minecraft:damage" ?: JSONValue<number>
      "minecraft:icon" ?: JSONValue<string>
    }
  }
}
export type {
  ItemComponentOpt,
  ItemGroupEnum,
  ItemJSON
}