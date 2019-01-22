const app = getApp()
import { HasOpenId, HasConfig, UpFormid, IntervalChange, recordClick} from '../../lib/idx.js'
import { rnd } from '../../utils/util.js'
const md = require('./mk.md');
Page({
  data: {
    md:md
  },
  onLoad() {
    
  },
  // 开始
  tapBegin (event) {
    wx.navigateTo({
      url: '../list/list',
    })
  },
  // 跳转小程序埋点
  tapRecord (event) {
    if (!!event && !!event.currentTarget && !!event.currentTarget.dataset && !!event.currentTarget.dataset.appid){
      let opt = {
        toapp: event.currentTarget.dataset.appid
      }
      recordClick(opt);
    }
  },
  // 分享
  onShareAppMessage () {
    let tit = "2018世界杯冠军之路，你能否猜到？"
    let img = ''
    if (!!app.globalConfig.indexShareTits && app.globalConfig.indexShareTits.length > 0){
      tit = app.globalConfig.indexShareTits[rnd(0, app.globalConfig.indexShareTits.length - 1)]
    }
    if (!!app.globalConfig.indexShareImgs && app.globalConfig.indexShareImgs.length>0){
      let img = app.globalConfig.indexShareImgs[rnd(0, app.globalConfig.indexShareImgs.length - 1)]
    }
    return {
      title: tit,
      imageUrl: img,
      path: "/pages/index/index"
    }
  },
  onShow() {
    if (this.data.intTimes != null){
      this.data.intTimes = IntervalChange(this, app.globalConfig)
    }
  },
  onHide() {
    clearInterval(this.data.intTimes)
  }
})
