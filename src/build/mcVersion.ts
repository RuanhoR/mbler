// 此模块用于根据mc版本生成script api版本
import * as utils from './../utils/index.js';

// 版本资源表
const VERSION_TABLE = require('./../data/version.json').version;

interface VersionItem {
  range: [string, string];
  format: {
    server: string;
    server_ui: string;
  };
  beta: {
    server: string;
    server_ui: string;
  };
}

interface VersionMatchResult {
  item: VersionItem;
  match: 'exact' | 'fallback' | 'oldest';
  start: string;
  end: string;
}

// 转字符串
const normalize = (v: string): string => {
  return String(v || '')
    .trim();
};

const parts = (v: string): number[] => {
  return normalize(v)
    .split('.')
    .slice(0, 3)
    .map((n: string): number => parseInt(n, 10) || 0);
};

const compareVer = (a: string, b: string): number => {
  const A = parts(a);
  const B = parts(b);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i])
      return A[i] > B[i] ? 1 : -1;
  }
  return 0;
};

const findMatch = (version: string): VersionMatchResult => {
  const v = normalize(version);
  for (const item of VERSION_TABLE) {
    // 遍历查找
    const [start, end] = item.range;
    if (compareVer(v, start) >= 0 && compareVer(v, end) <= 0) {
      return {
        item,
        match: 'exact',
        start,
        end
      };
    }
  }
  const sorted = [
    ...VERSION_TABLE
  ].sort(
    (a: VersionItem, b: VersionItem): number => compareVer(
      b.range[0],
      a.range[0]
    )
  );
  for (const item of sorted) {
    if (compareVer(v, item.range[0]) >= 0) {
      return {
        item,
        match: 'fallback',
        start: item.range[0],
        end: item.range[1]
      };
    }
  }
  const last = sorted[sorted.length - 1];

  return {
    item: last,
    match: 'oldest',
    start: last.range[0],
    end: last.range[1]
  };
};

interface McVersionGeter {
  ToServer(version: string, useBeta?: boolean): string;
  ToServerUi(version: string, useBeta?: boolean): string;
}

export const mcVersionGeter: McVersionGeter = {
  /**
   * @param version Minecraft版本号
   * @param useBeta 是否返回Beta版本
   */
  ToServer(version: string, useBeta: boolean = false): string {
    const {
      item,
      match,
      start,
      end
    } = findMatch(version);
    if (match !== 'exact') console.warn(`⚠️ 使用兼容版本 ${start}-${end}（输入：${version}）`);
    return useBeta ? item.beta.server : item.format.server;
  },

  /**
   * @param version Minecraft版本号
   * @param useBeta 是否返回Beta版本
   */
  ToServerUi(version: string, useBeta: boolean = false): string {
    const {
      item,
      match,
      start,
      end
    } = findMatch(version);
    if (match !== 'exact') console.warn(`⚠️ 使用兼容版本 ${start}-${end}（输入：${version}）`);
    return useBeta ? item.beta.server_ui : item.format.server_ui;
  }
};