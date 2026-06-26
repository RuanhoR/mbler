export type BuildCacheMode = 'none' | 'memory' | 'file' | 'filesystem' | 'auto'
type EffectiveCacheMode = 'none' | 'memory' | 'file'

export class BuildCacheManager {
  private readonly mode: EffectiveCacheMode

  constructor(
    _projectRoot: string,
    mode: BuildCacheMode | undefined,
    _cachePath?: string
  ) {
    this.mode = this.resolveMode(mode)
  }

  public getMode() {
    return this.mode
  }

  public shouldUseIncrementalBuild(): boolean {
    return this.mode !== 'none'
  }

  private resolveMode(mode: BuildCacheMode | undefined): EffectiveCacheMode {
    if (mode === 'none') return 'none'
    return 'file'
  }
}
