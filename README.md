# 自己动手搭建小程序开发框架

小程序官方IDE太不好用了，还是喜欢用vscode来开发
<br/>
小程序根目录选dist/
<br/>
.less编译生成.wxss
<br/>
官方的框架api又是特别麻烦，改造他

## 框架亮点
 * 1.框架封装了网络请求模块，解决了小程序最多发起10个请求的限制，并添加了缓存，重试等机制。
 ```
import { Service } from '../../lib/core/index'
    const getData = Service({
        url: 'http://www.3keji.com:4001/news/list',
        // method: 'post',  // 默认get
        // dataType: 'form-data', // 如果是post加dataType
        noLoading: false,
        cache: true,
        cacheTime: 60 * 1000, // 60秒
        retry: 3,
        retryTime: 2000
    })
export default getData
 ```
 * 2.框架内置了regeneratorRuntime库，在小程序编辑器内勾选ES6转ES5后，可提供async function支持。
 ``` 
 async getListData() { 
    let data = await getData({
        offset:0,
        limit:10,
        tab:'all'
    })
 }
 ```
 * 3.框架提供了一个全局事件中心，是发布订阅模式的一个封装，可以跨页面进行事件消息传递。$setData为优化原生setData,支持回调[,callback]
```
a.js
import { Event } from './lib/core/index'
    ...
    onLoad(){
        Event.addEventListener('event', data => {
            this.$setData({ a: data.a })
        })
    }
b.js
import { Event } from './lib/core/index'
    ...
    tapFn(){
        Event.triggerEvent('event', { a: 2 })
    }
```
 * 4.预加载机制 onPreload(params, cacheTime)
 * 5.路由API扩展 & 页面间事件通信
 * 6.路由锁
 * 7.页面间传参和事件通信
 * 8.API promisify
```
import { API } from './lib/core/index'
API.showToast({ title: 'test' }).then(res=>{

}).catch(res=>{

}).finally(res=>{

})
```

监听文件变化
``` gulp watch ```
打包整体文件夹
``` gulp ```
