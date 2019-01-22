/**
 * api.js 接口文件
 * http 加密数据
 * https apple  域名和小程序ghid，appid
 */
import { getRequest, postRequest, hallGet } from 'http.js'
// import { https, apple } from '../config/config.js'
const apple = {};
const https = {};

/**
 * @name 获取openId
 * @param ghId,data{code}
 * @result {data:{openId}}
 */
export const getOpenId = (body) => getRequest(`${https.javaHttps}/login/getOpenId`, body)
/**
 * @name 获取config
 * @param ghId
 * @result {data:{config}}
 */
export const getConfig = () => getRequest(`${https.javaHttps}/other/config`)
/**
 * @name formid接口
 * @param ghId,openId,data{formid,time}
 * @result {data:{openId}}
 */
export const getFormid = (body) => getRequest(`${https.javaHttps}/msg/formid`, body)