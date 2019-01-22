import { deleteFromArray, sortObj, copyObj,isEqualArrShallow } from './util'
// cache单例
// let cacheSingleton

// Cache类, 若使用Cookie模块, 则继承该类, 在Cookie模块中再进行实例化
class Storage {
  constructor() {
    // 内存中的cache
    this._cache = {}
    // 缓存脏数据记录map
    this._dirtyKeys = []
    // 标storage是否已存满, 若已存满, 不再向内存写入
    this._isStorageFull = false
    // _syncData的更新循环锁
    this._updateLoopLock = false
    // this._init(errCb)
  }
  _init(errCb) {
    let keys
    const cache = this._cache
    // 同步获取小程序缓存中所有key
    try {
      keys = wx.getStorageInfoSync().keys
    } catch (e) {
      errCb && errCb(e, 'getStorageInfoSyncErr')
      // 如果同步获取失败, 过10秒再次调用_init方法
      setTimeout(this._init.bind(this, errCb), 10000)
      return
    }
    // 将小程序的keys在列表中缓存, 并打上标志值
    keys.forEach(key => {
      cache[key] = '_s2c_'
    })
    // 心跳同步
    this.timer = setInterval(this._syncData.bind(this, errCb), 15000)
  }
  // 同步内存和小程序storage的方法
  _syncData(errCb) {
    // console.log('_syncData执行')
    // 如果上次更新还未更新完或本次没有需更新的项, 本次不更新, 否则将更新锁置为true, 开始更新
    if (this._updateLoopLock) {
      console.log('还在读写中, 跳过本次循环')
      console.log(JSON.stringify(this._dirtyKeys))
      return
    }
    this._updateLoopLock = true
    // console.log('_syncData执行了: 现在的cache是', JSON.stringify(this._cache))

    // 将脏数据数组拷贝给updatingDirtyKeys, 并清空脏数据数组
    const dirtyKeys = this._dirtyKeys
    const updatingDirtyKeys = [...dirtyKeys]
    dirtyKeys.length = 0

    const cache = this._cache
    const cacheKeys = Object.keys(cache)
    const _this = this
    let storageKeys

    try {
      storageKeys = wx.getStorageInfoSync().keys
    } catch (e) {
      errCb &&
        errCb(e, {
          errMsg: 'wx.getStorageInfoSync error'
        })
    }

    // 删除storage中 "cache中没有,但storage中有" 的key
    if (storageKeys) {
      const deleteKeys = storageKeys.filter(storageKey => {
        return cacheKeys.indexOf(storageKey) === -1
      })
      deleteKeys.length > 0 &&
        console.log('检测deleteKeys: ', JSON.stringify(deleteKeys))
      if (deleteKeys.length) {
        deleteKeys.forEach(key => {
          try {
            wx.removeStorageSync(key)
          } catch (e) {
            errCb &&
              errCb(e, {
                errMsg: 'wx.removeStorageSync error'
              })
          }
        })
      }
    }

    // 剩余更新个数计数
    let remainCount = updatingDirtyKeys.length

    // 如果存储已满或没有key需要更新, return
    if (this._isStorageFull || remainCount === 0) {
      this._updateLoopLock = false
      return
    }

    const constUpdatingDirtyKeys = [...updatingDirtyKeys]

    // 定义本次syncData结束(所有key的更新回调执行完毕, 或超时)后的结束操作
    const finishSyncDataLoop = () => {
      // 将未更新的key重新推入dirtyKeys数组
      updatingDirtyKeys.forEach(dirtyKey => {
        dirtyKeys.indexOf(dirtyKey) === -1 && dirtyKeys.push(dirtyKey)
      })
      // 打开更新锁
      this._updateLoopLock = false
    }

    // 设定超时定时器
    const checkTimer = setTimeout(() => {
      console.log('进入超时处理函数')
      // 如果10s后更新锁还锁着(不是所有的complete callback都正确执行), 将更新锁关闭, 将未更新的key推入脏数组队列
      if (this._updateLoopLock) {
        finishSyncDataLoop()
      }
    }, 10000)

    // cache -> storage
    constUpdatingDirtyKeys.forEach(key => {
      console.log('需要更新的key: ', key)

      try {
        wx.setStorage({
          key,
          data: cache[key],
          success() {
            deleteFromArray(key, updatingDirtyKeys)
          },
          fail(e) {
            console.log('wx.setStorage的fail方法的error')
            const { errMsg } = e
            if (errMsg && errMsg.indexOf('exceed') > -1) {
              console.warn(
                `向storage写入 ${key} 的key时超过10MB限制, 将完全采用内存存储`
              )
              _this._isStorageFull = true
            }
            errCb &&
              errCb(e, {
                errMsg: 'wx.setStorage fail callback',
                key,
                value: cache[key]
              })
          },
          complete() {
            remainCount--
            console.log('remainCount', remainCount)
            if (remainCount === 0) {
              clearTimeout(checkTimer)
              finishSyncDataLoop()
            }
          }
        })
      } catch (e) {
        console.log('try{wx.setStorage} catch到的error')
        errCb &&
          errCb(e, {
            errMsg: 'wx.setStorage error',
            key,
            value: cache[key]
          })
      }
    })
  }
  getStorage(key, errCb) {
    const cache = this._cache
    // 如果内存中即有需要得到的结果(且不为_init时标志的标志值, 直接返回
    if (cache.hasOwnProperty(key) && cache[key] !== '_s2c_') {
      // immutable
      let ret = cache[key]
      if (typeof ret === 'object') {
        return copyObj(ret)
      }
      return ret
    }
    // 如果内存中没有, 从原生storage中读取, 并存入cache后返回
    try {
      // 若key是storage中没有的值, 则返回空字符串
      let res = wx.getStorageSync(key)
      if (res === '') {
        return res
      }
      // immutable
      cache[key] = res
      if (typeof res === 'object') {
        return copyObj(res)
      }
      return res
    } catch (e) {
      // 若读取失败, 返回空字符串
      console.warn(
        `wx.getStorageSync获取key值为"${key}"时获取失败, 返回空字符串`
      )
      errCb &&
        errCb(e, {
          errMsg: 'wx.getStorageSync error',
          key
        })
      return ''
    }
  }
  setStorage(key, value) {
    const cache = this._cache
    const dirtyKeys = this._dirtyKeys
    // 这里有更严谨的循环diff对象写法, 但场景上用不上, 还不如直接赋值新对象进行io读写
    if (Array.isArray(value)) {
      if (isEqualArrShallow(value, cache[key])) {
        console.warn('存储数据与缓存中的数组相等')
        return
      }
    } else if (typeof value === 'object') {
      let stringify = JSON.stringify
      value = sortObj(value)
      if (stringify(value) === stringify(cache[key])) {
        console.warn('存储对象与缓存中的对象相等, return')
        return
      }
    } else {
      if (cache[key] === value) {
        return
      }
    }
    // 如果该key是这次修改变脏的, 添加进脏数据数组, isSetting标识数据是否正在写入
    dirtyKeys.indexOf(key) === -1 && dirtyKeys.push(key)
    cache[key] = value
  }
  removeStorage(key) {
    const dirtyKeys = this._dirtyKeys
    const cache = this._cache
    if (!cache.hasOwnProperty(key)) {
      console.warn(`缓存中没有名为 "${key}" 的key`)
      return
    }
    // 如果该key在脏数据数组, 删除
    deleteFromArray(key, dirtyKeys)
    delete cache[key]
  }
  clearStorage(errCb) {
    try {
      wx.clearStorageSync()
      this._cache = {}
      this._dirtyKeys.length = 0

      this._isStorageFull = false
    } catch (e) {
      errCb &&
        errCb(e, {
          errMsg: 'wx.clearStorageSync error'
        })
    }
  }
  getSize(errCb) {
    try {
      const { currentSize, limitSize } = wx.getStorageInfoSync()
      console.warn(`currentSize: ${currentSize}KB, limitSize: ${limitSize}`)
      return { currentSize, limitSize }
    } catch (e) {
      errCb &&
        errCb(e, {
          errMsg: 'wx.getStorageInfoSync error'
        })
    }
  }
}

export default Storage
