// 全局事件中心
export default class Event {
  constructor(id) {
    this.id = id
    this.events = {}
  }
  on(eventName, callback) {
    const events = this.events
    if (Array.isArray(events[eventName])) {
      this.events[eventName].push(callback)
    } else {
      this.events[eventName] = [callback]
    }
  }
  fire(name, par) {
    if (this.events[name]) {
      this.events[name].forEach(fn => {
        fn && fn(par)
      })
    }
  }
  off(eventName, callback) {
    const events = this.events
    let flag = false
    if (events[eventName]) {
      if (callback) {
        let idx = events[eventName].indexOf(callback)
        flag = idx > -1
        flag && events[eventName].splice(idx, 1)
      } else {
        delete events[eventName]
        flag = true
      }
    }
    return flag
  }
}
