import type {
  MemberExpression,
  Identifier,
  Expression,
  ThisExpression
} from '@babel/types';

export default class NodeUtils {
  public static stringArrayToMemberExpression(
    stringArray: string[]
  ): MemberExpression {
    if (stringArray.length < 2) {
      throw new Error('String array must contain at least 2 items');
    }

    let current: Expression = {
      type: 'Identifier',
      name: stringArray[0] !
    };

    for (let i = 1; i < stringArray.length; i++) {
      current = {
        type: 'MemberExpression',
        object: current,
        property: {
          type: 'Identifier',
          name: stringArray[i] !
        },
        computed: false
      };
    }

    // 逻辑上 100% 保证
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
}