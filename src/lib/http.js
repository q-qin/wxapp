// import { apple } from '../config/config.js'
const apple = {};
const CryptoJS = require('../common/aes.js');  //引用AES源码js
const key = CryptoJS.enc.Utf8.parse('1234567890master');//秘钥
const iv = CryptoJS.enc.Utf8.parse('1234567890master');//秘钥偏移量

// AES解密方法
export const Decrypt = (word) => {
  var decrypt = CryptoJS.AES.decrypt(word, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
  return decryptedStr.toString();
}
// AES加密方法
export const Encrypt = (plaintText) => {
  var encryptedData = CryptoJS.AES.encrypt(plaintText, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  var encryptedBase64Str = encryptedData.toString();
  return encryptedBase64Str
}


export const getRequest = (url, body = {}) => {
  const app = getApp()
  let thisdata = {}
  // 需要加密数据
  thisdata = {
    data: Encrypt(JSON.stringify({
      openId: app.openId || wx.getStorageSync('openId') || '',
      ghId: apple.ghid,
      data: body
    }))
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: thisdata,
      method: 'GET',
      success(res) {
        if (res.data.code == 200 && res.data.data) {
          let response = Decrypt(res.data.data)
          resolve(JSON.parse(response))
        } else {
          reject(res)
        }
      },
      fail(res) {
        reject(res)
      }
    })
  })
}

export const postRequest = (url, body = {}) => {
  const app = getApp()
  let thisdata = {}
  // 需要加密数据
  thisdata = {
    data: Encrypt(JSON.stringify({
      openId: app.openId || wx.getStorageSync('openId') || '',
      ghId: apple.ghid,
      data: body
    }))
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: thisdata,
      method: 'POST',
      success(res) {
        if (res.data.code == 200 && res.data.data) {
          let response = Decrypt(res.data.data)
        }
        resolve(JSON.parse(response))
      },
      fail(res) {
        reject(res)
      }
    })
  })
}