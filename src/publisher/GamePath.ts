import i18n from '../i18n'
import { input } from '../utils'
import { ConfigManager } from './configManager'

export class GamePath {
  /**
   * Ask user mcbe game path
   * @param autoset - Can auto set game path to config
   * @returns {Promise<string>} - Game Path
   */
  static async askPath(autoset: boolean = true): Promise<string> {
    const result = await input(i18n.publish.askTip)
    if (!result) {
      throw new Error('No path provided')
    }
    if (autoset) {
      ConfigManager.setKey('gamePath', result)
    }
    return result
  }
  static async getPath(): Promise<string | null> {
    const path = await ConfigManager.getKey<string>('gamePath')
    return path || null
  }
  static async clearPath() {
    await ConfigManager.setKey('gamePath', '')
  }
  static async getPathWithASK(): Promise<string> {
    let path = await this.getPath()
    if (!path) {
      path = await this.askPath()
    }
    return path
  }
}
