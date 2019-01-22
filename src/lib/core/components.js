import $setData from './$setData'
import api from './processApis'
import { JsonToQuery } from './utils'
import Preload, { preloadTag2PathMap } from './preload'
import PageEvents from './PageEvents'

class Base {
  /**
   * ALL TODO
   *  - 预加载: 
   *  - watch 
   *  - Redux 
   *
   * Done:
   *  1. $setData
   *  2. beforeOnload
   *  3. 路由锁
   *  4. pageEvents
   *  5. eventCenter
   */
  constructor(props = {}) {
    // init preload
    const { preloadTag } = props
    // 给实例挂载preloadTag(预加载标识)
    if (preloadTag && typeof preloadTag === 'string') {
      this.preloadTag = preloadTag
      const onPreload = this.onPreload
      if (typeof onPreload === 'function' && !Preload.get(preloadTag)) {
        Preload.add(preloadTag, onPreload)
      }
    }
  }

  // base data
  $data = {}
  // base proerties
  $properties = {}

  // setState props
  _pendingStates = [] // 状态调用栈
  _pendingCallbacks = [] // 回调调用栈

  // beforeOnload hook
  $beforeOnLoad = function() {}

  // beforeonload钩子
  beforeOnload() {}

  // page life times
  $pageLifeTimes = {
    onLoad(pageOnLoad, options) {
      let { preload, _eventId } = options
      // preload start
      const promiseArr = Preload.getPromiseArrInOnload(preload, this.preloadTag)
      if (promiseArr) {
        // 将预加载数据传递给options
        Object.assign(options, {
          preload: promiseArr
        })
      }
      // preload end
      api._routeLock = false

      // 处理参数和eventId
      if (_eventId) {
        if (_eventId) {
          _eventId = _eventId - 0
        }
        this._eventId = _eventId
        delete options._eventId
        const params = PageEvents.getParams(this._eventId)
        options = Object.assign({}, options, params)
      }

      // 挂载pageOnload
      pageOnLoad && pageOnLoad.call(this, options)
    },
    onShow(pageOnShow, ...args) {
      api._routeLock = false
      pageOnShow && pageOnShow.apply(this, args)
    },
    onReady(pageOnReady, ...args) {
      pageOnReady && pageOnReady.apply(this, args)
    },
    onHide(pageOnHide, ...args) {
      pageOnHide && pageOnHide.apply(this, args)
    },
    onUnload(pageOnUnload, ...args) {
      PageEvents.remove(this._eventId)
      pageOnUnload && pageOnUnload.apply(this, args)
    }
  }

  // component life times
  $componentLifeTimes = {
    created(compCreated, ...args) {
      compCreated && compCreated.apply(this, args)
    },
    attached(compAttached, ...args) {
      compAttached && compAttached.apply(this, args)
    },
    ready(compReady, ...args) {
      compReady && compReady.apply(this, args)
    },
    moved(compMoved, ...args) {
      compMoved && compMoved.apply(this, args)
    },
    detached(compDetached, ...args) {
      compDetached && compDetached.apply(this, args)
    }
  }

  // custom methods
  $methods = {
    page: {
      // fireEvent
      fireEvent(eventName, params) {
        PageEvents.fire(this._eventId, eventName, params)
      },
      // 封装setData
      $setData,
      // 踩雷
      boom() {},
      onBoom() {},
      // base preload function
      preload(
        preloadTag,
        params,
        cacheTime = 30000,
        autoJump = true,
        routeType = 'navigateTo',
        beforeRoute
      ) {
        // 获取全局对象preload中对应页面的预加载方法, 比如 'detail' 对应的方法
        const onPreload = Preload.get(preloadTag)

        if (!onPreload) {
          console.warn(`没有对应 "${preloadTag} "的路由方法, 预加载未执行`)
        }

        // 执行对应页面的预加载, 拿到预加载请求的promise
        let promiseArr = onPreload(params, cacheTime)

        if (!Array.isArray(promise)) {
          promiseArr = [promiseArr]
        }

        // 获取routeId,并对应存储promise
        let routeId = Preload.savePromiseAndGetRouteId(
          promiseArr,
          preloadTag,
          cacheTime
        )

        if (!autoJump) return routeId

        // 执行beforeNavigateTo钩子
        beforeRoute && beforeRoute.call(this, promise, id)

        const pathname = preloadTag2PathMap[preloadTag]

        // 拼接参数
        params = {
          ...params,
          preload: routeId
        }

        const url = pathname + '?' + JsonToQuery(params)

        api[routeType]({ url })
      }
    },
    components: {
      // 封装setData
      $setData
    }
  }
}
export class BasePage extends Base {
  constructor(props) {
    super(props)
    this.type = 'page'
  }
}

export class BaseComponent extends Base {
  constructor(props) {
    super(props)
    this.type = 'component'
  }
}
