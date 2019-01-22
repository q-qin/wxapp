import { RESERVED_WX_WORDS } from './constant'

const KEY_REG = /[^.,\s\[\]\'\"]+/g

export function checkReservedWords(word) {
  return !RESERVED_WX_WORDS.some(reservedWord => {
    return reservedWord === word
  })
}

/**
 * 属性安全获取和属性安全存储
 * obj 要操作的对象
 * path 属性获取规则
 * 1、"a.b[0].c[d]"
 * 2、"[a][b][c]"
 * 3、"[a,b,c]"
 * 4、[a,b,c]
 * deflt 默认值
 */
export function get(obj, path, deflt) {
  if (null == obj) return deflt
  let keys = JSON.stringify(path).match(KEY_REG)
  if (!keys) return deflt
  let ret
  for (let i = 0, j = keys.length; i < j; i++) {
    ret = obj[keys[i]]
    if (null == ret) return deflt
    obj = ret
  }
  return ret
}

export function set(obj, path, value) {
  let keys = JSON.stringify(path).match(KEY_REG)
  if (!keys) return obj
  let _obj = obj
  for (let i = 0, j = keys.length; i < j; i++) {
    let temp = _obj[keys[i]]
    if (null == temp) {
      if (i + 1 == j) {
        _obj[keys[i]] = value
        break
      }
      _obj[keys[i]] = /\d+/.test(keys[i]) ? [] : {}
    } else if (i + 1 == j) {
      _obj[keys[i]] = value
    }
    _obj = _obj[keys[i]]
  }
  return obj
}

/**
 * 检测是否为一个类对象, 当入参的 `typeof` 为 `object` 且入参不为 `null` 时，返回 true
 *
 * @param {*} value 待检测的值
 * @returns {boolean} 当入参为类对象时，返回 `true`，否则返回 `false`
 * @example
 *
 * isObjectLike({})
 * // => true
 *
 * isObjectLike([1, 2, 3])
 * // => true
 *
 * isObjectLike(Function)
 * // => false
 *
 * isObjectLike(null)
 * // => false
 */
export function isObjectLike(value) {
  return typeof value === 'object' && value !== null
}

/**
 * JSON 转 Query
 * @param {Object} json JSON 对象
 */
export function JsonToQuery(json) {
  let query = []
  Object.keys(json)
    .sort()
    .forEach(key => {
      // 数组和对象类的属性值，尝试转成字符串
      try {
        isObjectLike(json[key]) && (json[key] = JSON.stringify(json[key]))
      } catch (e) {}

      query.push([key, json[key]].join('='))
    })
  return query.join('&')
}

/**
 * Query 转 JSON
 * @param {String} query Query格式的字符串，
 */
export function QueryToJson(query) {
  let json = {}
  query[0] === '?' && (query = query.slice(1))
  query.split('&').forEach(key => {
    let item = key.split('=')
    json[item[0]] = item[1]
  })
  return json
}

/**
 * 连接一个url和queryString,返回新的url
 * @param {string} url
 * @param {string} queryString
 */
export function connectQueryString(url, queryString) {
  const searchPos = url.indexOf('?')
  const urlLen = url.length
  switch (searchPos) {
    case urlLen - 1:
      break
    case -1:
      url += '?'
      break
    default:
      url += '&'
      break
  }
  return url + queryString
}

/**
 * 拷贝对象
 * 需注意 undefined 和 null 会转换为字符串
 */
export function copyJson() {
  try {
    return JSON.parse(JSON.stringify(jsonObj))
  } catch (e) {
    return jsonObj
  }
}

/**
 * 函数防抖
 * @param {*} fn 回调
 * @param {*} interval 间隔
 */
export function debounce(fn, interval) {
  let timeid
  return function(...args) {
    if (timeid) {
      clearTimeout(timeid)
    }
    timeid = setTimeout(() => {
      fn.apply(this, args)
    }, interval)
  }
}

/**
 * 比较两个值，确定它们是否相等
 *
 * @param {*} value 待比较的值
 * @param {*} other 另外一个待比较的值
 * @returns {boolean} 如果两个入参相等，返回 `true`，否则返回 `false`
 * @example
 *
 * const object = { 'a': 1 }
 * const other = { 'a': 1 }
 *
 * eq(object, object)
 * // => true
 *
 * eq(object, other)
 * // => false
 *
 * eq('a', 'a')
 * // => true
 *
 * eq('a', Object('a'))
 * // => false
 *
 * eq(NaN, NaN)
 * // => true
 */
/* eslint-disable no-self-compare */
export function eq(value, other) {
  return value === other || (value !== value && other !== other)
}
/* eslint-enable no-self-compare */

/**
 * 检测是否为一个类对象, 当入参的 `typeof` 为 `object` 且入参不为 `null` 时，返回 true
 *
 * @param {*} value 待检测的值
 * @returns {boolean} 当入参为类对象时，返回 `true`，否则返回 `false`
 * @example
 *
 * isObjectLike({})
 * // => true
 *
 * isObjectLike([1, 2, 3])
 * // => true
 *
 * isObjectLike(Function)
 * // => false
 *
 * isObjectLike(null)
 * // => false
 */

/**
 * 返回一个对象的key名组成的数组
 */
export function sortKeys(obj) {
  const _keys = obj ? Object.keys(obj).sort() : []
  let _obj = {}

  _keys.map(key => {
    _obj[key] = obj[key]
  })

  return _obj
}

/**
 * 对象深拷贝方法
 * @param {object} source 
 */
export function deepCopy(source) {
  if (source === null) return null
  // 设置初始值为空对象或空数组
  const ret = Array.isArray(source) ? [] : {}
  Object.keys(source).forEach(key => {
    const sourceValue = source[key]
    if (typeof sourceValue === 'function') {
      // 如果是函数直接拷贝
      ret[key] = sourceValue
    } else if (typeof sourceValue === 'object') {
      ret[key] = deepCopy(sourceValue)
    } else {
      // 基本值直接复制
      ret[key] = sourceValue
    }
  })
  return ret
}
