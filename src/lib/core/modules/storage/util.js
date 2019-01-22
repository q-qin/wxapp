export function deleteFromArray(item, arr) {
  let index = arr.indexOf(item)
  if (index === -1) {
    return arr
  }
  arr.splice(index, 1)
  return arr
}

export function sortObj(o) {
  let o1 = {}
  Object.keys(o).sort().forEach(key => {
    o1[key] = o[key]
  })
  return o1
}

export function copyObj(o) {
  return JSON.parse(JSON.stringify(o))
}

export function isEqualArrShallow(arr1, arr2) {
  if (!arr1 || !arr2) return false
  if (arr1.length !== arr2.length) return false
  return !arr1.some((value, index) => {
    return value !== arr2[index]
  })
}