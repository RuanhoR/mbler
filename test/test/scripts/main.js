import {
  GameLib
} from "gameLib"
const game = new GameLib(true);
const {id} = game.event.UseItem(({
  player
}) => { 
  console.log('bb')
  try {
    const ui = game.createFrom("Action", {
      layout: [{
        type: "button",
        param: ["test"]
      }],
      title: "Hello"
    });
    ui.show(player);
  } catch (err) {
    console.log(err.message, err.stack)
  }
});
console.log(JSON.stringify(game.event.stop(id)))