module.exports = function(obj, keys, minValue) {
  if (
    !(typeof obj === `object` &&
      !Array.isArray(obj)
    )) return false;
  if (!Array.isArray(keys)) return false;
  let count = 0;
  for (const key of keys) {
    if (obj.hasOwnProperty(key)) {
      count++;
      if (count >= minValue) return true;
    }
  }
  return false;
}