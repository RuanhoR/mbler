# 创建模板体
模板体和 `npm create` 差不多
我们设计，`mbler create`运行在安全上下文，这玩意目前并不完善
### 创建
创建一个 `package.json`
```json
{
  "name": "名称",
  "script": {
    test: "mbler -c ./test && mbler create ."
  },
  "description": "描述",
  "version": "0.0.1",
  "main": "./src/index.js"
}
```
`mbler.config.json`
```json
{
  "name": "名称",
  "description": "描述",
  "version": "0.0.1",
}
```

这样就行了，下面来编写

`src/index.js`
```javascript
exports.main = ({
  name,
  descrition,
  version,
  setWorkDir /*类型 : securityFile {
  mkdir: function(dir) : Primise <boolean>,
  rm: function(dir) : Promise<boolean>,
  writeFile: function(dir, content) : Promise<boolean>,
  readFile: function(dir, opt) : Promise<Buffer | string>,
  readdir: function(dir) : Promise<string[]>,
}*/
}) => {
/*在这里用setWorkDir做一些处理*/
}
```
就这样的，用于按模板初始化一个包