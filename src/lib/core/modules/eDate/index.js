import * as C from './constant'
import * as Utils from './utils'

const parseConfig = (config) => {
  let reg
  if (!config) return new Date()
  if (config instanceof Date) return config
  // eslint-disable-next-line no-cond-assign
  if (reg = String(config).match(/^(\d{4})-?(\d{2})-?(\d{1,2})$/)) {
    // 2018-08-08 or 20180808
    return new Date(reg[1], reg[2] - 1, reg[3])
  }
  return new Date(config) // timestamp
}

class EDate {
  constructor (config) {
    this.$d = parseConfig(config)
    this.init()
  }

  init () {
    this.$zone = this.$d.getTimezoneOffset() / 60
    this.$zoneStr = Utils.padStart(String(this.$zone * -1).replace(/^(.)?(\d)/, '$10$200'), 5, '+')
    this.$y = this.$d.getFullYear()
    this.$M = this.$d.getMonth()
    this.$D = this.$d.getDate()
    this.$W = this.$d.getDay()
    this.$H = this.$d.getHours()
    this.$m = this.$d.getMinutes()
    this.$s = this.$d.getSeconds()
    this.$ms = this.$d.getMilliseconds()
  }

  isValid () {
    return !(this.$d.toString() === 'Invalid Date')
  }

  isLeapYear () {
    return ((this.$y % 4 === 0) && (this.$y % 100 !== 0)) || (this.$y % 400 === 0)
  }

  isSame (that) {
    return this.valueOf() === that.valueOf()
  }

  isBefore (that) {
    return this.valueOf() < that.valueOf()
  }

  isAfter (that) {
    return this.valueOf() > that.valueOf()
  }

  year () {
    return this.$y
  }

  month () {
    return this.$M
  }

  date () {
    return this.$D
  }

  hour () {
    return this.$H
  }

  minute () {
    return this.$m
  }

  second () {
    return this.$s
  }

  millisecond () {
    return this.$ms
  }

  unix () {
    return Math.floor(this.valueOf() / 1000)
  }

  valueOf () {
    // timezone(hour) * 60 * 60 * 1000 => ms
    return this.$d.getTime()
  }

  startOf (units, isStartOf = true) { // isStartOf -> endOf
    const unit = Utils.prettyUnit(units)
    const instanceFactory = (d, m, y = this.$y) => {
      const ins = new EDate(new Date(y, m, d))
      return isStartOf ? ins : ins.endOf(C.D)
    }
    const instanceFactorySet = (method, slice) => {
      const argumentStart = [0, 0, 0, 0]
      const argumentEnd = [23, 59, 59, 999]
      return new EDate(new Date()[method].apply(
        this.toDate(),
        isStartOf ? argumentStart.slice(slice) : argumentEnd.slice(slice)
      ))
    }
    switch (unit) {
      case C.Y:
        return isStartOf ? instanceFactory(1, 0)
          : instanceFactory(31, 11, this.$y)
      case C.M:
        return isStartOf ? instanceFactory(1, this.$M)
          : instanceFactory(0, this.$M + 1, this.$y)
      case C.W:
        return isStartOf ? instanceFactory(this.$D - this.$W, this.$M)
          : instanceFactory(this.$D + (6 - this.$W), this.$M, this.$y)
      case C.D:
      case C.DATE:
        return instanceFactorySet('setHours', 0)
      case C.H:
        return instanceFactorySet('setMinutes', 1)
      case C.MIN:
        return instanceFactorySet('setSeconds', 2)
      case C.S:
        return instanceFactorySet('setMilliseconds', 3)
      default:
        return this.clone()
    }
  }

  endOf (arg) {
    return this.startOf(arg, false)
  }

  mSet (units, int) {
    const unit = Utils.prettyUnit(units)
    switch (unit) {
      case C.DATE:
        this.$d.setDate(int)
        break
      case C.M:
        this.$d.setMonth(int)
        break
      case C.Y:
        this.$d.setFullYear(int)
        break
      default:
        break
    }
    this.init()
    return this
  }

  set (string, int) {
    if (!Utils.isNumber(int)) return this
    return this.clone().mSet(string, int)
  }

