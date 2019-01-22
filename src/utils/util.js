const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 随机整数方法
const rnd = (n = 0, m = 1) => {
  const random = Math.floor(Math.random() * (m - n + 1) + n)
  return random
};

const getRand = (e=0) => {
  return e <= 0 ? 0 : e < 5 ? new Number((100 * e / 650).toFixed(1)) + 10 : e >= 5 && e < 10 ? new Number((100 * e / 650).toFixed(1)) + 30 : e >= 10 && e < 20 ? new Number((100 * e / 650).toFixed(1)) + 50 : e >= 20 && e <= 25 ? new Number((100 * e / 650).toFixed(1)) + 60 : e > 25 && e <= 30 ? new Number((100 * e / 650).toFixed(1)) + 70 : e > 30 && e < 35 ? new Number((100 * e / 650).toFixed(1)) + 80 : e >= 35 && e < 40 ? new Number((100 * e / 650).toFixed(1)) + 85 : e >= 40 && e < 65 ? new Number((100 * e / 650).toFixed(1)) + 90 : e >= 65 ? 99.9 : void 0;
}

module.exports = {
  formatTime: formatTime,
  rnd: rnd,
  getRand: getRand
}