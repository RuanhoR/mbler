"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCXCompileData = exports.JsCompileData = void 0;
var JsCompileData = /** @class */ (function () {
    function JsCompileData(node, BuildCache) {
        if (BuildCache === void 0) { BuildCache = {
            export: [],
            import: [],
            call: []
        }; }
        this.node = node;
        this.BuildCache = BuildCache;
        this.File = "__repl";
        this.isFile = false;
    }
    JsCompileData.prototype.setFilePath = function (dir) {
        this.isFile = true;
        this.File = dir;
    };
    return JsCompileData;
}());
exports.JsCompileData = JsCompileData;
var MCXCompileData = /** @class */ (function () {
    function MCXCompileData(raw, JSIR) {
        this.raw = raw;
        this.JSIR = JSIR;
        this.File = "";
        this.isFile = false;
    }
    MCXCompileData.prototype.setFilePath = function (dir) {
        this.JSIR.setFilePath(dir);
        this.isFile = true;
        this.File = dir;
    };
    return MCXCompileData;
}());
exports.MCXCompileData = MCXCompileData;
