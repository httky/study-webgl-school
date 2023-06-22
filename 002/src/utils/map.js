/**
 * map
 * @param {number} val
 * @param {number} toMin
 * @param {number} toMax
 * @param {number} fromMin
 * @param {number} fromMax
 * @return {number}
 */
export function map(val, toMin, toMax, fromMin, fromMax) {
  if(val <= fromMin) {
    return toMin
  }
  if(val >= fromMax) {
    return toMax
  }
  const p = (toMax - toMin) / (fromMax - fromMin)
  return ((val - fromMin) * p) + toMin
}
