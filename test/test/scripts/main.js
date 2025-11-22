import {
  GameLib
} from "gameLib"
const game = new GameLib(true);
const ui = game.createFrom("Action", {
  layout: [{
    type: "button",
    param: [
      "test"
    ]
  }],
  title: "Hello"
})
game.event.UseItem(({
  player
}) => {
  ui.show(player)
})