/* ======================== 小程序框架重构后的常量 ======================= */

/**
 * 微信小程序保留字
 */
export const RESERVED_WX_WORDS = ['App', 'Page', 'Compnent', 'wx']

/**
 * Promise化的APIs
 */
export const PROMISIFY_APIS = [
  // 网络
  // 'uploadFile', 
  // 'downloadFile',
  // 'connectSocket',
  'sendSocketMessage',
  'closeSocket',
  


  // noPromiseApi导入
  'startAccelerometer',
  'stopAccelerometer',
  'stopCompass',
  'startCompass',
  'hideToast',
  'hideLoading',
  'stopPullDownRefresh',
  'hideKeyboard',
  'pageScrollTo',
  'hideNavigationBarLoading',
  'showNavigationBarLoading',


  // 媒体
  'chooseImage',
  'previewImage',
  'getImageInfo',
  'saveImageToPhotosAlbum',
  'startRecord',
  'playVoice',
  'getBackgroundAudioPlayerState',
  'playBackgroundAudio',
  'seekBackgroundAudio',
  'chooseVideo',
  'saveVideoToPhotosAlbum',
  'loadFontFace',

  // 文件
  'saveFile',
  'getFileInfo',
  'getSavedFileList',
  'getSavedFileInfo',
  'removeSavedFile',
  'openDocument',

  // 导航
  'navigateBack',
  // 'navigateTo',
  // 'redirectTo',
  // 'switchTab',
  // 'reLaunch',

  // 位置
  'getLocation',
  'chooseLocation',
  'openLocation',

  // 设备
  'getSystemInfo',
  'getNetworkType',
  'makePhoneCall',
  'scanCode',
  'setClipboardData',
  'getClipboardData',
  'openBluetoothAdapter',
  'closeBluetoothAdapter',
  'getBluetoothAdapterState',
  'startBluetoothDevicesDiscovery',
  'stopBluetoothDevicesDiscovery',
  'getBluetoothDevices',
  'getConnectedBluetoothDevices',
  'createBLEConnection',
  'closeBLEConnection',
  'getBLEDeviceServices',
  'getBLEDeviceCharacteristics',
  'readBLECharacteristicValue',
  'writeBLECharacteristicValue',
  'notifyBLECharacteristicValueChange',
  'startBeaconDiscovery',
  'stopBeaconDiscovery',
  'getBeacons',
  'setScreenBrightness',
  'getScreenBrightness',
  'setKeepScreenOn',
  'vibrateLong',
  'vibrateShort',
  'addPhoneContact',
  'getHCEState',
  'startHCE',
  'stopHCE',
  'sendHCEMessage',
  'startWifi',
  'stopWifi',
  'connectWifi',
  'getWifiList',
  'setWifiList',
  'getConnectedWifi',

  // 界面
  'showToast',
  'showLoading',
  'hideLoading',
  'showModal',
  'showActionSheet',
  'setNavigationBarTitle',
  'setNavigationBarColor',
  'setTabBarBadge',
  'removeTabBarBadge',
  'showTabBarRedDot',
  'hideTabBarRedDot',
  'setTabBarStyle',
  'setTabBarItem',
  'showTabBar',
  'hideTabBar',
  'setTopBarText',
  'startPullDownRefresh',
  'canvasToTempFilePath',
  'canvasGetImageData',
  'canvasPutImageData',

  'setBackgroundColor',
  'setBackgroundTextStyle',

  // 第三方平台
  'getExtConfig',

  // 开放接口
  'login',
  'checkSession',
  'authorize',
  'getUserInfo',
  'requestPayment',
  'showShareMenu',
  'hideShareMenu',
  'updateShareMenu',
  'getShareInfo',
  'chooseAddress',
  'addCard',
  'openCard',
  'openSetting',
  'getSetting',
  'getWeRunData',
  'navigateToMiniProgram',
  'navigateBackMiniProgram',
  'chooseInvoiceTitle',
  'checkIsSupportSoterAuthentication',
  'startSoterAuthentication',
  'checkIsSoterEnrolledInDevice'
  //
]

/**
 * Storage APIs
 */
export const STORAGE_APIS = [
  'clearStorage',
  'clearStorageSync',
  'getStorage',
  'getStorageSync',
  'removeStorageSync',
  'setStorage',
  'setStorageSync'
]

/**
 * 路由APIs
 */
export const ROUTE_APIS = ['navigateTo', 'redirectTo', 'switchTab', 'reLaunch']

/**
 * APP生命周期关键字
 */
export const APP_LIFECYCLES = [
  'onLaunch',
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound'
]
/**
 * 所有小程序页面生命周期方法
 */
export const PAGE_LIFETIMES = [
  'onLoad',
  'onShow',
  'onReady',
  'onHide',
  'onUnload',
  'onPullDownRefresh',
  'onReachBottom',
  'onShareAppMessage',
  'onPageScroll',
  'onResize',
  'onTabItemTap'
]

/**
 * 所有小程序组件声明周期方法
 */
export const COMPONENT_LIFETIMES = [
  'created',
  'attached',
  'ready',
  'moved',
  'detached',
  'definitionFilter'
]

/**
 * 其他保留方法
 */
export const OTHER_EXCLUDE_FNS = ['constructor']

/**
 * 所有保留方法
 */
export const COMPONENT_RESERVED_FNS = PAGE_LIFETIMES.concat(
  COMPONENT_LIFETIMES,
  OTHER_EXCLUDE_FNS
)

/**
 * 需迁移的保留关键字对象
 */
export const COMPONENT_RESERVED_OBJECT = ['pageLifetimes', 'relations', 'options']

/**
 * 需迁移的保留关键字数组或字符串
 */
export const COMPONENT_RESERVED_ARRAY_OR_STRING = ['behaviors', 'externalClasses']

/**
 * 需特殊处理的保留属性
 */
export const COMPONENT_RESERVED_SPECIAL_PROPS = [
  'data',
  'properties',
  'methods',
  'lifetimes',
  '$componentLifeTimes',
  '$pageLifeTimes',
  '$data',
  '$methods',
  '$properties'
]

/**
 * 所有保留特殊属性
 */
export const COMPONENT_RESERVED_PROPS = COMPONENT_RESERVED_OBJECT.concat(
  COMPONENT_RESERVED_ARRAY_OR_STRING,
  COMPONENT_RESERVED_SPECIAL_PROPS
)

/**
 * 业务框架: 因为历史原因保留cache方法
 */
export const CACHE_FNS_MAP = {
  'setCache': '_setSessionCache',
  'getCache': '_getSessionCache',
  'removeCache': '_removeSessionCache',
  'getAllCache': '_getAllSessionCaches',
  'getEStorage': 'getPeriodStorage',
  'setEStorage': 'setPeriodStorage',
  'removeEStorage': 'removePeriodStorage',
  'getAllCookie': 'getAllCookies'
}

export const ESTORAGE_KEY_PREFIX = '3keji.'