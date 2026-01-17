import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as types from '@babel/types';

interface ImportItem {
  moduleName: string;
  importItem: string[];
}

export default class ImportManager {
  private code: string | null;
  private ast: any;
  private imports: ImportItem[];

  constructor(code: string | null) {
    this.code = code;
    this.ast = null;
    this.imports = [];
    this._parse();
  }

  private _parse(): void {
    if (!this.code) {
      this.ast = { program: { body: [] } };
      return;
    }
    // 解析源码为 AST
    this.ast = parse(this.code, {
      sourceType: 'module'
    });
    this._collectImports();
  }

  private _collectImports(): void {
    this.imports = [];
    traverse(this.ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        const specifiers = path.node.specifiers.map(specifier => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            return specifier.local.name;
          } else if (specifier.type === 'ImportSpecifier') {
            if (specifier.imported.type == "Identifier") return specifier.imported.name
            return specifier.imported.value;
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            return '*' + specifier.local.name; // * as name
          }
          return null;
        }).filter(name => name !== null) as string[];

        this.imports.push({
          moduleName: source,
          importItem: specifiers
        });
      }
    });
  }

  // 检查是否导入了某个包
  has(moduleName: string): boolean {
    return this.imports
      .some(imp => imp.moduleName === moduleName);
  }

  // 返回所有导入包
  get(): Array<{ ModuleName: string; ImportItem: string[] }> {
    return this.imports.map(imp => ({
      ModuleName: imp.moduleName,
      ImportItem: [...imp.importItem]
    }));
  }

  // 设置/修改导入项
  set({ ModuleName, ImportItem }: { ModuleName: string; ImportItem: string[] }): void {
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
  private _syncAST(): void {
    // 先删除所有 import 声明
    traverse(this.ast, {
      ImportDeclaration(path) {
        path.remove();
      }
    });

    // 重新插入 import 声明
    this.imports.forEach(imp => {
      const specifiers: any[] = [];
      imp.importItem.forEach(name => {
        if (name === '*') {
          // 处理 * as xx 的情况
          const match = name.match(/\*\s+as\s+(\w+)/) || [];
          if (match) specifiers.push(types.importNamespaceSpecifier(types.identifier(match[1] || "")));
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
  generate(): string {
    return generate(this.ast, {
      compact: false
    }).code;
  }
}