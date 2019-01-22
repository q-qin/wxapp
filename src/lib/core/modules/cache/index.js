import * as C from '../../constant'
import Storage from '../storage/index'
import { copyObj } from './utils'

// 惰性单例变量
// let singleton
const COOKIE_STORAGE_KEY = 'Cookie'

class Cache extends Storage {
  constructor(errCb) {
    super()
    // 会话级存储
    this._sessionCache = {}
    this._init(errCb)
  }
  // 读取会话级存储
  _getSessionCache(key) {
    let ret = this._sessionCache[key]
    // immutable
    if (typeof ret === 'object') {
      return copyObj(ret)
    }
    return ret
  }
  // 设置会话级存储
  _setSessionCache(key, value) {
    this._sessionCache[key] = value
  }
  // 获取所有会话级存储
  _getAllSessionCaches() {
    return copyObj(this._sessionCache)
  }
  // 删除会话级存储, 支持模糊删除
  _removeSessionCache(key, fuzzy = false) {
    let sCache = this._sessionCache
    if (!fuzzy) {
      delete sCache[key]
    } else {
      for (const _key in sCache) {
        if (_key.indexOf(key) !== -1) {
          delete sCache[_key]
        }
      }
    }
  }
  // 获取有过期时间的临时存储[前缀.key]
  getPeriodStorage(key, errCb) {
    const data = this.getStorage(`${C.ESTORAGE_KEY_PREFIX}${key}`, errCb)
    if (data && data.expires && data.content) {
      if (+new Date() < data.expires) {
        return data.content
      } else {
        this.removePeriodStorage(key)
        return null
      }
    }
    return data
  }
  // 存储有过期时间的临时存储[前缀.key]
  setPeriodStorage(key, value, expires) {
    if (typeof expires !== 'number' && typeof expires !== 'undefined') {
      console.warn(
        'expires参数现在不是number类型的时间戳, 可能不会正确的进行时间计算'
      )
    }
    if (expires) {
      value = {
        content: value,
        expires
      }
    }
    this.setStorage(`${C.ESTORAGE_KEY_PREFIX}${key}`, value)
  }
  // 存储CookieStorage[Cookie前缀.key]
  removePeriodStorage(key) {
    this.removeStorage(`${C.ESTORAGE_KEY_PREFIX}${key}`)
  }
  // 获取会话级cookie对象
  _getCacheCookie() {
    return this._getSessionCache(COOKIE_STORAGE_KEY) || {}
  }
  // 获取storage中的cookie对象
  _getStorageCookie(errCb) {
    return this.getPeriodStorage(COOKIE_STORAGE_KEY, errCb) || {}
  }
  // 从cookie对象中获取特定key值
  _getValueFromCookieObj(key, cookieObj) {
    if (cookieObj) {
      if (cookieObj.expires) {
        if (+new Date() < cookieObj.expires) {
          return cookieObj.value
        }
        this.removeCookie(key)
      } else {
        return cookieObj.value
      }
    }
    return null
  }
  // Cookie的get方法
  getCookie(key, errCb) {
    // 优先级: 会话级存储 > 有过期时间的文件存储
    const cacheCookie = this._getCacheCookie()
    if (cacheCookie[key]) {
      return this._getValueFromCookieObj(key, cacheCookie[key])
    }
    return this._getValueFromCookieObj(key, this._getStorageCookie(errCb)[key])
  }
  // Cookie的set方法
  setCookie(key, value, expires, errCb) {
    // 有expires的存入Storage, 否则expires的存入会话级存储
    const cookie = expires
      ? this._getStorageCookie(errCb)
      : this._getCacheCookie()
    cookie[key] = { value }
    if (expires) {
      if (typeof expires !== 'number') {
        console.warn('expires参数现在不是number类型的时间戳, 可能不会正确的进行时间计算')
      }
      cookie[key].expires = expires
      this.setPeriodStorage(COOKIE_STORAGE_KEY, cookie)
    } else {
      this._setSessionCache(COOKIE_STORAGE_KEY, cookie)
    }
  }
  // 删除key的Cookie
  removeCookie(key, errCb) {
    let cacheCookie = this._getCacheCookie()
    let storageCookie = this._getStorageCookie(errCb)

    delete cacheCookie[key]
    delete storageCookie[key]

    this._setSessionCache(COOKIE_STORAGE_KEY, cacheCookie)
    this.setPeriodStorage(COOKIE_STORAGE_KEY, storageCookie)
  }
  // 清除Cookie
  clearCookie() {
    this._setSessionCache(COOKIE_STORAGE_KEY, {})
    this.setPeriodStorage(COOKIE_STORAGE_KEY, {})
  }
  // ctw start
  // 得到所有Cookie
  getCookieString(errCb) {
    const cookie = Object.assign(
      {},
      this._getCacheCookie(),
      this._getStorageCookie(errCb)
    )
    let arr = []
    let getValue = this._getValueFromCookieObj.bind(this)
    for (let key in cookie) {
      let value = getValue(key, cookie[key])
      value !== null && arr.push(`${key}=${encodeURIComponent(value)}`)
    }
    return arr.join('; ')
  }
  // 获取所有cookies合并后的拷贝对象
  getAllCookies(errCb) {
    return Object.assign(
      {},
      copyObj(this._getCacheCookie()),
      copyObj(this._getStorageCookie(errCb))
    )
  }

  // 处理set-Cookie头
  responseCookieHandler(header) {
    const _setCookie = header['Set-Cookie'] || header['set-cookie'] || ''
    const _cookieArr = _setCookie
      ? _setCookie
          .replace(/(HttpOnly?)|(Domain=[^,;]+[;\s])|(Path=[^,;]+[;\s])/g, '')
          .replace(/(Domain=[^,]+[,\s])|(Path=[^,]+[,\s])/g, ',')
          .split(' ,')
      : []
    _cookieArr.map(item => {
      let _cookieItem = {
        key: '',
        value: {
          value: ''
        }
      }

      item.split(';').map(m => {
        const _key = m.split('=')[0].replace(/\s/g, '')
        let _value = m.split('=')[1] || ''

        // 处理 H5Channel
        if (_key === 'H5Channel') {
          _value = decodeURIComponent(_value)
        }

        // 处理 Expires
        if (_key === 'Expires') {
          _cookieItem.value.expires = +new Date(_value)
        } else if (
          _key &&
          _value &&
          _value !== '""' &&
          _value !== "''" &&
          !['Domain', 'Path', 'Secure', 'HttpOnly', 'SameSite'].filter(
            m => m === _key
          ).length
        ) {
          _cookieItem.key = _key
          _cookieItem.value.value = _value
        }
      })

      // 检查过期
      if (_cookieItem.value.expires < new Date().getTime()) {
        // 已过期，删除
        this.removeCookie(_cookieItem.key)
      } else {
        // 未过期，写入
        _cookieItem.key &&
          _cookieItem.value.value &&
          this.setCookie(
            _cookieItem.key,
            _cookieItem.value.value,
            _cookieItem.value.expires || 0
          )
      }
    })
  }
}

export default new Cache()
