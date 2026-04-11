import { world, system, Player, Dimension, Entity } from '@minecraft/server'
import { EffectList } from './data'
import { Vector3 as UtilsVector3, Vector3Type } from './gutils'

interface DimensionList {
  dimensionList: string[];
}

interface TypeVerifySet {
  [key: string]: string;
}

interface EntityData {
  id?: number;
  name?: string;
  dimension?: object;
  location?: object;
}

interface PlayerSearchParams {
  dimension?: string;
  id?: number;
  name?: string;
  all?: boolean;
}

interface BlockSearchParams {
  dimension?: string;
  Location?: UtilsVector3;
}

interface TypeVerificationResult {
  [key: string]: boolean;
}

class UtilsClass {
  private dimensionList: string[];

  constructor() {
    this.dimensionList = ['overworld', 'nether', 'the_end'];
  }

  DataToPlayer(params: PlayerSearchParams = {}): Player | Player[] | undefined {
    const { dimension, id, name, all } = params;
    let condition: (string | number | undefined)[] = [];
    let playerList: Player[];

    if (all === true) {
      return world.getAllPlayers();
    }

    if (typeof name === 'string') {
      condition[0] = name;
    }
    if (typeof id === 'number') {
      condition[1] = id;
    }

    if (this.dimensionList.includes(dimension || '')) {
      const dimensionObj = world.getDimension(dimension || 'overworld');
      playerList = dimensionObj.getPlayers();
    } else {
      playerList = world.getPlayers();
    }

    for (const player of playerList) {
      let isReturn = true;
      if (condition[0] && condition[0] === player.name) {
        isReturn = false;
      }
      if (condition[1] && condition[1] === player.id) {
        isReturn = false;
      }
      if (isReturn) return player;
    }

    return playerList[0];
  }

  DataToBlock(params: BlockSearchParams = {}): any {
    const { dimension, Location } = params;
    return world
      .getDimension(
        ((dimension && this.dimensionList.includes(dimension))
          ? dimension
          : this.dimensionList[0]) as string
      )
      .getBlock(Location ? (Location as any).toMinecraftVector3?.() || Location : new UtilsVector3().toMinecraftVector3());
  }

  playerToData(player: Player): { id: string; all: boolean } {
    if (!this.isEntityObject(player)) {
      throw new TypeError('ERR_NOT_A_Player');
    }
    return {
      id: player.id.toString(),
      all: false,
    };
  }

  isEntityObject(entity: any): boolean {
    const self = this;

    function typeVerify(obj: any, typeSet: TypeVerifySet): boolean {
      const result: boolean[] = [];
      for (const [key, data] of Object.entries(obj)) {
        const expectedType = typeSet[key];
        if (typeof expectedType !== 'string') throw new TypeError('ERR_INPUT');

        if (typeof data === expectedType) {
          if (typeof data === 'object') {
            if (self.isObject(data)) {
              result.push(true);
              continue;
            }
          }
          result.push(true);
          continue;
        }
        result.push(false);
      }
      return !result.includes(false);
    }

    if (
      typeVerify(
        {
          id: entity.id,
          name: entity.name,
          dimension: entity.dimension,
          location: entity.location,
        },
        {
          id: 'number',
          name: 'string',
          dimension: 'object',
          location: 'object',
        }
      ) &&
      entity.isValid
    ) {
      return true;
    }
    return false;
  }

  typeVerify(obj: any, typeSet: TypeVerifySet): boolean {
    const result: boolean[] = [];
    for (const [key, data] of Object.entries(obj)) {
      const expectedType = typeSet[key];
      if (typeof expectedType !== 'string') throw new TypeError('ERR_INPUT');

      if (typeof data === expectedType) {
        if (typeof data === 'object') {
          if (this.isObject(data)) {
            result.push(true);
            continue;
          }
        }
        result.push(true);
        continue;
      }
      result.push(false);
    }
    return !result.includes(false);
  }

  isObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  }

  isIterator(obj: any): boolean {
    return typeof obj[Symbol.iterator] === 'function';
  }

  getEffect(name: string | number): string {
    let useName: string | null = null;
    const effectKeys = Object.keys(EffectList);

    if (typeof name === 'number' && effectKeys[name]) {
      useName = effectKeys[name];
    }
    if (typeof name === 'string' && effectKeys.includes(name)) {
      useName = name;
    }
    if (useName === null) {
      throw new TypeError('ERR no match the EffectName');
    }
    return useName;
  }

  in(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
  }
}

const utils = new UtilsClass();
export { UtilsVector3 as Vector3, utils };