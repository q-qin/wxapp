import {
  PAGE_LIFETIMES,
  COMPONENT_LIFETIMES,
  COMPONENT_RESERVED_FNS,
  COMPONENT_RESERVED_OBJECT,
  COMPONENT_RESERVED_ARRAY_OR_STRING,
  COMPONENT_RESERVED_PROPS
} from './constant'

/**
 * 对返回给小程序的config对象进行包装后返回给小程序运行时
 * @param {*} config 返回给小程序的config对象
 */
export function _Component(config) {
  Component(config)
}

/**
 * 将object like的保留对象复制入构造对象
 * @param {string} propName 保留关键字名
 * @param {object} config 构造对象config
 * @param {object} target 源对象
 */

function mergeReservedObjectToConfig(propName, config, target) {
  const source = target[propName]
  if (typeof source === 'object') {
    config[propName] = source
  }
}

/**
 * 将string 或 array like 的保留项复制入构造对象
 * @param {string} propName 保留关键字名
 * @param {key} config 构造对象config
 * @param {key} target 源对象
 */

function mergeReservedStringOrArrayToConfig(propName, config, target) {
  const source = target[propName]
  if (typeof source === 'string' || Array.isArray(source)) {
    config[propName] = source
  }
}

/**
 * 获取一个类中的自定义属性或方法
 * @param {object} instance 需要操作的类的实例
 * @param {boolean} shakeFn, 如果需要留下属性, shakeFn==true, 如果需要留下方法, shakeFn==false
 */

function filterCustomProps(instance, shakeFn) {
  // 需排除掉的保留字
  const excludes = shakeFn ? COMPONENT_RESERVED_PROPS : COMPONENT_RESERVED_FNS
  // 实例对应构造函数的原型
  const prototype = instance.constructor.prototype || {}
  //
  const sourceKeys = shakeFn
    ? Object.keys(instance)
    : Object.getOwnPropertyNames(prototype)
  return shakeFn
    ? sourceKeys.filter(key => {
        return (
          typeof instance[key] !== 'function' && excludes.indexOf(key) === -1
        )
      })
    : sourceKeys.filter(key => {
        return (
          typeof prototype[key] === 'function' && excludes.indexOf(key) === -1
        )
      })
}

/**
 * 使Target类实例继承Base类实例, 构造返回给小程序的config对象
 * @param {class} Target
 */

export function createComponent(target) {
  const type = target.type
  // 合并data
  const data = Object.assign({}, target.$data || {}, target.data || {})

  // 合并properties
  const properties = Object.assign(
    {},
    target.$properties || {},
    target.properties || {}
  )
  
  
  // 构造对象config的lifetimes对象
  const configLifeTimes = {}

  // 构造对象config的methods对象, 合并基类的自定义方法
  const $methods = type === 'page' ? target.$methods.page : target.$methods.components
  const configMethods = Object.assign({}, $methods || {})

  // target类的自定义方法 (放入methods中)
  const targetCustomMethods = filterCustomProps(target, false)

  // target类的自定义属性(在created钩子中导入config)
  const targetCustomProps = filterCustomProps(target, true)

  // 构造对象config的自定义属性
  const configProps = {}

  // 获取基类上的页面声明周期和组件声明周期方法
  const basePageLifeTimes = target.$pageLifeTimes || {}
  const baseComponentLifeTimes = target.$componentLifeTimes || {}

  // 优化垃圾回收机制
  const baseBeforeOnLoad = target['$beforeOnLoad']
  const targetBeforeOnload = target['beforeOnLoad']

  // 移植自定义属性 -> configProps
  targetCustomProps.forEach(prop => {
    configProps[prop] = target[prop]
  })

  // 移植自定义方法 -> methods
  targetCustomMethods.forEach(method => {
    configMethods[method] = target[method]
  })

  // 合并页面生命周期和方法 -> methods
  if (type === 'page') {
    PAGE_LIFETIMES.forEach(lt => {
      // 优化垃圾回收机制
      let baseLt = basePageLifeTimes[lt]
      let targetLt = target[lt]
      // 如果基类没提前定义, 初始化对象中也没定义, return
      if (!baseLt && !targetLt) return
      configMethods[lt] = function(...args) {
        // 如果该类是小程序原生页面类, 再挂载基类上的页面方法
        if (baseLt) {
          baseLt.call(this, targetLt, ...args)
        } else {
          targetLt && targetLt.apply(this, args)
        }
      }
    })
  }

  // 合并组件生命周期 -> lifetimes
  COMPONENT_LIFETIMES.forEach(lt => {
    // 优化垃圾回收机制
    const baseLt = baseComponentLifeTimes[lt]
    const targetLt = target[lt]
    // 如果基类没提前定义, 初始化对象中也没定义, return
    if (!baseLt && !targetLt) return
    configLifeTimes[lt] = function(...args) {
      // created时挂载所有自定义属性
      if (lt === 'created') {
        Object.keys(configProps).forEach(key => {
          this[key] = configProps[key]
        })
      }
      if (lt === 'attached' && type === 'page') {
        baseBeforeOnLoad && baseBeforeOnLoad.apply(this, args)
        targetBeforeOnload && targetBeforeOnload.apply(this, args)
      }
      // 如果该类是小程序原生组件类, 再挂载基类上的组件方法
      if (type === 'component' && baseLt) {
        baseLt.call(this, targetLt, ...args)
      } else {
        targetLt && targetLt.apply(this, args)
      }
    }
  })

  // 构造对象config的字面量定义
  const config = {
    data,
    methods: configMethods,
    lifetimes: configLifeTimes
  }

  // 如果是type是component方法再挂载properties
  if (type === 'component') config.properties = properties

  // merge reserved object
  COMPONENT_RESERVED_OBJECT.forEach(key => {
    mergeReservedObjectToConfig(key, config, target)
  })

  // merge reserved string or array
  COMPONENT_RESERVED_ARRAY_OR_STRING.forEach(key => {
    mergeReservedStringOrArrayToConfig(key, config, target)
  })

  // console.log('config return之前: ', config)

  return config
}
