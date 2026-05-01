import * as path from "node:path";
import * as fs from "node:fs";
import config from "../config";
import { json } from "npm-registry-fetch";
import { compareVersion } from "../utils";
import { npmFetchData } from "../types";
export interface cacheValue {
  formal: string;
  beta: string;
}


/**
 * Compare two dotted version strings ("major.minor.patch").
 * Returns negative if a < b, positive if a > b, zero if equal.
 */

const exp = (function (): {
  refresh: () => Promise<void>;
  generateVersion: (
    module: "@minecraft/server-ui" | "@minecraft/server",
    mcVersion: string,
    isBeta: boolean,
  ) => Promise<string>;
} {
  const cacheFile = path.join(config.tmpdir, "_sapi_version.json");
  // cacheData is an array of entries keyed by the embedded mc version string
  let cacheData: Array<{
    version: string;
    server: cacheValue;
    "server-ui": cacheValue;
  }> | null = null;

  /**
   * Pull every published version for a package and reduce it to a mapping
   * from the embedded Minecraft version (e.g. "1.21.60") to the most
   * recent formal/beta release we were able to parse.
   */
  async function fetchData(pkgName: string): Promise<
    Record<
      string,
      cacheValue & {
        _v: number;
      }
    >
  > {
    const data = (await json(`/${pkgName}`)) as unknown as npmFetchData;
    const pkgVersions = Object.keys(data.versions);
    const reValue: Record<
      string,
      cacheValue & {
        _v: number; // internal marker used during reduction
      }
    > = {};

    // helper to extract the embedded MC version ("yyyy") from a full
    // npm package version string. returns null when the expected pattern
    // cannot be found.
    const mcVersionFrom = (str: string): string | null => {
      const m = str.match(/-(?:rc|beta)(?:\.[^-.]+)*?\.((?:\d+\.){2}\d+)/);
      return m ? m[1] as string : null;
    };

    for (const v of pkgVersions) {
      const mcVersion = mcVersionFrom(v);
      if (!mcVersion) continue;

      const isStable = /(?:-stable)(?:$|[-.])/.test(v);
      let entry = reValue[mcVersion];
      if (!entry) {
        entry = { formal: "", beta: "", _v: -1 };
        reValue[mcVersion] = entry;
      }

      if (isStable) {
        // pick the lexically greatest stable version string
        if (!entry.formal || v > entry.formal) {
          entry.formal = v;
        }
        entry._v = Infinity;
      } else {
        // non-stable release; treat everything else as a beta candidate
        if (!entry.beta || v > entry.beta) {
          entry.beta = v;
        }
        if (entry._v !== Infinity) entry._v = 1;
      }
    }

    return reValue;
  }

  async function refresh() {
    // grab the two packages we care about and merge the keys
    const serverMap = await fetchData("@minecraft/server");
    const uiMap = await fetchData("@minecraft/server-ui");
    const versions = new Set<string>([
      ...Object.keys(serverMap),
      ...Object.keys(uiMap),
    ]);

    const arr: Array<{
      version: string;
      server: cacheValue;
      "server-ui": cacheValue;
    }> = [];

    for (const ver of Array.from(versions)) {
      arr.push({
        version: ver,
        server: serverMap[ver]
          ? { formal: serverMap[ver].formal, beta: serverMap[ver].beta }
          : { formal: "", beta: "" },
        "server-ui": uiMap[ver]
          ? { formal: uiMap[ver].formal, beta: uiMap[ver].beta }
          : { formal: "", beta: "" },
      });
    }

    arr.sort((a, b) => compareVersion(a.version, b.version));
    cacheData = arr;

    await fs.promises
      .mkdir(config.tmpdir, { recursive: true })
      .catch(() => void 0);
    await fs.promises.writeFile(
      cacheFile,
      JSON.stringify(arr, null, 2),
      "utf-8",
    );
  }

  async function generateVersion(
    module: "@minecraft/server-ui" | "@minecraft/server",
    mcVersion: string,
    isBeta: boolean,
  ): Promise<string> {
    if (!cacheData) {
      try {
        const txt = await fs.promises.readFile(cacheFile, "utf-8");
        cacheData = JSON.parse(txt);
      } catch {
        await refresh();
      }
    }

    if (!cacheData) {
      throw new Error("unable to load sapi cache data");
    }

    // try exact match first
    let entry = cacheData.find((e) => e.version === mcVersion);
    if (!entry) {
      // find closest entry less than or equal to requested version
      const sorted = cacheData.slice();
      let candidate: (typeof sorted)[0] | null = null;
      for (const e of sorted) {
        if (compareVersion(e.version, mcVersion) <= 0) {
          candidate = e;
        } else {
          break;
        }
      }
      if (!candidate) {
        candidate = sorted[0] as {
          version: string;
          server: cacheValue;
          "server-ui": cacheValue;
        };
      }
      entry = candidate;
    }
    const moduleKey = module === "@minecraft/server" ? "server" : "server-ui";
    const entryModule = entry[moduleKey];
    let result = isBeta ? entryModule.beta : entryModule.formal;
    if (!result) {
      // fall back to whatever is available
      result = entryModule.formal || entryModule.beta;
    }
    const tmp = result.split("-").slice(0, 2) as [string, string];
    tmp[1] = tmp[1].split(".")[0] as string;
    result = tmp.join("-")
    return result || "";
  }

  return {
    refresh,
    generateVersion,
  };
})();

export default exp;
