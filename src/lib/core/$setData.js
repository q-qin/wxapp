// 全局脏组件队列
let queue = []
// 统计被合并没调用setData的次数
let beMergedTimes = 0
// 统计调用setData的次数
let setDataTimes = 0
// 切割key string的正则表达式 
// ["a.b[1].c"] -> ["a", "b", "1", "c"]
const reg = /[^.,\s\[\]\'\"]+/g;
    
function weappKeySet(obj, path, value) {
  let keys = JSON.stringify(path).match(reg);
  if (!keys) return obj;
  let _obj = obj;
  for (let i = 0, j = keys.length; i < j; i++) {
    let temp = _obj[keys[i]]; 
    // 若是原对象中没有的key
    if (null == temp) {
      // 若已是最后一项则赋值跳出
      if (i + 1 == j) {
        _obj[keys[i]] = value;
        break;
      }
      // 若后面下一位是数字, 则该项应该是数组, 否则为对象
      _obj[keys[i]] = /\d+/.test(keys[i + 1]) ? [] : {};
    } 
    // 若是原对象中有的key, 且已是最后一项, 赋值
    else if (i + 1 == j) {
      _obj[keys[i]] = value;
    } 
    // 若是原对象中有的key, 且不是最后一项, 进行处理
    else {
      // 先判断当前项该是数组还是对象
      let type = /\d+/.test(keys[i + 1]) ? 'Array' : 'object';
      // 如果是数组, 且原对象对应的项之前不是数组, 从新赋值一个空数组
      // 若原对象已经是数组了则不进行任何操作, 等待下一轮循环操作
      if (type === 'Array' && !Array.isArray(_obj[keys[i]])) {
        _obj[keys[i]] = []
      } 
      // 如果是对象, 且原对象对应的项之前不是对象, 从新赋值一个空对象
      // 若已经是对象了则不进行任何操作, 等待下一轮循环操作
      else if (type === 'object' && typeof _obj[keys[i]] !== 'object') {
        _obj[keys[i]] = {}
      }
    }
    // 将循环对象递进一层
    _obj = _obj[keys[i]];
  }
  return obj;
}

export default function $setData(state, callback) {
  if (state) {
    // 同步data与state
    syncData(this.data, state)
    // 打印原始state
    // console.log('原始state', state)
    this._pendingStates = this._pendingStates ? this._pendingStates : []
    this._pendingStates.push(state)
  }
  if (typeof callback === 'function') {
    (this._pendingCbs = this._pendingCbs || []).push(callback)
  }
  enqueueRender(this)
}

function syncData(data, state) {
  Object.keys(state).forEach(key => {
    weappKeySet(data, key, state[key])
  })
  // console.log('state同步结果')
  // console.log(JSON.stringify(data))
}

// 下一个eventLoop执行的方法
const nextTick = (fn, ...args) => {
  fn = typeof fn === 'function' ? fn.bind(null, ...args) : fn
  const eventLoop = wx.nextTick ? wx.nextTick : setTimeout
  eventLoop(fn)
}

// 
function enqueueRender(component) {
  // 脏组件队列中没有当前组件, 且是这个事件循环第一次往脏组件队列中添加组件时(第一次且只需一次调用nextTick()时)
  if (queue.indexOf(component) === -1 && (queue.push(component) === 1)) {
    nextTick(rerender)
    return
  }
  // console.log('被合并: '+ (++beMergedTimes) + '次')
}

// 将脏组件队列中的每个component实例拿出调用updateComponent
function rerender() {
  let component
  let list = queue
  // 清空队列
  queue = []
  while(component = list.pop()) {
    updateComponent(component)
  }
}

// 合并状态, 丢给小程序setData, 并顺序执行回调
function updateComponent(component) {
  // console.log(component)
  // 合并状态
  let statesArr = component._pendingStates
  let finalState = {}
  statesArr.forEach(state => {
    finalState = Object.assign(finalState, state)
  })

  // 打印finalState
  // console.log('finalState', finalState)

  // 清空对应组件状态队列
  component._pendingStates = []

  // 丢给setData执行
  component.setData(finalState, function() {
    // console.log('setData: '+ (++setDataTimes) + '次')
    let cbQueue = component._pendingCbs
    if (cbQueue && cbQueue.length) {
      let copyQueue = [...cbQueue]
      // 将组件的回调栈清空
      cbQueue.length = 0
      while(copyQueue.length) {
        copyQueue.shift().call(component)
      }
    }
    // component.setData(finalState, function() {
    //   // console.log('setData: '+ (++setDataTimes) + '次')
    //   if (component._pendingCbs) {
    //     while(component._pendingCbs.length) {
    //       component._pendingCbs.pop().call(component)
    //     }
    //   }
    // })
  })
}