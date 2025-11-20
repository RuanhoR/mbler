# 一些特性介绍
1. 目前的mcbe sapi开发者还是比较少的，所以根本没看到别人去解决这个问题

2. manifest.json里面那些uuid我没在mbler.config.json里面让用户填，但我直接用crypto的话，每次打包都不一样，我就用哈希值，拆分和拼接成标准uuid
```javascript
function generateUUIDFromString(input, salt = '') {
  const combinedInput = salt + input;
  const hash = crypto
    .createHash('sha256')
    .update(combinedInput)
    .digest('hex');
  const base = hash
    .slice(0, 32); // 取前 32 个 hex 字符（16 字节）
  const ls = '89ab'
  const r = (t) => ls[(combinedInput.length + t) % ls.length]
  // 构造成标准 UUID v4 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuid = `${base.substring(0, 8)}-${base.substring(8, 12)}-4${base.substring(12, 15)}-8${r(1)}${r(2)}${r(3)}-${base.substring(18, 30)}`
  return uuid;
}
```
大概就这样，能保障同样输入输出uuid一致，能调试都需要重新加附加包的问题，只需要游戏内
```mcfunction
/reload
```
命令就行了

3. 注意 : 文件目录下有package.json，但不需要你

> npm install 

因为我们只有编译typescript时用到node_modules  
并且由于项目结构关系，编译时先要预整理项目结构，我们并不能直接编译typescript  
所以，我们在第二步，复制package.json，在编译目录再自动

> npm install 


