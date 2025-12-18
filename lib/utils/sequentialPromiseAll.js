async function sequentialPromiseAll(iterable) {
  const results = [];
  for (const item of iterable) {
    if (item instanceof Promise) {
      // 如果是 Promise，等待它解决
      const resolved = await item;
      results.push(resolved);
    } else if (item && typeof item[Symbol.iterator] === 'function') {
      // 如果是可迭代对象（但不是 Promise），递归处理
      const nestedResults = await sequentialPromiseAll(item);
      results.push(nestedResults);
    } else {
      // 普通值直接加入结果
      results.push(item);
    }
  }
  
  return results;
}

module.exports = sequentialPromiseAll;