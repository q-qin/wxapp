import { Service } from '../../lib/core/index'

const getMainData = Service({
  url: 'http://www.3keji.com:4001/news/list',
  // method: 'post',  // 默认get
  // dataType: 'form-data', // 如果是post加dataType
  noLoading: false,
  cache: true,
  cacheTime: 60 * 1000, // 60秒
  retry: 3,
  retryTime: 2000
})

export default getMainData
