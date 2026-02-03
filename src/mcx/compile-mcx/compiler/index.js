"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompileJS = void 0;
exports.compileJSFn = compileJSFn;
var t = require("@babel/types");
var CompileData = require("./compileData");
var utils_1 = require("./utils");
var parser_1 = require("@babel/parser");
var CompileJS = /** @class */ (function () {
    function CompileJS(node) {
        var _this = this;
        this.node = node;
        this.TopContext = {};
        this.indexTemp = {};
        this.push = function (source) {
            for (var _i = 0, _a = source.imported; _i < _a.length; _i++) {
                var node = _a[_i];
                _this.indexTemp[node.as] = {
                    source: source.source,
                    import: node.import,
                    isAll: node.isAll,
                };
            }
        };
        this.writeImportKeys = [];
        this.log = [];
        if (!t.isProgram(node))
            throw new Error("[compile error]: jsCompile can't work in a not program");
        this.CompileData = new CompileData.JsCompileData(node);
        this.run();
        this.writeBuildCache();
    }
    CompileJS.prototype.takeInnerMost = function (node) {
        if (!t.isMemberExpression(node))
            throw new Error("[take item}: must MemberExpression");
        var current = node;
        while (true) {
            if (t.isMemberExpression(current)) {
                current = current.object;
                continue;
            }
            if (t.isCallExpression(current)) {
                var callee = current.callee;
                if (t.isMemberExpression(callee)) {
                    current = callee.object;
                    continue;
                }
                current = callee;
                continue;
            }
            if (t.isIdentifier(current) ||
                t.isThisExpression(current) ||
                t.isSuper(current) ||
                t.isImport(current) ||
                t.isNewExpression(current) ||
                (typeof t.isLiteral === "function" && t.isLiteral(current))) {
                return current;
            }
            if (t.isLiteral(current)) {
                return current;
            }
            return t.stringLiteral("");
        }
    };
    CompileJS.prototype.extractIdentifierNames = function (node) {
        var identifiers = [];
        if (t.isIdentifier(node)) {
            identifiers.push(node.name);
        }
        else if (t.isMemberExpression(node)) {
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.object));
            if (node.property.type !== "PrivateName") {
                identifiers.push.apply(identifiers, this.extractIdentifierNames(node.property));
            }
        }
        else if (t.isCallExpression(node)) {
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.callee));
            for (var _i = 0, _a = node.arguments; _i < _a.length; _i++) {
                var arg = _a[_i];
                if (t.isExpression(arg)) {
                    identifiers.push.apply(identifiers, this.extractIdentifierNames(arg));
                }
            }
        }
        else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.left));
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.right));
        }
        else if (t.isUnaryExpression(node)) {
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.argument));
        }
        else if (t.isConditionalExpression(node)) {
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.test));
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.consequent));
            identifiers.push.apply(identifiers, this.extractIdentifierNames(node.alternate));
        }
        return identifiers;
    };
    CompileJS.prototype.writeBuildCache = function () {
        var currenySource = [];
        var build = [];
        for (var _i = 0, _a = Object.entries(this.indexTemp); _i < _a.length; _i++) {
            var _b = _a[_i], as = _b[0], data = _b[1];
            // only include imports that were actually referenced
            if (!this.writeImportKeys.includes(as))
                continue;
            if (currenySource.includes(data.source)) {
                var isFound = false;
                for (var index in build) {
                    var i = build[index];
                    if (!i)
                        continue;
                    if (i.source == data.source) {
                        i.imported.push({
                            as: as,
                            isAll: data.isAll,
                            import: data.import,
                        });
                        isFound = true;
                    }
                }
                if (!isFound)
                    throw new Error("[mcx compoiler]: internal error: unexpected source");
            }
            else {
                build.push({
                    source: data.source,
                    imported: [
                        {
                            as: as,
                            import: data.import,
                            isAll: data.isAll,
                        },
                    ],
                });
                currenySource.push(data.source);
            }
        }
        // write filtered imports into CompileData.BuildCache
        this.CompileData.BuildCache.import = build;
    };
    CompileJS.prototype.conditionalInTempImport = function (node, thisContext, remove) {
        var _a;
        // If identifier, mark it
        if (t.isIdentifier(node)) {
            if (node.name in this.indexTemp && !this.writeImportKeys.includes(node.name)) {
                this.writeImportKeys.push(node.name);
            }
            return;
        }
        if (node.type == "FunctionExpression") {
            this.tre(t.blockStatement([node.body]));
            return;
        }
        if (node.type == "ArrowFunctionExpression") {
            if (t.isExpression(node.body)) {
                this.conditionalInTempImport(node.body, thisContext, remove);
            }
            else {
                this.tre(node.body);
            }
            return;
        }
        if (t.isLiteral(node))
            return;
        // If member expression, collect identifiers inside it
        if (t.isMemberExpression(node)) {
            var names = this.extractIdentifierNames(node);
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var n = names_1[_i];
                if (n in this.indexTemp && !this.writeImportKeys.includes(n))
                    this.writeImportKeys.push(n);
            }
            // recurse into object and property when applicable
            this.conditionalInTempImport(node.object, thisContext, remove);
            if (t.isExpression(node.property))
                this.conditionalInTempImport(node.property, thisContext, remove);
            return;
        }
        // Call expression: record call for buildcache and mark identifiers used in callee and args
        if (t.isCallExpression(node) && ((_a = node.callee) === null || _a === void 0 ? void 0 : _a.type) !== "V8IntrinsicIdentifier") {
            // mark identifiers inside callee (including member expressions)
            var names = this.extractIdentifierNames(node.callee);
            for (var _b = 0, names_2 = names; _b < names_2.length; _b++) {
                var n = names_2[_b];
                if (n in this.indexTemp && !this.writeImportKeys.includes(n))
                    this.writeImportKeys.push(n);
            }
            this.CompileData.BuildCache.call.push({
                source: node.callee,
                arguments: node.arguments,
                remove: remove,
            });
            this.conditionalInTempImport(node.callee, thisContext, remove);
            for (var _c = 0, _d = node.arguments; _c < _d.length; _c++) {
                var arg = _d[_c];
                if (t.isExpression(arg))
                    this.conditionalInTempImport(arg, thisContext, remove);
            }
            return;
        }
        // Generic expressions: try to extract identifier names and mark them
        try {
            var names = this.extractIdentifierNames(node);
            for (var _e = 0, names_3 = names; _e < names_3.length; _e++) {
                var n = names_3[_e];
                if (n in this.indexTemp && !this.writeImportKeys.includes(n))
                    this.writeImportKeys.push(n);
            }
        }
        catch (_) {
            // ignore
        }
    };
    CompileJS.prototype.tre = function (node, ExtendContext) {
        if (ExtendContext === void 0) { ExtendContext = {}; }
        if (!t.isBlock(node))
            throw new Error("[compile error]: can't for in not block node");
        var isTop = t.isProgram(node);
        var currenyContext = isTop ? this.TopContext : ExtendContext;
        var _loop_1 = function (index) {
            this_1.log.push(index);
            var item = node.body[index];
            var remove = function () {
                node.body.splice(parseInt(index), 1);
            };
            if (!item)
                return "continue";
            if (item.type == "ImportDeclaration") {
                if (!isTop)
                    throw new Error("[compile node]: import declaration must use in top.");
                this_1.push(utils_1.default.ImportToCache(item));
                remove();
            }
            else if (item.type == "BlockStatement") {
                this_1.tre(item, currenyContext);
            }
            else if (item.type == "BreakStatement" ||
                item.type == "EmptyStatement" ||
                item.type == "ContinueStatement" ||
                item.type == "ThrowStatement" ||
                item.type == "WithStatement") {
                return "continue";
            }
            else if (item.type == "TryStatement") {
                this_1.tre(t.blockStatement(item.block.body));
            }
            else if (item.type == "IfStatement") {
                var If = item.test;
                this_1.conditionalInTempImport(If, currenyContext, remove);
                var nodes = [item.consequent];
                if (item.alternate)
                    nodes.push(item.alternate);
                // if ... else ... make one by one
                this_1.tre(t.blockStatement(nodes));
            }
            else if (item.type == "WhileStatement") {
                this_1.tre(t.blockStatement([item.body]));
            }
            else if (item.type == "ClassDeclaration") {
                if (item.superClass) {
                    var superClass = item.superClass;
                    var superId = null;
                    if (superClass.type == "Identifier") {
                        superId = superClass.name;
                    }
                    if (superClass.type == "MemberExpression") {
                        // take the innermost item
                        var tempNode = this_1.takeInnerMost(superClass);
                        if (tempNode.type == "Identifier") {
                            superId = tempNode.name;
                        }
                    }
                    // Prevent values that are not allowed to be extends
                    if (superClass.type == "ArrayExpression" ||
                        superClass.type == "BooleanLiteral" ||
                        superClass.type == "BinaryExpression" ||
                        superClass.type == "ThisExpression" ||
                        superClass.type == "ArrowFunctionExpression" ||
                        superClass.type == "BigIntLiteral" ||
                        superClass.type == "NumericLiteral" ||
                        superClass.type == "NullLiteral" ||
                        superClass.type == "AssignmentExpression" ||
                        superClass.type == "Super" ||
                        superClass.type == "NewExpression" ||
                        superClass.type == "DoExpression" ||
                        superClass.type == "StringLiteral" ||
                        superClass.type == "YieldExpression" ||
                        superClass.type == "RecordExpression" ||
                        superClass.type == "RegExpLiteral" ||
                        superClass.type == "DecimalLiteral" ||
                        superClass.type == "BindExpression")
                        throw new Error("[compilr error]: class can't extends a not constructor or null");
                    if (superId) {
                        if (this_1.indexTemp[superId]) {
                            this_1.writeImportKeys.push(superId);
                        }
                    }
                }
            }
            else if (item.type == "DoWhileStatement") {
                this_1.tre(t.blockStatement([item.body]));
                this_1.conditionalInTempImport(item.test, currenyContext, remove);
            }
            else if (item.type == "VariableDeclaration") {
                var declaration = item.declarations;
                for (var _i = 0, declaration_1 = declaration; _i < declaration_1.length; _i++) {
                    var varDef = declaration_1[_i];
                    var init = varDef.init;
                    var id = varDef.id;
                    if (id.type == "Identifier") {
                        if (!init && (item.kind == "let" || item.kind == "var"))
                            currenyContext[id.name] = {
                                status: "wait",
                            };
                        if (!init)
                            throw new Error("[compilr node]: 'const' must has a init");
                        currenyContext[id.name] = init;
                    }
                }
            }
            else if (item.type == "ReturnStatement") {
                var body = item.argument;
                if (!body)
                    return "continue";
                this_1.conditionalInTempImport(body, currenyContext, remove);
            }
            else if (item.type == "ExportAllDeclaration" ||
                item.type == "ExportDefaultDeclaration" ||
                item.type == "ExportNamedDeclaration") {
                if (!isTop) {
                    throw new Error("[compiler]: export node can't in not top");
                }
                this_1.CompileData.BuildCache.export.push(item);
                remove();
            }
            else if (item.type == "SwitchStatement") {
                var vaule = item.discriminant;
                this_1.conditionalInTempImport(vaule, currenyContext, remove);
                for (var _a = 0, _b = item.cases; _a < _b.length; _a++) {
                    var caseItem = _b[_a];
                    if (caseItem.test) {
                        this_1.conditionalInTempImport(caseItem.test, currenyContext, remove);
                    }
                    this_1.tre(t.blockStatement(caseItem.consequent), currenyContext);
                }
            }
            else if (item.type == "ExpressionStatement") {
                this_1.conditionalInTempImport(item.expression, currenyContext, remove);
            }
            else if (item.type == "FunctionDeclaration") {
                var funcBody = item.body;
                this_1.tre(funcBody, currenyContext);
            }
        };
        var this_1 = this;
        for (var index in node.body) {
            _loop_1(index);
        }
    };
    CompileJS.prototype.run = function () {
        if (!t.isBlock(this.node))
            throw new Error("[compile error]: can't for a not block");
        this.tre(this.node);
    };
    return CompileJS;
}());
exports.CompileJS = CompileJS;
function compileJSFn(code) {
    var comiler = new CompileJS((0, parser_1.parse)(code).program);
    comiler.run();
    return comiler.CompileData;
}
