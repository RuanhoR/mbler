import { writeFile } from 'node:fs/promises'
import config from '../config'
import { MNXPackageInfoResult, MNXPackageVersionInfoResult } from '../types'

export class InstallManager {
  private static encodeScope(scope: string): string {
    return encodeURIComponent(scope.startsWith('@') ? scope : `@${scope}`)
  }
  private static encodePart(v: string): string {
    return encodeURIComponent(v)
  }
  static async download(
    scope: string,
    name: string,
    version: string,
    outputPath: string
  ) {
    const response = await fetch(
      `${config.defaultPmnxBASE}/package/${this.encodeScope(scope)}/${this.encodePart(name)}/v/${this.encodePart(version)}/download`
    )
    if (!response.ok) {
      throw new Error(
        `Failed to download package: ${response.status} ${response.statusText}`
      )
    }
    const buffer = await response.arrayBuffer()
    await writeFile(outputPath, Buffer.from(buffer))
  }
  static async info(
    scope: string,
    name: string
  ): Promise<MNXPackageInfoResult> {
    const response = await fetch(
      `${config.defaultPmnxBASE}/package/${this.encodeScope(scope)}/${this.encodePart(name)}/info`
    )
    const data = (await response.json()) as {
      code: number
      data: MNXPackageInfoResult
    }
    if (data.code !== 200) {
      throw new Error(
        `Failed to get package info: ${JSON.stringify(data.data)}`
      )
    }
    return data.data
  }
  static async versionInfo(
    scope: string,
    name: string,
    version: string
  ): Promise<MNXPackageVersionInfoResult> {
    const response = await fetch(
      `${config.defaultPmnxBASE}/package/${this.encodeScope(scope)}/${this.encodePart(name)}/v/${this.encodePart(version)}/info`
    )
    if (!response.ok) {
      throw new Error(
        `Failed to get package version info: ${response.status} ${response.statusText}`
      )
    }
    const data = (await response.json()) as {
      code: number
      data: MNXPackageVersionInfoResult
    }
    if (data.code !== 200) {
      throw new Error(
        `Failed to get package version info: ${JSON.stringify(data.data)}`
      )
    }
    return data.data
  }
}