  add (number, units) {
    const unit = (units && units.length === 1) ? units : Utils.prettyUnit(units)
    if (['M', C.M].indexOf(unit) > -1) {
      let date = this.set(C.DATE, 1).set(C.M, this.$M + number)
      date = date.set(C.DATE, Math.min(this.$D, date.daysInMonth()))
      return date
    }
    if (['y', C.Y].indexOf(unit) > -1) {
      return this.set(C.Y, this.$y + number)
    }
    let step
    switch (unit) {
      case 'm':
      case C.MIN:
        step = C.MILLISECONDS_A_MINUTE
        break
      case 'h':
      case C.H:
        step = C.MILLISECONDS_A_HOUR
        break
      case 'd':
      case C.D:
        step = C.MILLISECONDS_A_DAY
        break
      case 'w':
      case C.W:
        step = C.MILLISECONDS_A_WEEK
        break
      default: // s seconds
        step = C.MILLISECONDS_A_SECOND
    }
    const nextTimeStamp = this.valueOf() + (number * step)
    return new EDate(nextTimeStamp)
  }

  subtract (number, string) {
    return this.add(number * -1, string)
  }

  format (formatStr = 'YYYY-MM-DD') {
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

    return formatStr.replace(/Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|m{1,2}|s{1,2}|Z{1,2}/g, (match) => {
      switch (match) {
        case 'YY':
          return String(this.$y).slice(-2)
        case 'YYYY':
          return String(this.$y)
        case 'M':
          return String(this.$M + 1)
        case 'MM':
          return Utils.padStart(String(this.$M + 1), 2, '0')
        case 'MMM':
          return months[this.$M].slice(0, 3)
        case 'MMMM':
          return months[this.$M]
        case 'D':
          return String(this.$D)
        case 'DD':
          return Utils.padStart(String(this.$D), 2, '0')
        case 'd':
          return String(this.$W)
        case 'dddd':
          const s = new EDate(this.$d).format('YYYY-MM-DD')
          const globalData = getApp() ? getApp().globalData : null

          if (!globalData) {
            return weeks[this.$W]
          }

          const today = globalData.today
          const yesterday = globalData.yesterday
          const tomorrow = globalData.tomorrow

          if (s === today) {
            return '今天'
          } else if (s === yesterday) {
            return '昨天'
          } else if (s === tomorrow) {
            return '明天'
          } else {
            return weeks[this.$W]
          }
        case 'H':
          return String(this.$H)
        case 'HH':
          return Utils.padStart(String(this.$H), 2, '0')
        case 'm':
          return String(this.$m)
        case 'mm':
          return Utils.padStart(String(this.$m), 2, '0')
        case 's':
          return String(this.$s)
        case 'ss':
          return Utils.padStart(String(this.$s), 2, '0')
        case 'Z':
          return `${this.$zoneStr.slice(0, -2)}:00`
        default: // 'ZZ'
          return this.$zoneStr
      }
    })
  }

  diff (input, units, float = false) {
    const unit = Utils.prettyUnit(units)
    const that = input instanceof EDate ? input : new EDate(input)
    const diff = this - that
    let result = Utils.monthDiff(this, that)
    switch (unit) {
      case C.Y:
        result /= 12
        break
      case C.M:
        break
      case C.Q:
        result /= 3
        break
      case C.W:
        result = diff / C.MILLISECONDS_A_WEEK
        break
      case C.D:
        result = diff / C.MILLISECONDS_A_DAY
        break
      case C.H:
        result = diff / C.MILLISECONDS_A_HOUR
        break
      case C.MIN:
        result = diff / C.MILLISECONDS_A_MINUTE
        break
      case C.S:
        result = diff / C.MILLISECONDS_A_SECOND
        break
      default: // milliseconds
        result = diff
    }
    return float ? result : Utils.absFloor(result)
  }

  daysInMonth () {
    return this.endOf(C.M).$D
  }

  clone () {
    return new EDate(this)
  }

  toDate () {
    return new Date(this.$d)
  }

  toArray () {
    return [
      this.$y,
      this.$M,
      this.$D,
      this.$H,
      this.$m,
      this.$s,
      this.$ms
    ]
  }

  toJSON () {
    return this.toISOString()
  }

  toISOString () {
    return this.toDate().toISOString()
  }

  toObject () {
    return {
      years: this.$y,
      months: this.$M,
      date: this.$D,
      hours: this.$H,
      minutes: this.$m,
      seconds: this.$s,
      milliseconds: this.$ms
    }
  }

  toString () {
    return this.$d.toUTCString()
  }

  getTimezoneDate () {
    const d = this.toDate()
    // 得到1970年一月一日到现在的秒数
    const len = d.getTime()
    // 本地时间与GMT时间的时间偏移差
    const offset = d.getTimezoneOffset() * 60000
    // 得到现在的格林尼治时间
    const utcTime = len + offset
    return new Date(utcTime + 3600000 * 8)
  }
}

export default config => (new EDate(config))
