import { ItemBagUI } from "../ui/index";
import { GameLib } from "../../gameLib";
import { world, Player, ItemStack } from "@minecraft/server";

let scriptUi: ItemBagUI;

interface UseItemEvent {
  source: Player;
  itemStack: ItemStack;
}

const useItem = ({ source: player, itemStack: item }: UseItemEvent) => {
  if (!player.typeId.includes('player')) return;
  if (item.typeId === "mbler_int:mang_one_int") {
    scriptUi.openHomeForm(player, item);
  }
};

export const regEvent = (game: GameLib) => {
  world.afterEvents.itemUse.subscribe(useItem);
  scriptUi = new ItemBagUI(game);
};