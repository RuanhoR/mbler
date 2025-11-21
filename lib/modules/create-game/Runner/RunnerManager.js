import { system } from "@minecraft/server";
import { Logger } from "../utils/index";
import { ScriptRunner } from "./scriptRunner";
export class RunnerManager {
    runners = new Map();
    idCounter = 0;
    logger;
    constructor(stateName) {
        this.logger = new Logger(stateName + "-runner");
    }
    /**返回一个新的scriptRunner(需手动捕获错误) */
    new() {
        const id = `runner-${++this.idCounter}`;
        const runner = new ScriptRunner(id, (finishedId) => {
            this.runners.delete(finishedId);
        });
        this.runners.set(id, runner);
        return { id: id, runner: runner };
    }
    /**
     * 运行普通脚本
     */
    run(script) {
        const { id, runner } = this.new();
        runner.run(script).catch((e) => {
            this.logger.error(`runner ${id} 出错了:`, e);
        });
        return id;
    }
    runDelay(script, ticks) {
        const { id, runner } = this.new();
        // 先等待 ticks 再执行
        runner
            .run(async (r) => {
            await r.wait(ticks);
            await script(r);
        })
            .catch((e) => {
            this.logger.error(`runner ${id} 出错了:`, e);
        });
        return id;
    }
    /**
     * 使用游戏 runJob 运行 generator
     */
    runJob(generator) {
        const id = `runner-${++this.idCounter}`;
        const wrapped = wrapGeneratorWithPromise(generator);
        const runId = system.runJob(wrapped.gen);
        // 用对象保存 runId，方便取消
        this.runners.set(id, { runId });
        return { id, promise: wrapped.promise };
    }
    /**
     * 取消指定 runner 或 job
     */
    cancel(id) {
        const entry = this.runners.get(id);
        if (!entry)
            return false;
        if (entry instanceof ScriptRunner) {
            entry.cancel();
        }
        else if ("runId" in entry) {
            system.clearRun(entry.runId);
        }
        this.runners.delete(id);
        return true;
    }
    /**
     * 取消所有 runner/job
     */
    dispose() {
        for (const entry of this.runners.values()) {
            if (entry instanceof ScriptRunner) {
                entry.cancel();
            }
            else if ("runId" in entry) {
                system.clearJob(entry.runId);
            }
        }
        this.runners.clear();
    }
    get size() {
        return this.runners.size;
    }
}
function wrapGeneratorWithPromise(gen) {
    let resolveFn;
    let rejectFn;
    const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
    });
    function* wrapper() {
        try {
            let next = gen.next();
            while (!next.done) {
                yield;
                next = gen.next();
            }
            resolveFn();
        }
        catch (err) {
            rejectFn(err);
        }
    }
    return { gen: wrapper(), promise };
}
