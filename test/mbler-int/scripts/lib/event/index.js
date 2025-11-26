import ui from "./../ui/index"
import {
  world
} from "@minecraft/server"
let scriptUi;
const useItem = ({
  source: player,
  itemStack: item
}) => {
  if (!player.typeId.includes('player')) return;
  console.log(typeof scriptUi.openHomeForm)
  if (item.typeId === "mbler_int:mang_one_int")
    scriptUi.openHomeForm(player, item)
}
const regEvent = (game) => {
  world.afterEvents.itemUse.subscribe(useItem);
  scriptUi = new ui(game)
}
export {
  regEvent
}