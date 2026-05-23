export type BuildCacheMode = "none" | "memory" | "file" | "filesystem" | "auto"
type EffectiveCacheMode = "none" | "memory" | "file"

export class BuildCacheManager {
  private readonly mode: EffectiveCacheMode

  constructor(
    _projectRoot: string,
    mode: BuildCacheMode | undefined,
    private readonly isWatch: boolean,
    _cachePath?: string
  ) {
    this.mode = this.resolveMode(mode)
  }

  public getMode() {
    return this.mode
  }

  public shouldUseIncrementalBuild(): boolean {
    return this.mode !== "none"
  }

  private resolveMode(mode: BuildCacheMode | undefined): EffectiveCacheMode {
    const value = mode ?? "auto"
    if (value === "none") return "none"
    return "file"
  }
}
