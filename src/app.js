import { createApp, BaseApp } from './lib/core/create-app'

class MyApp extends BaseApp {
  globalData = {
    a: 1
  }
}
 
App(createApp(MyApp))
