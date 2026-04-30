import i18n from "../i18n";
import { ConfigManger } from "../publisher/configManger";
import { CliParam } from "../types";
import { showText } from "../utils";

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function parseValue(raw: string): unknown {
  const v = raw.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(v)) {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  try {
    return JSON.parse(v);
  } catch {
    return raw;
  }
}

function valueToString(value: unknown): string {
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export async function configCommand(cliParam: CliParam, _: string) {
  const sub = cliParam.params[1];
  try {
    if (!sub) {
      showText(i18n.config.usage);
      return -1;
    }

    if (sub === "get") {
      const key = cliParam.params[2];
      if (!key) {
        showText(i18n.config.missingArg);
        return -1;
      }
      const value = await ConfigManger.getKey<unknown>(key);
      showText(fmt(i18n.config.getResult, { key, value: valueToString(value) }));
      return 0;
    }

    if (sub === "set") {
      const key = cliParam.params[2];
      const raw = cliParam.params.slice(3).join(" ");
      if (!key || raw.length < 1) {
        showText(i18n.config.missingArg);
        return -1;
      }
      const value = parseValue(raw);
      const ok = await ConfigManger.setKey(key, value);
      if (!ok) {
        showText(fmt(i18n.config.failed, { error: "write failed" }));
        return -1;
      }
      showText(fmt(i18n.config.setSuccess, { key, value: valueToString(value) }));
      return 0;
    }

    if (sub === "point") {
      const next = cliParam.params[2];
      if (!next || next === "get") {
        const point = await ConfigManger.getConfigPoint();
        showText(fmt(i18n.config.pointGet, { path: point }));
        return 0;
      }
      try {
        await ConfigManger.setConfigPoint(next);
        showText(fmt(i18n.config.pointSetSuccess, { path: next }));
        return 0;
      } catch (error) {
        showText(fmt(i18n.config.pointSetFailed, {
          error: error instanceof Error ? error.message : String(error),
        }));
        return -1;
      }
    }

    showText(i18n.config.usage);
    return -1;
  } catch (error) {
    showText(fmt(i18n.config.failed, {
      error: error instanceof Error ? error.message : String(error),
    }));
    return -1;
  }
}
