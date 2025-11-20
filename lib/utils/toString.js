function toString(t) {
  if (typeof t === 'string') return t;
  if (t instanceof Error) return t.stack;
  if (Array.isArray(t)) return t.map(item => toString(item)).join('\n');
  if (typeof t?.toString === 'function') return t.toString();
  if (t === undefined) return '[Objeect utils]'
  return JSON.stringify(t, null, 2);
}
module.exports = toString;