import {
  GameLib
} from "gameLib" // 虚拟包名，打包时替换
import {
  config
} from './config.js'
console.log('Hello world')
new GameLib(true)
  .event
  .PlayerAdd((e) =>
    e.player.sendMessage(config.h.toString())
  )