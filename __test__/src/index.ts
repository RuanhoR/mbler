import assert from "node:assert";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import Build, { build, watch } from "../../src/build";
import { cli } from "../../src/cli";
import i18n from "../../src/i18n";
import { CliParam } from "../../src/types";

// helper to create a temporary minimal addon project
async function createTempProject(): Promise<string> {
  const tmp = path.join(os.tmpdir(), `mbler-test-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  // behavior/scripts/index.js
  const behav = path.join(tmp, "behavior", "scripts");
  mkdirSync(behav, { recursive: true });
  writeFileSync(
    path.join(behav, "index.js"),
    "console.log('hello from script');",
  );
  // resources folder
  mkdirSync(path.join(tmp, "resources"), { recursive: true });
  // minimal config
  const cfg = {
    name: "temp",
    description: "test addon",
    version: "0.0.1",
    mcVersion: "1.21.100",
    script: {
      main: "index.js",
    },
  };
  writeFileSync(path.join(tmp, "mbler.config.json"), JSON.stringify(cfg, null, 2));
  return tmp;
}

async function cleanupTemp(project: string) {
  try {
    rmSync(project, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

async function testBuild() {
  const project = await createTempProject();
  try {
    const code = await build({ params: [], opts: {} }, project);
    assert.strictEqual(code, 0, "build returned non-zero status");
    // check output files
    const outScript = path.join(project, "dist", "dep", "scripts", "index.js");
    assert.strictEqual(existsSync(outScript), true, "output script not found");
    const manifest = path.join(project, "dist", "dep", "manifest.json");
    assert.strictEqual(existsSync(manifest), true, "behavior manifest not generated");
  } finally {
    await cleanupTemp(project);
  }
}

async function testWatchStartsAndStops() {
  const project = await createTempProject();
  try {
    const promise = watch({ params: [], opts: {} }, project);
    // give a little time for rollup to build
    await new Promise((r) => setTimeout(r, 500));
    const code = await promise;
    assert.strictEqual(code, 0, "watch wrapper returned non-zero status");
    // now try to use the new public API to open/close watchers
    const builder = new Build({}, project, () => {});
    await builder.start();
    const w = await builder.watch();
    assert.ok(w, "watchers should be returned");
    builder.closeWatchers();
  } finally {
    await cleanupTemp(project);
  }
}

async function testCliHelp() {
  // capture stdout temporarily
  const origWrite = process.stdout.write;
  let output = "";
  (process.stdout as any).write = (str: string) => {
    output += str;
    return true;
  };
  try {
    await cli(); // running with no args prints description
    assert.ok(output.includes(i18n.description), "help output not printed");
  } finally {
    (process.stdout as any).write = origWrite;
  }
}

async function testI18nSwitch() {
  const langClass = i18n.__internal.class;
  const current = langClass.currenyLang;
  const other = current === "zh" ? "en" : "zh";
  assert.strictEqual(langClass.set(other), true);
  const obj = await langClass.get();
  assert.ok(obj, "language object should be returned");
  // restore original
  langClass.set(current);
}

(async () => {
  try {
    console.log("running mble tests...");
    await testBuild();
    await testWatchStartsAndStops();
    await testCliHelp();
    await testI18nSwitch();
    console.log("all tests passed");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
