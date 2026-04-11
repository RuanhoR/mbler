import {
  Player,
  world
} from "@minecraft/server"
console.log("console in ts minecraft");

(world.getPlayers()[0] as unknown as Player).sendMessage('text')