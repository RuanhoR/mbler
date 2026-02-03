"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var promises_1 = require("node:fs/promises");
var Parser = require("@babel/parser");
var t = require("@babel/types");
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.FileAST = function (fileDir, parserOpt) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof fileDir !== "string")
                            throw new TypeError("[read file]: compile utils was passed a non-string value");
                        return [4 /*yield*/, (0, promises_1.readFile)(fileDir, "utf-8")];
                    case 1:
                        file = _a.sent();
                        if (typeof file !== "string")
                            throw new Error("[read file]: not found file " + fileDir);
                        try {
                            return [2 /*return*/, Parser.parse(file).program];
                        }
                        catch (err) {
                            throw new Error("[compile ast]: " + err.stack);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Utils.FileContent = function (fileDir) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, promises_1.readFile)(fileDir, "utf-8")];
                    case 1:
                        file = _a.sent();
                        return [2 /*return*/, file];
                }
            });
        });
    };
    Utils.nodeStringValue = function (node) {
        if (node.type == "StringLiteral") {
            return node.value;
        }
        else if (node.type == "Identifier") {
            return node.name;
        }
        throw new TypeError("[read id error]: no way to read string id");
    };
    Utils.CheckImportNode = function (node, ir) {
        var newList = Utils.ImportToCache(node);
        // Eliminate common differences
        if (newList.source !== ir.source)
            return false;
        if (newList.imported.length !== ir.imported.length)
            return false;
        // in this for, newList.imported and ir.imported is same length
        for (var irIndex = 0; irIndex < newList.imported.length; irIndex++) {
            var newItem = newList.imported[irIndex];
            var oldItem = ir.imported[irIndex];
            if ((newItem === null || newItem === void 0 ? void 0 : newItem.import) !== (oldItem === null || oldItem === void 0 ? void 0 : oldItem.import) || (newItem === null || newItem === void 0 ? void 0 : newItem.as) !== (oldItem === null || oldItem === void 0 ? void 0 : oldItem.as) || (newItem === null || newItem === void 0 ? void 0 : newItem.isAll) !== (oldItem === null || oldItem === void 0 ? void 0 : oldItem.isAll))
                return false;
        }
        return true;
    };
    Utils.CacheToImportNode = function (ir) {
        if (!ir)
            throw new TypeError("plase call use right ImportList");
        // first verify ir.raw
        if ((ir === null || ir === void 0 ? void 0 : ir.raw) && Utils.CheckImportNode(ir === null || ir === void 0 ? void 0 : ir.raw, ir))
            return ir.raw;
        var result = [];
        for (var _i = 0, _a = ir.imported; _i < _a.length; _i++) {
            var ImportIt = _a[_i];
            if (!ImportIt)
                continue;
            if (ImportIt.isAll) {
                result.push(t.importNamespaceSpecifier(t.identifier(ImportIt.as)));
                continue;
            }
            if (ImportIt.import == "default") {
                result.push(t.importDefaultSpecifier(t.identifier(ImportIt.as)));
                continue;
            }
            if (!ImportIt.import)
                throw new TypeError("[compile node]: not found imported");
            result.push(t.importSpecifier(t.identifier(ImportIt.as), t.identifier(ImportIt.import)));
        }
        return t.importDeclaration(result, t.stringLiteral(ir.source));
    };
    Utils.ImportToCache = function (node) {
        var result = [];
        for (var _i = 0, _a = node.specifiers; _i < _a.length; _i++) {
            var item = _a[_i];
            var thisName = item.local.name;
            if (item.type == "ImportNamespaceSpecifier") {
                result.push({
                    isAll: true,
                    as: thisName
                });
            }
            else if (item.type == "ImportDefaultSpecifier") {
                result.push({
                    isAll: false,
                    import: "default",
                    as: thisName
                });
            }
            else if (item.type == "ImportSpecifier") {
                result.push({
                    isAll: false,
                    as: thisName,
                    import: Utils.nodeStringValue(item.imported)
                });
            }
        }
        return {
            source: Utils.nodeStringValue(node.source),
            imported: result
        };
    };
    return Utils;
}());
exports.default = Utils;
