import Event from './event'

class PageEvent {
  constructor() {
    this.eventId = 0
    this.events = {}
  }
  register(options) {
    this.eventId += 1
    let event = new Event(this.eventId)
    this.events[this.eventId] = {
      event,
      params: options
    }
    return event
  }
  fire(eventId, eventName, args) {
    let e = this.events[eventId]
    if (e && e.event) {
      e.event.fire(eventName, args)
    } else {
      console.warn('事件未注册，请先注册！！')
    }
  }
  getParams(id) {
    let o = {}
    if (this.events[id]) {
      o = this.events[id].params
    }
    return o
  }
  remove(id) {
    //注销某一个页面事件实例
    delete this.events[id]
  }
  removeAll() {
    //注销所有页面事件实例
    this.eventId = 0
    this.events = {}
  }
}

export default new PageEvent()