"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var NodeUtils = /** @class */ (function () {
    function NodeUtils() {
    }
    NodeUtils.stringArrayToMemberExpression = function (stringArray) {
        if (stringArray.length < 2) {
            throw new Error('String array must contain at least 2 items');
        }
        var current = {
            type: 'Identifier',
            name: stringArray[0]
        };
        for (var i = 1; i < stringArray.length; i++) {
            current = {
                type: 'MemberExpression',
                object: current,
                property: {
                    type: 'Identifier',
                    name: stringArray[i]
                },
                computed: false
            };
        }
        if (current.type !== 'MemberExpression') {
            throw new Error('Internal error: expected MemberExpression');
        }
        return current;
    };
    NodeUtils.memberExpressionToStringArray = function (memberExpression, maxLength) {
        var result = [];
        var current = memberExpression;
        while (current.type === 'MemberExpression' &&
            result.length < maxLength) {
            var prop = current.property;
            if (!current.computed &&
                prop.type === 'Identifier') {
                result.unshift(prop.name);
            }
            current = current.object;
        }
        if (result.length >= maxLength) {
            return result;
        }
        switch (current.type) {
            case 'Identifier':
                result.unshift(current.name);
                break;
            case 'ThisExpression':
                result.unshift('this');
                break;
            case 'StringLiteral':
            case 'NumericLiteral':
            case 'BooleanLiteral':
                result.unshift(String(current.value));
                break;
            case 'NullLiteral':
                result.unshift('null');
                break;
        }
        return result;
    };
    /**
     * 计算表达式的值
     * @param expression Babel AST 表达式节点
     * @param currentContext 当前上下文变量
     * @param topContext 顶层上下文变量
     * @returns 计算结果 (string | number | symbol | object)
     */
    NodeUtils.evaluateExpression = function (expression, currentContext, topContext) {
        if (currentContext === void 0) { currentContext = {}; }
        if (topContext === void 0) { topContext = {}; }
        var context = __assign(__assign({}, topContext), currentContext);
        var evaluate = function (expr) {
            if (!expr)
                return undefined;
            switch (expr.type) {
                case 'Identifier':
                    if (!expr.name)
                        return undefined;
                    if (expr.name in context) {
                        return evaluate(context[expr.name]);
                    }
                    if (expr.name === 'this') {
                        return currentContext;
                    }
                    if (expr.name === 'global') {
                        return topContext;
                    }
                    throw new Error("Undefined variable: ".concat(expr.name));
                case 'StringLiteral':
                    return expr.value;
                case 'NumericLiteral':
                    return expr.value;
                case 'BooleanLiteral':
                    return expr.value;
                case 'NullLiteral':
                    return null;
                case 'MemberExpression':
                    var objectValue = evaluate(expr.object);
                    var property = expr.computed
                        ? evaluate(expr.property)
                        : expr.property.name;
                    if (objectValue && typeof objectValue === 'object' && property in objectValue) {
                        return objectValue[property];
                    }
                    throw new Error("Cannot access property '".concat(property, "' of ").concat(objectValue));
                case 'ObjectExpression':
                    var obj = {};
                    for (var _i = 0, _a = expr.properties; _i < _a.length; _i++) {
                        var prop = _a[_i];
                        if (prop.type === 'ObjectProperty') {
                            var key = prop.computed
                                ? evaluate(prop.key)
                                : prop.key.name;
                            obj[key] = evaluate(prop.value);
                        }
                    }
                    return obj;
                case 'ArrayExpression':
                    return expr.elements.map(function (element) {
                        return element && element.type !== 'SpreadElement'
                            ? evaluate(element)
                            : undefined;
                    });
                case 'UnaryExpression':
                    var argumentValue = evaluate(expr.argument);
                    switch (expr.operator) {
                        case '+': return +argumentValue;
                        case '-': return -argumentValue;
                        case '!': return !argumentValue;
                        case '~': return ~argumentValue;
                        case 'typeof': return typeof argumentValue;
                        case 'void': return void argumentValue;
                        default: throw new Error("Unsupported unary operator: ".concat(expr.operator));
                    }
                case "PrivateName":
                    return evaluate(context[expr.id.name]);
                case 'BinaryExpression':
                    var leftValue = expr.left.type == evaluate(expr.left);
                    var rightValue = evaluate(expr.right);
                    var isNum = typeof leftValue == "number" && typeof rightValue == "number";
                    switch (expr.operator) {
                        case '+': return leftValue + rightValue;
                        case '-': if (isNum) {
                            return leftValue - rightValue;
                        }
                        else
                            return 0;
                        case '*': if (isNum) {
                            return leftValue * rightValue;
                        }
                        else
                            return 0;
                        case '/': if (isNum) {
                            return leftValue / rightValue;
                        }
                        else
                            return 0;
                        case '%': if (isNum) {
                            return leftValue % rightValue;
                        }
                        else
                            return 0;
                        case '==': return leftValue == rightValue;
                        case '!=': return leftValue != rightValue;
                        case '===': return leftValue === rightValue;
                        case '!==': return leftValue !== rightValue;
                        case '<': return leftValue < rightValue;
                        case '<=': return leftValue <= rightValue;
                        case '>': return leftValue > rightValue;
                        case '>=': return leftValue >= rightValue;
                        case '|': return leftValue | rightValue;
                        case '&': return leftValue & rightValue;
                        case '^': return leftValue ^ rightValue;
                        case '<<': return leftValue << rightValue;
                        case '>>': return leftValue >> rightValue;
                        case '>>>': return leftValue >>> rightValue;
                        default: throw new Error("Unsupported binary operator: ".concat(expr.operator));
                    }
                case 'LogicalExpression':
                    var left = evaluate(expr.left);
                    switch (expr.operator) {
                        case '&&': return left && evaluate(expr.right);
                        case '||': return left || evaluate(expr.right);
                        case '??': return left !== null && left !== void 0 ? left : evaluate(expr.right);
                        default: throw new Error("Unsupported logical operator: ".concat(expr.operator));
                    }
                case 'ConditionalExpression':
                    return evaluate(expr.test)
                        ? evaluate(expr.consequent)
                        : evaluate(expr.alternate);
                case 'CallExpression':
                    var callee = evaluate(expr.callee);
                    if (typeof callee !== 'function') {
                        throw new Error("Cannot call non-function: ".concat(callee));
                    }
                    var args = expr.arguments.map(function (arg) {
                        return arg.type === 'SpreadElement'
                            ? evaluate(arg.argument)
                            : evaluate(arg);
                    });
                    return callee.apply(null, args);
                default:
                    throw new Error("Unsupported expression type: ".concat(expr.type));
            }
        };
        try {
            return evaluate(expression);
        }
        catch (error) {
            throw new Error("Expression evaluation failed: ".concat(error.message));
        }
    };
    return NodeUtils;
}());
exports.default = NodeUtils;
