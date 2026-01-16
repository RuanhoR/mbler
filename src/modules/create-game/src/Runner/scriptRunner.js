import { system } from "@minecraft/server";
export class ScriptCancelledError extends Error {
    constructor(id) {
        super(`ScriptRunner with ID '${id}' was cancelled.`);
        this.name = "ScriptCancelledError";
    }
}
export class ScriptRunner {
    id;
    onFinish;
    cancelled = false;
    constructor(id, onFinish) {
        this.id = id;
        this.onFinish = onFinish;
    }
    checkCancelled() {
        if (this.cancelled) {
            throw new ScriptCancelledError(this.id);
        }
    }
    async wait(ticks) {
        this.checkCancelled();
        return new Promise(async (resolve, reject) => {
            await system.waitTicks(ticks);
            if (this.cancelled) {
                reject(new ScriptCancelledError(this.id));
            }
            else {
                resolve();
            }
        });
    }
    do(fn) {
        this.checkCancelled();
        return fn();
    }
    async runSteps(steps) {
        for (const step of steps) {
            await this.do(step);
        }
    }
    async doDelay(fn, ticks) {
        await this.wait(ticks);
        return this.do(fn);
    }
    cancel() {
        this.cancelled = true;
    }
    async run(script) {
        try {
            await script(this);
        }
        catch (e) {
            if (!(e instanceof ScriptCancelledError)) {
                throw e;
            }
        }
        finally {
            this.onFinish(this.id);
        }
    }
    isCancelled() {
        return this.cancelled;
    }
}
