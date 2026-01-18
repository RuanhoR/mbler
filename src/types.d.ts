
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;

// 日志相关
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type LogMessage = string | Error | object | unknown;

// 文件操作相关
export interface ParseReadFileOpt {
  delay: number;
  maxRetries: number;
  want: 'string' | 'object';
}
export type ReadFileOpt = Partial<ParseReadFileOpt>;

// 项目配置相关
export interface MblerDesConfig {
  [key: string]: string;
}

export interface MblerConfigScript {
  ui ?: boolean;
  lang?: string;
  main : string;
  dependencies?: MblerDesConfig;
  UseBeta ?: boolean 
}
export interface MblerConfigOutdir {
  behavior ?: string
  resources ?: string
  dist : string
}
export interface MblerConfigData {
  name: string;
  outdir ?: MblerConfigOutdir
  description: string;
  version: string;
  mcVersion: string | string[];
  script?: MblerConfigScript;
  minify?: boolean;
}

// 模块包处理相关
export interface HandlerPackageResult {
  des: Record<string, string>;
  ui: boolean;
  main: string;
  name: string;
  version: string;
  description: string;
}

export interface HandlerPackageDes {
  des: string[];
}