/**
 * idx.js 页面可复用的业务代码
 * 
 */

import { Decrypt } from '../lib/http.js'
// import { apple, https } from '../config/config.js'
import { getOpenId, getConfig, getFormid } from 'api.js'
import { rnd } from '../utils/util.js'
const apple = {};
const https = {};
/**
 * @name openId获取
 */
export const HasOpenId = () => {
  return new Promise((resolve, reject) => {
    if (wx.getStorageSync('openId')) {
      resolve()
    }else{
      wx.login({
        success (res) {
          let body = {
            code: res.code
          }
          getOpenId(body).then(res => {
            wx.setStorageSync('openId', res.openId)
            resolve()
          })
        }
      })
    }
  })
}

/**
 * @name config获取
 */
export const HasConfig = (app) => {
  return new Promise((resolve, reject) => {
    if (!!app.globalConfig) {
      resolve()
    } else {
      getConfig().then(res => {
        app.globalConfig = res.config
        resolve()
      })
    }
  })
}

/**
 * @name formid获取
 */
export const UpFormid = (formid) => {
  return new Promise((resolve, reject) => {
    if (!wx.getStorageSync('openId')) {
      resolve()
    } else {
      let body = {
        formid: formid,
        time: new Date().getTime()
      }
      getFormid(body).then(() => {
        resolve()
      }).catch(() => {
        resolve()
      })
    }
  })
}

/**
 * @name 定时器内容显示
 */
export const IntervalShow = (that, config) => {
  let intConfigs = Object.keys(that.data.intConfigs)
  if (intConfigs.length > 0) {
    for (let idx in intConfigs) {
      if (!!config[intConfigs[idx]] && !!config[intConfigs[idx]].flag && !!config[intConfigs[idx]].array && config[intConfigs[idx]].array.length > 0) {
        that.data.intConfigs[intConfigs[idx]] = config[intConfigs[idx]].array[rnd(0, config[intConfigs[idx]].array.length - 1)]
      }
    }
    that.setData({
      intConfigs: that.data.intConfigs
    })
  }
}

/**
 * @name 定时器切换
 */
export const IntervalChange = (that, config) => {
  let time = config.intervalTime || 15000
  IntervalShow(that, config)
  return setInterval(() => {
    IntervalShow(that, config)
  }, time)
}

/**
 * @name 进入的统计打点
 */
export const recordOpen = (opt, app) => {
  return new Promise((resolve, reject) => {
    let s = typeof(opt.s) == 'object' ? opt.s : JSON.parse(decodeURIComponent(opt.s || '%7B%7D'))
    app.globalRecord.channel = s.oc || 'self'
    app.globalRecord.fromapp = s.of || ''
    wx.reportAnalytics('open',{
      oc: app.globalRecord.channel,
      of: app.globalRecord.fromapp
    })
    wx.request({
      url: `${https.javaHttps}/dot/record`,
      data: {
        ghId: apple.ghid,
        events: [
          {
            eventId: 'open',
            val1: !!apple.record ? app.globalRecord.channel : 'test',
            val2: app.globalRecord.fromapp,
          }
        ]
      },
      method: 'POST',
      success(res) {
        resolve(res)
      },
      fail(res) {
        reject(res)
      }
    })
  })
}

/**
 * @name 点击出去的统计打点
 */
export const recordClick = (opt) => {
  return new Promise((resolve, reject) => {
    wx.reportAnalytics('click', {
      ot: opt.toapp
    })
    wx.request({
      url: `${https.javaHttps}/dot/record`,
      data: {
        ghId: apple.ghid,
        events: [
          {
            eventId: 'click',
            val2: opt.toapp,
          }
        ]
      },
      method: 'POST',
      success(res) {
        resolve(res)
      },
      fail(res) {
        reject(res)
      }
    })
  })
}

/**
 * @name 换地址栏from_srv
 */
export const changeQuery = (query) => {
  return new Promise((resolve, reject) => {
    if (!!query.from_srv) {
      // 换取
      wx.request({
        url: `${https.javaHttps}/config/value/${query.from_srv}`,
        method: 'GET',
        success(res) {
          if (res.data.code == 200 && !!res.data.data) {
            let _query = JSON.parse(decodeURIComponent(Decrypt(res.data.data)).replace(/(^")|("$)/g, ""))
            resolve(_query)
          }
        },
        fail(res) {
          reject(res)
        }
      })
    } else {
      resolve(query)
    }
  })
}