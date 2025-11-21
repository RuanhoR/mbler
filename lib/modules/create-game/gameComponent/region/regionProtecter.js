import {
  world,
} from "@minecraft/server";
import {
  GameComponent
} from "../gameComponent";
export class RegionProtector extends GameComponent {
  onAttach() {
    if (!this.options)
      return;
    // 处理破坏方块
    if (this.options.blockBreakInside || this.options.blockBreakOutside) {
      this.subscribe(world.beforeEvents.playerBreakBlock, (t) => {
        if (this.options?.groupSet &&
          !this.options.groupSet.has(t.player.id)) {
          return;
        }
        this.handleBreak(t);
      });
    }
    // 处理方块交互
    if (this.options.blockInteractOutside ||
      this.options.blockInteractInside) {
      this.subscribe(world.beforeEvents.playerInteractWithBlock, (t) => {
        if (this.options?.groupSet &&
          !this.options.groupSet.has(t.player.id)) {
          return;
        }
        this.handleInteract(t);
      });
    }
  }
  handleBreak(t) {
    if (this.options.blockBreakInside &&
      this.options.region.isBlockInside(t.block.location)) {
      t.cancel = true;
    } else if (this.options.blockBreakOutside &&
      !this.options.region.isBlockInside(t.block.location)) {
      t.cancel = true;
    }
  }
  handleInteract(t) {
    if (this.options.blockInteractInside &&
      this.options.region.isBlockInside(t.block.location)) {
      t.cancel = true;
    } else if (this.options.blockInteractOutside &&
      !this.options.region.isBlockInside(t.block.location)) {
      t.cancel = true;
    }
  }
}