//app.js
var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')

App({
    onLaunch: function () {
      wx.login({ //微信登录
        success: function (res) { //登录成功后执行的的函数
          //发送 res.code 到后台换取 openId, sessionKey
          if (res.code) {
            console.log("res.code:", res.code)
            //发起网络请求
            wx.request({
              url: 'https://uatjwhyg.qcloud.la/weapp/message?js_code='+res.code+'',//这是固定的就是这个地址
              data: {
                js_code: res.code,
              },
              method: 'POST',
              header: {
                'content-type': 'application/json' // 默认值
              },
              success: function (res) {
                console.log(res)//openId
                console.log(res)//sessionKey
              },
              fail: function (res) {
                console.log('获取openId、sessionKey失败！' + res.errMsg)
              }
            })
          } else {
            console.log('获取用户登录态失败！' + res.errMsg)
          }
        }
      })

      qcloud.setLoginUrl(config.service.loginUrl)
    }
})