import {
  api,
  BasePage,
  BaseComponent,
  Component,
  createComponent,
  regeneratorRuntime
} from '../../lib/core/index'

import getMainData from './service'

class List extends BasePage {
  // data: 同小程序data, 用来存储当前页面的状态
  data = {
    list: []
  }
  onLoad() {
    this.getListData()
  }
  async getListData() {
    const data = await getMainData({
      offset: '0',
      limit: '20',
      tab: 'all'
    })
    this.setData({
      list: data.data
    })
    console.log(this.data.list)
  }
  setLoading(done){
    if (done){
      api.showLoading({ title: '加载中' })
    }else{
      api.hideLoading()
    }
  }
}

Component(createComponent(new List()))
