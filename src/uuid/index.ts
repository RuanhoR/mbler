import crypto from 'node:crypto';
// 该模块用于从字符串生成哈希转 uuid

export const fromString = (input: string, salt: string = ''): string => {
  const combinedInput = salt + input;
  const hash = crypto
    .createHash('sha256')
    .update(combinedInput)
    .digest('hex');
  const base = hash
    .slice(0, 32); // 取前 32 个 hex 字符（16 字节）
  const ls = '89ab'
  const r = (t: number) => ls[(combinedInput.length + t) % ls.length]
  // 构造成标准 UUID v4 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuid = `${base.substring(0, 8)}-${base.substring(8, 12)}-4${base.substring(12, 15)}-8${r(1)}${r(2)}${r(3)}-${base.substring(18, 30)}`
  return uuid;
}
export default {
  fromString,
  uuid: crypto.randomUUID
}