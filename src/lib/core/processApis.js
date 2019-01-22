import { PROMISIFY_APIS, ROUTE_APIS, STORAGE_APIS, CACHE_FNS_MAP } from './constant'
import cache from './modules/cache/index'
import PageEvents from './PageEvents'

const _api = {}

// 路由锁
_api._routeLock = false

// 需特殊处理的apis
const ExcludeApis = PROMISIFY_APIS.concat(ROUTE_APIS, STORAGE_APIS)

function processRouteApis() {
  ROUTE_APIS.forEach(routeApiName => {
    /* promisify写法 */
    /*
    _api[routeApiName] = function(options) {
      // 路由锁处理
      if (_api._routeLock) return
      _api._routeLock = true
      return new Promise((resolve, reject) => {
        // 支持参数写法
        if (typeof options === 'string') {
          options = {
            url: options
          }
        }
        wx[routeApiName]({
          url: options.url,
          success(res) {
            options.success && options.success.call(this, res)
            resolve(res)
          },
          fail(err) {
            options.fail && options.fail.call(this, res)
            // 重置路由锁
            _api._routeLock = false
            reject(err)
          },
          complete() {
            options.complete && options.complete.call(this)
          }
        })
      })
    }
    */

    /* 原生写法 */
    // 路由锁处理
    _api[routeApiName] = function(opts) {
      // 路由锁处理
      if (_api._routeLock) return
      _api._routeLock = true
      let { url, params, successCb, failCb, completeCb } = opts

      // switchTab不挂在参数数据
      let event
      let id
      if (routeApiName !== 'switchTab') {
        event = PageEvents.register(params)
        id = event.id
        url +=
          (url.indexOf('?') === -1 ? '?' : '&') + '_eventId=' + id
      }
      // redirectTo时，针对当前页面的所有事件监听全部转移到新跳转的页面
      if (routeApiName === 'redirectTo') {
        const pages = getCurrentPages()
        const events = PageEvents.events
        let currentEventId
        // 防止没有_eventId的页面直接跳转
        if (currentEventId = pages[pages.length - 1]._eventId) {
          const currentEvent = events[currentEventId].event
          if (currentEvent) {
            events[id].event.events = currentEvent.events
          }
        }
      }
      // 跳转
      wx[routeApiName]({
        url,
        success(...args) {
          successCb && successCb.apply(this, args)
        },
        fail(...args) {
          failCb && failCb.apply(this, args)
        },
        complete() {
          completeCb && completeCb.call(this)
        }
      })
      // 返回事件对象
      return event
    }
  })
}

function processApis() {
  Object.keys(wx).filter(wxkey => {
    // 如果是应该直接透传的api
    if (ExcludeApis.indexOf(wxkey) === -1) {
      _api[wxkey] = (...args) => {
        return wx[wxkey].apply(wx, args)
      }
    }
    // 如果是promise-_api
    else if (PROMISIFY_APIS.indexOf(wxkey) > -1) {
      _api[wxkey] = function(options) {
        // 如果参数是字符串, 直接调用对应方法
        if (typeof options === 'string') {
          return wx[wxkey](options)
        }
        options = options || {}
        // 若有些api返回一个对象, 用task接收
        let task = null
        let newOptions = Object.assign({}, options)
        // 创建promise对象
        return new Promise((resolve, reject) => {
          ;['fail', 'success', 'complete'].forEach(cb => {
            newOptions[cb] = function(res) {
              // 保证this一致性
              options[cb] && options[cb].call(this, res)
              if (cb === 'success') {
                resolve(res)
              } else if (cb === 'fail') {
                reject(res)
              }
            }
          })
          task = wx[wxkey](newOptions)
        })
      }
    }
  })
}

// 批量移植api
processApis()
// 重写路由api
processRouteApis()
// 重写缓存Apis
processStorageApis()

// 业务框架, 核心库去除
function processStorageApis() {
  ;['getStorage', 'setStorage', 'removeStorage', 'clearStorage', 'setCookie', 'getCookie', 'removeCookie', 'clearCookie'].forEach(
    key => {
      _api[key] = cache[key].bind(cache)
    }
  )
}

Object.keys(CACHE_FNS_MAP).forEach(apiKey => {
  _api[apiKey] = cache[CACHE_FNS_MAP[apiKey]].bind(cache)
})

export default _api
