import api from '../core/processApis'
import cache from '../core/modules/cache/index'
import * as _ from './utils'

// 利用 globalData 存储请求队列
function initReqQueue() {
  /* eslint-disable no-undef */
  let queue = getApp().globalData._reqQueue

  if (!queue) {
    getApp().globalData._reqQueue = {
      waitingList: [],
      dadianList: []
    }
  }
  /* eslint-enable no-undef */
}
initReqQueue()

let requestingCount = 1
const requestMax = 8

let requestTimeout = 5000
const requestRetryMax = 1
const requestRetryTime = 1000

let dadianCount = 1
const dadianListMax = 2

const onComplete = isDadian => {
  initReqQueue()

  /* eslint-disable no-undef */
  let queue = getApp().globalData._reqQueue
  let waitingList = queue.waitingList
  let dadianList = queue.dadianList
  /* eslint-enable no-undef */

  if (!isDadian) {
    // 普通请求
    // waitingList.length && console.log('一般请求队列长度：', requestingCount, '一般请求队列长度等待列表：', waitingList.length)
    if (requestingCount <= requestMax && waitingList.length) {
      waitingList.shift()(onComplete)
    }
  } else {
    // 打点请求
    // dadianList.length && console.log('打点请求队列长度：', dadianCount, '打点请求队列长度等待列表：', dadianList)
    if (dadianCount <= dadianListMax && dadianList.length) {
      dadianList.shift()(onComplete)
    }
  }
}

