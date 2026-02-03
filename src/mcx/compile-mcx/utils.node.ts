import type {
  MemberExpression,
  Identifier,
  Expression,
  ThisExpression,
  PrivateName,
  callExpression,
  ArrayExpression
} from '@babel/types';
import { Context } from './compiler';

export default class NodeUtils {
  public static stringArrayToMemberExpression(
    stringArray: string[]
  ): MemberExpression {
    if (stringArray.length < 2) {
      throw new Error('String array must contain at least 2 items');
    }

    let current: Expression = {
      type: 'Identifier',
      name: stringArray[0]!
    };

    for (let i = 1; i < stringArray.length; i++) {
      current = {
        type: 'MemberExpression',
        object: current,
        property: {
          type: 'Identifier',
          name: stringArray[i]!
        },
        computed: false
      };
    }
    if (current.type !== 'MemberExpression') {
      throw new Error('Internal error: expected MemberExpression');
    }

    return current;
  }
  public static memberExpressionToStringArray(
    memberExpression: MemberExpression,
    maxLength: number
  ): string[] {
    const result: string[] = [];
    let current: Expression | ThisExpression = memberExpression;

    while (
      current.type === 'MemberExpression' &&
      result.length < maxLength
    ) {
      const prop = current.property;

      if (
        !current.computed &&
        prop.type === 'Identifier'
      ) {
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
  }

  /**
   * 计算表达式的值
   * @param expression Babel AST 表达式节点
   * @param currentContext 当前上下文变量
   * @param topContext 顶层上下文变量
   * @returns 计算结果 (string | number | symbol | object)
   */
  public static evaluateExpression(
    expression: Expression,
    currentContext: Context = {},
    topContext: Context = {}
  ): string | number | symbol | object {
    const context = { ...topContext, ...currentContext };

    const evaluate = (expr: Expression | undefined | PrivateName | any): any => {
      if (!expr) return undefined
      switch (expr.type) {
        case 'Identifier':
          if (!expr.name) return undefined
          if (expr.name in context) {
            return evaluate(context[expr.name]);
          }
          if (expr.name === 'this') {
            return currentContext;
          }
          if (expr.name === 'global') {
            return topContext;
          }
          throw new Error(`Undefined variable: ${expr.name}`);
        case 'StringLiteral':
          return expr.value;
        case 'NumericLiteral':
          return expr.value;
        case 'BooleanLiteral':
          return expr.value;
        case 'NullLiteral':
          return null;
        case 'MemberExpression':
          const objectValue = evaluate(expr.object);
          const property = expr.computed
            ? evaluate(expr.property)
            : (expr.property as Identifier).name;
          if (objectValue && typeof objectValue === 'object' && property in objectValue) {
            return objectValue[property];
          }
          throw new Error(`Cannot access property '${property}' of ${objectValue}`);

        case 'ObjectExpression':
          const obj: Record<string, any> = {};
          for (const prop of expr.properties) {
            if (prop.type === 'ObjectProperty') {
              const key = prop.computed
                ? evaluate(prop.key as Expression)
                : (prop.key as Identifier).name;
              obj[key] = evaluate(prop.value);
            }
          }
          return obj;

        case 'ArrayExpression':
          return expr.elements.map((element: any) =>
            element && element.type !== 'SpreadElement'
              ? evaluate(element)
              : undefined
          );

        case 'UnaryExpression':
          const argumentValue = evaluate(expr.argument);
          switch (expr.operator) {
            case '+': return +argumentValue;
            case '-': return -argumentValue;
            case '!': return !argumentValue;
            case '~': return ~argumentValue;
            case 'typeof': return typeof argumentValue;
            case 'void': return void argumentValue;
            default: throw new Error(`Unsupported unary operator: ${expr.operator}`);
          }
        case "PrivateName":
          return evaluate(context[expr.id.name])
        case 'BinaryExpression':
          const leftValue: any = expr.left.type == evaluate(expr.left);
          const rightValue: any = evaluate(expr.right);
          const isNum = typeof leftValue == "number" && typeof rightValue == "number"
          switch (expr.operator) {
            case '+': return leftValue + rightValue;
            case '-': if (isNum) {
              return leftValue - rightValue
            } else return 0;
            case '*': if (isNum) {
              return leftValue * rightValue
            } else return 0;
            case '/': if (isNum) {
              return leftValue / rightValue
            } else return 0;
            case '%': if (isNum) {
              return leftValue % rightValue
            } else return 0;
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
            default: throw new Error(`Unsupported binary operator: ${expr.operator}`);
          }
        case 'LogicalExpression':
          const left = evaluate(expr.left);
          switch (expr.operator) {
            case '&&': return left && evaluate(expr.right);
            case '||': return left || evaluate(expr.right);
            case '??': return left ?? evaluate(expr.right);
            default: throw new Error(`Unsupported logical operator: ${expr.operator}`);
          }

        case 'ConditionalExpression':
          return evaluate(expr.test)
            ? evaluate(expr.consequent)
            : evaluate(expr.alternate);

        case 'CallExpression':
          const callee = evaluate(expr.callee);
          if (typeof callee !== 'function') {
            throw new Error(`Cannot call non-function: ${callee}`);
          }
          const args = expr.arguments.map((arg: typeof callExpression.arguments) =>
            arg.type === 'SpreadElement'
              ? evaluate(arg.argument)
              : evaluate(arg)
          );
          return callee.apply(null, args);
        default:
          throw new Error(`Unsupported expression type: ${expr.type}`);
      }
    };

    try {
      return evaluate(expression);
    } catch (error: any) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }
}