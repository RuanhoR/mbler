const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');

class ImportManager {
  constructor(code) {
    this.code = code;
    this.ast = null;
    this.imports = []; // 格式 : Array<{ moduleName, importItem: [] }>
    this._parse();
  }

  _parse() {
    // 解析源码为 AST
    this.ast = parser.parse(this.code, {
      sourceType: 'module'
    });
    this._collectImports();
  }

  _collectImports() {
    this.imports = [];
    traverse(this.ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers.map(specifier => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            return specifier.local.name;
          } else if (specifier.type === 'ImportSpecifier') {
            return specifier.imported.name;
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            return '*' + specifier.local.name; // * as name
          }
          return null;
        }).filter(name => name !== null);

        this.imports.push({
          moduleName: source,
          importItem: specifiers
        });
      }
    });
  }

  // 检查是否导入了某个包
  has(moduleName) {
    return this.imports
      .some(imp => imp.moduleName === moduleName);
  }

  // 返回所有导入包
  get() {
    return this.imports.map(imp => ({
      ModuleName: imp.moduleName,
      ImportItem: [...imp.importItem]
    }));
  }

  // 设置/修改导入项
  set({
    ModuleName,
    ImportItem
  }) {
    // 查找是否已有该包，或有相同的包名或导入项
    const exists = this.imports.findIndex(
      imp => imp.moduleName === ModuleName ||
      imp.importItem.some(item => ImportItem.includes(item))
    );

    if (exists > -1) {
      // 修改已存在的项
      this.imports[exists] = {
        moduleName: ModuleName,
        importItem: [...ImportItem]
      };
    } else {
      // 新增
      this.imports.push({
        moduleName: ModuleName,
        importItem: [...ImportItem]
      });
    }

    // 同步更新 AST
    this._syncAST();
  }

  // 同步 imports 数据到 AST
  _syncAST() {
    // 先删除所有 import 声明
    traverse(this.ast, {
      ImportDeclaration(path) {
        path.remove();
      }
    });

    // 重新插入 import 声明
    this.imports.forEach(imp => {
      const specifiers = [];
      imp.importItem.forEach(name => {
        if (name === '*') {
          // 处理 * as xx 的情况
          const match = name.match(/\*\s+as\s+(\w+)/);
          if (match) specifiers.push(types.importNamespaceSpecifier(types.identifier(match[1])));
        } else if (name.endsWith('*')) {
          // 默认导入
          specifiers
            .push(
              types.importDefaultSpecifier(
                types.identifier(name.replace('*', ''))
              )
            );
        } else {
          specifiers
            .push(
              types.importSpecifier(
                types.identifier(name),
                types.identifier(name)
              )
            );
        }
      });

      // 构造 ImportDeclaration 节点
      const importNode = types.importDeclaration(specifiers, types.stringLiteral(imp.moduleName));
      this.ast.program.body.unshift(importNode);
    });
  }

  // 生成最终代码
  generate() {
    return generate(this.ast, {
      compact: false
    }).code;
  }
}

module.exports = ImportManager;