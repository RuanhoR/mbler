/**
 * @description To generate uuid
 */
import crypto from 'node:crypto'
export const fromString = (input: string, salt: string = ''): string => {
  const combinedInput = salt + input
  const hash = crypto.createHash('sha256').update(combinedInput).digest('hex')
  const base = hash.slice(0, 32)
  const ls = '89ab'
  const r = (t: number) =>
    ls[(combinedInput.length + t + salt.length) % ls.length]
  // build to：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuid = `${base.substring(0, 8)}-${base.substring(8, 12)}-4${base.substring(12, 15)}-8${r(1)}${r(2)}${r(3)}-${base.substring(18, 30)}`
  return uuid
}
export default {
  fromString,
  uuid: crypto.randomUUID,
}
