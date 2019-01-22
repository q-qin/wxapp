function testPreload() {
  console.log(
    '=========================== testPreload ==========================='
  )
  console.log('onPreloads数组: ', Preload.onPreloads)
  console.log('id2PromiseMap对象: ', Preload.id2PromiseMap)
  console.log(
    '=========================== testPreload ==========================='
  )
}

class Preload {
  // pagetype to preload function map
  static onPreloads = {}

  // routeId
  static routeId = 0

  // routeId to url map
  static id2PromiseMap = {}

  // get onPreload hook by pagetype
  static get(key) {
    return Preload.onPreloads[key]
  }

  // get promise array in Onload hook
  static getPromiseArrInOnload(routeId, preloadTag) {
    if (!preloadTag || !routeId) return null
    const promiseArr = Preload.getPreloadPromiseById(routeId)
    Preload.removePreloadPromiseById(routeId)
    if (!promiseArr || promiseArr.preloadTag !== preloadTag) return null
    return promiseArr
  }
  // add onPreload hook to global preload variable
  static add(key, func) {
    const onPreloads = Preload.onPreloads
    if (typeof onPreloads[key] !== 'function') {
      onPreloads[key] = func
    }
    testPreload()
  }

  // remove preload hook by key
  static remove(key) {
    delete Preload.onPreloads[key]
    testPreload()
  }

  // get route id & save promise by route id
  static savePromiseAndGetRouteId(
    promiseArr,
    preloadTag,
    cacheTime = 30 * 1000
  ) {
    if (typeof cacheTime !== 'number' || cacheTime < 0) {
      throw new Error('cacheTime expect a valid number')
    }
    promiseArr.expires = +new Date() + cacheTime
    promiseArr.preloadTag = preloadTag
    Preload.id2PromiseMap[++Preload.routeId] = promiseArr
    testPreload()
    return Preload.routeId
  }

  // get preload Promise by route id
  static getPreloadPromiseById(routeId) {
    const promiseArr = Preload.id2PromiseMap[routeId]
    if (!promiseArr) return null
    const expires = promiseArr.expires
    testPreload()
    // judge if promise expires
    if (expires && expires < +new Date()) {
      Preload.removePreloadPromiseById(routeId)
      return null
    }
    return promiseArr
  }

  // remove preload Promise by route id
  static removePreloadPromiseById(routeId) {
    delete Preload.id2PromiseMap[routeId]
  }
}

export default Preload

export const preloadTag2PathMap = {
  page0: '/pages/page0/index',
  page1: '/pages/page1/index',
  page2: '/pages/page2/index',
  page3: '/pages/page3/index'
}
