import Preload from './preload'
import { BaseApp, createApp } from './create-app'
import { _Component, createComponent } from './extends'
import { BasePage, BaseComponent } from './components'
import api from './processApis'
import EventCenter from './event'
import Service from './service'
import regeneratorRuntime from './regeneratorRuntime'

// 全局发布订阅对象
const Event = new EventCenter()

export default {
  Event,
  BaseApp,
  createApp,
  Component: _Component,
  createComponent,
  api,
  Preload,
  BasePage,
  BaseComponent,
  Service,
  regeneratorRuntime
}

export {
  Event,
  BaseApp,
  createApp,
  _Component as Component,
  createComponent,
  api,
  Preload,
  BasePage,
  BaseComponent,
  Service,
  regeneratorRuntime
}
