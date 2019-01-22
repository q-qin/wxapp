import { checkReservedWords } from './utils'
import { APP_LIFECYCLES } from "./constant";

export class BaseApp {
  /**
   * 小程序初始化
   */
  onLaunch(obj) {}
  /**
   * 小程序显示
   */
  onShow(obj) {}
  /**
   * 小程序隐藏
   */
  onHide() {}
  /**
   * 小程序全局出错
   */
  onError(msg) {}
  /**
   * 页面不存在
   */
  onPageNotFound(obj) {}
}

export function createApp(ClassRef) {
  // 检查类名关键字
  if (!checkReservedWords(ClassRef.name)) {
    throw new TypeError(
      '"App", "Component", "Page", "wx"是保留关键字, 请给class重新命名'
    )
  }

  const appInstance = new ClassRef()

  let weappConf = {
    onLaunch(options) {
      if (typeof appInstance.onLaunch === 'function') {
        appInstance.onLaunch.call(this, options)
      }
    },
    onShow(options) {
      if (typeof appInstance.onShow === 'function') {
        appInstance.onShow.call(this, options)
      }
    },
    onHide() {
      if (typeof appInstance.onHide === 'function') {
        appInstance.onHide.call(this)
      }
    },
    onError(msg) {
      if (typeof appInstance.onError === 'function') {
        appInstance.onError.call(this, msg)
      }
    },
    onPageNotFound(obj) {
      if (typeof appInstance.onPageNotFound === 'function') {
        appInstance.onShow.call(this, obj)
      }
    }
  }

  // 删除类实例声明周期方法
  APP_LIFECYCLES.forEach(key => {
    if (appInstance.hasOwnProperty(key)) {
      delete appInstance[key]
    }
  })

  weappConf = Object.assign({}, weappConf, appInstance)

  return weappConf
}
