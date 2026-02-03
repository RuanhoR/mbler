import {
  world,
  system
} from "@minecraft/server"
import {
  EffectList
} from "./data.js"
import {
  Vector3
} from 'gutils'
const utils = new class {
  DataToplayer({
    dimension,
    id,
    name,
    all
  } = {}) {
    let condition = [];
    let playerList;
    if (all === true) {
      return world.getAllPlayers();
    }
    if (typeof name === 'string') {
      condition[0] = name
    }
    if (typeof id === "number") {
      condition[1] = id;
    }
    if (this.dimensionList.includes(dimension)) {
      playerList = world.getDimension(dimension).getPlayers();
    } else {
      playerList = world.getPlayers();
    }
    for (let player of playerList) {
      let isReturn = true;
      if (condition[0]) {
        if (condition[0] === player.name) {
          isReturn = false;
        }
      }
      if (condition[1]) {
        if (condition[1] === player.id) {
          isReturn = false;
        }
      }
      if (isReturn) return player;
    }
    return playerList[0];
  }
  DateToblock({
    dimension,
    Location
  } = {}) {
    return world
      .getDimension(this.dimensionList.includes(dimension) ? 
      dimension : 
      this.dimensionList[0]).getBlock(Location)
  }
  playerToData(player) {
    if (!this.isEntityObject(player)) {
      throw new TypeError("ERR_NOT_A_Player")
    }
    return {
      id: player.id,
      all: false
    }
  }
  isEntityObject(player) {
    if (typeVerify({
        id: player.id,
        name: player.name,
        dimension: player.dimension,
        location: player.location
      }, {
        id: "number",
        name: "string",
        dimension: "object",
        location: "object"
      }) && player.isValid) return true;
    return false
  }
  constructor() {
    this.dimensionList = [
      'overworld',
      'nether',
      'the_end'
    ]
  }
  typeVerify(Object, ObjectSet) {
    const result = [];
    for (let [key, data] of Object.entries(Object)) {
      const type = ObjectSet[key];
      if (typeof type !== 'string') throw new TypeError('ERR_INPUT');
      if (typeof data === type) {
        if (typeof data === 'object') {
          if (this.isObject(data)) {
            result.push(true);
            continue;
          }
        }
        result.push(true)
        continue;
      }
      result.push(false)
    }
    return !result.includes(false);
  }
  isObject(Obj) {
    return (typeof Obj === "object" && !Array.isArray(Obj))
  }
  isIterator(obj) {
    return typeof obj[Symbol.iterator] === "function" ? true : false
  }
  getEffect(name) {
    let Use_name = null;
    const Effect = Object.keys(EffectList)
    if (typeof name === "number" && Effect[name]) Use_name = Effect[name]
    if (typeof name === "string" && Effect.includes(name)) Use_name = name;
    if (Use_name === null) throw new TypeError("ERR no match the EffectName");
    return Use_name;
  }
  in(num, min, max) {
    return (num >= min && num <= max)
  }
}
export {
  Vector3,
  utils
}