export default function(config) {
  return function() {
    let params = {}
    // 假如配置了参数列表，则按参数列表序列化参数
    if (config.params) {
      params = {}
      for (
        let i = 0, l = Math.min(config.params.length, arguments.length);
        i < l;
        i++
      ) {
        params[config.params[i]] = arguments[i]
      }
    } else {
      params = arguments[0]
    }

    // cache 处理
    let cacheKey = ''
    let resolveCacheData = null
    if (config.cache) {
      cacheKey = `${config.url}?${_.JsonToQuery(_.sortKeys(params))}`
      const cacheData = api.getCache(cacheKey)
      const timestamp = new Date().getTime()

      if (
        cacheData &&
        cacheData.content &&
        ((cacheData.expires && +cacheData.expires >= timestamp) ||
          !cacheData.expires)
      ) {
        // 如果 cacheHandler 是个函数，就需要获取返回结果
        if (config.cacheHandler && typeof config.cacheHandler === 'function') {
          config.cacheHandler = config.cacheHandler(
            _.deepCopy(cacheData.content)
          )
        }

        if (!config.cacheHandler) {
          // 没有配置 cacheHandler
          // console.info('命中缓存 >>>>>', cacheKey, cacheData)
          // if (config.dadian) {
          //   return Promise.resolve(JSON.parse(JSON.stringify(cacheData.content)))
          // } else {
          //   resolveCacheData = JSON.parse(JSON.stringify(cacheData.content))
          // }
          return Promise.resolve(_.deepCopy(cacheData.content))
        }
      }
    }

    return new Promise((resolve, reject) => {
      /* eslint-disable no-undef */
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      let headers = Object.assign({}, config.headers || {})

      const method = (config.method || 'GET').toUpperCase()
      if (config.mockData) {
        let data = config.mockData()

        if (config.dataTransform) {
          data = config.dataTransform(data)
        }

        if (data.errorCode && +data.errorCode !== '0') {
          reject(data)
        } else {
          resolve(data)
        }
      }

      const $$http = () => {
        // 处理入参
        if (config.dataType === 'form-data' && typeof params === 'object') {
          params = (params => {
            let formData = []
            for (let key in params) {
              formData.push([key, encodeURIComponent(params[key])].join('='))
            }
            return formData.join('&')
          })(params)

          if (!headers['content-type']) {
            headers['content-type'] = 'application/x-www-form-urlencoded'
          }
        } else {
          headers['content-type'] = 'application/json'
        }

        // 请求时默认带上cookie
        headers['Cookie'] = cache.getCookieString()

        const request = onComplete => {
          !config.dadian ? requestingCount++ : dadianCount++

          config.noLoading || currentPage.setLoading(true)

          // 设置了自定义的超时时间
          let _requestTimeout = requestTimeout
          if (config.timeout) {
            _requestTimeout = config.timeout
          }

          // 请求实例
          const _request = function() {
            // 请求超时判断
            let _requestTime = 0
            let _tick = null
            const _startTick = () => {
              _tick = setTimeout(() => {
                // console.log(`请求${config.url}计时 >>>`, _requestTime)

                _requestTime = _requestTime + 1000

                if (_requestTime >= _requestTimeout) {
                  console.warn(`请求${config.url}超时，即将终止请求。`)
                  try {
                    _startRequest &&
                      _startRequest.abort &&
                      _startRequest.abort()
                  } catch (e) {
                    // 统计错误
                    /* eslint-disable no-undef */
                    getApp().globalData.xlog &&
                      getApp().globalData.xlog.send('reqAbortErr', {
                        stack: e,
                        data: {
                          url: config.url,
                          data: params,
                          header: headers,
                          method: method,
                          responseType: config.responseType || 'text'
                        }
                      })
                    /* eslint-enable no-undef */
                  }
                  clearTimeout(_tick)
                } else {
                  _startTick()
                }
              }, 1000)
            }
            _startTick()

            // 开始时间
            const _startTime = +new Date()

            const _startRequest = api.request({
              url: config.url,
              data: params,
              header: headers,
              method: method,
              responseType: config.responseType || 'text',
              success: res => {
                let data = {}

                // 请求时长
                const _reqDuration = +new Date() - _startTime

                // 处理 response 的 Cookie
                cache.responseCookieHandler(res.header || {})

                if (+res.statusCode === 200) {
                  data = res.data || {}

                  // errorCode 不为 0
                  if (data.errorCode && +data.errorCode !== 0) {
                    // resolveCacheData 为空时才 reject
                    const _errInfo = Object.assign({}, data, {
                      retryCount: _retryCount
                    })
                    if (!resolveCacheData) {
                      reject(_errInfo)
                    }
                  } else {
                    // 正确返回
                    if (config.dataTransform) {
                      data = config.dataTransform(data)
                    }
                    if (typeof config.cache === 'function') {
                      config.cache = config.cache(data) === true
                    }

                    // 缓存控制机制
                    if (
                      config.cacheHandler &&
                      typeof config.cacheHandler === 'function'
                    ) {
                      config.cacheHandler = config.cacheHandler(data)

                      if (+config.cacheHandler === 1) {
                        // 更新方式1：严格匹配 url+入参
                        // console.log('缓存控制机制: 更新方式1：严格匹配 url+入参 >>>', cacheKey)
                        api.removeCache(cacheKey)
                      }

                      if (+config.cacheHandler === 2) {
                        // 更新方式2：模糊匹配 url
                        // console.log('缓存控制机制: 更新方式2：模糊匹配 url >>>', data)
                        // console.log('缓存更新前 >>>', wx.elong_api._caches)
                        // wx.elong_api._caches && Object.keys(wx.elong_api._caches).map(key => {
                        //   key.indexOf(cacheKey.split('?')[0]) !== -1 && api.removeCache(key)
                        // })
                        api.removeCache(cacheKey.split('?')[0], true)
                        // console.log('缓存更新后 >>>', wx.elong_api._caches)
                      }
                    }

                    // 缓存机制
                    if (config.cache) {
                      let cacheContent = _.deepCopy(data)

                      // 如果返回的是对象格式，标识来源于 cache
                      if (
                        typeof cacheContent === 'object' &&
                        !Array.isArray(cacheContent)
                      ) {
                        cacheContent = Object.assign({}, cacheContent, {
                          fromCache: true
                        })
                      }

                      const cacheData = {
                        content: cacheContent,
                        expires: Number(config.cacheTime)
                          ? new Date().getTime() + Number(config.cacheTime)
                          : 0 // 设置会话缓存的过期时间
                      }
                      api.setCache(cacheKey, cacheData)
                    }

                    // 如果返回的是对象格式，才合入 retryCount
                    if (typeof data === 'object' && !Array.isArray(data)) {
                      data = Object.assign({}, data, {
                        retryCount: _retryCount
                      })
                    }

                    if (!config.dadian && resolveCacheData) {
                      resolve(resolveCacheData)
                    } else {
                      resolve(data)
                    }
                  }
                } else {
                  const _errInfo = {
                    errorCode: 'STATUS_CODE_NO_200',
                    errorMessage: res.errMsg,
                    result: res,
                    retryCount: _retryCount
                  }

                  if (config.retry && typeof +config.retry === 'number') {
                    _retry(_errInfo)
                  } else {
                    reject(_errInfo)
                  }
                }
              },
              fail: e => {
                let _errMsg = e.errMsg
                let _errCode = 'REQUEST_FAIL'

                if (
                  e.errMsg === 'request:fail abort' ||
                  e.errMsg === 'request:fail timeout'
                ) {
                  _errMsg = '请求超时了，请稍后再试'
                  _errCode = 'REQUEST_TIMEOUT'
                }

                const _errInfo = {
                  errorCode: _errCode,
                  errorMessage: _errMsg,
                  result: e,
                  retryCount: _retryCount
                }

                if (config.retry && typeof +config.retry === 'number') {
                  _retry(_errInfo)
                } else {
                  reject(_errInfo)
                }
              },
              complete: res => {
                // 错误信息
                if (
                  res.errMsg === 'request:fail abort' ||
                  res.errMsg === 'request:fail timeout'
                ) {
                  res.statusCode = 'TIMEOUT'
                  res.data = '请求超时'
                }

                // console.log('request >> ', config.url, ',request Data = ', params, ' , result = ', res)
                config.noLoading ||
                  setTimeout(() => {
                    currentPage.setLoading(false)
                  }, 300)
                !config.dadian ? requestingCount-- : dadianCount--
                onComplete(config.dadian)
                clearTimeout(_tick)
              }
            })
          }
          _request()

          // 重试
          let _retryCount = 0
          let _retryTick = null
          const _retry = err => {
            // TODO: 为应对十一高峰，忽略重试配置数量，统一改为默认重试次数，1次
            // const _requestRetryMax = config.retry || requestRetryMax
            const _requestRetryMax = requestRetryMax
            if (_retryCount < _requestRetryMax) {
              // console.log(`请求${config.url}失败，正在重试...`)
              _retryTick = setTimeout(() => {
                config.noLoading || currentPage.setLoading(true)
                _request()
              }, config.retryTime || requestRetryTime)
              _retryCount++
            } else {
              // console.log(`请求${config.url}失败.`, err)
              clearTimeout(_retryTick)
              reject(err)
            }
          }
        }

        // 为防止 globalData 出错，此处初始化一下队列
        initReqQueue()
        /* eslint-disable no-undef */
        let queue = getApp().globalData._reqQueue
        /* eslint-enable no-undef */

        if (!config.dadian) {
          // 普通请求
          if (requestingCount <= requestMax) {
            request(onComplete)
          } else {
            queue.waitingList.push(request)
          }
        } else {
          // 打点请求
          if (dadianCount <= dadianListMax) {
            request(onComplete)
          } else {
            queue.dadianList.push(request)
          }
        }
      }
      $$http()
      // EOF.
    })
  }
}
