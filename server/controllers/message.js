const { message: { checkSignature } } = require('../qcloud')
var urlLib = require('url')
var https = require('https')
var http = require('http')
var qs   = require('querystring')
var iconv = require("iconv-lite")
var util  = require("util")
const request = require('request');
var xml2js = require('xml2js');

var openid = ''
var session_key = ''
var access_token = ''
var js_code = ''
/**
 * 响应 GET 请求（响应微信配置时的签名检查请求）
 */
async function get (ctx, next) {
    console.log("get ctx: ", ctx)
    const { signature, timestamp, nonce, echostr } = ctx.query
    if (checkSignature(signature, timestamp, nonce)) ctx.body = echostr
    else ctx.body = 'ERR_WHEN_CHECK_SIGNATURE'
}

async function post (ctx, next) {
    // 检查签名，确认是微信发出的请求
    //console.log("post ctx:", ctx)

    /////////////////////////////////////
    if (ctx.query.js_code) {
      js_code = ctx.query.js_code
      console.log("js_code：", js_code)
      url = 'https://api.weixin.qq.com/sns/jscode2session?appid=wx87ccff16470f4817&secret=06d30910bbcb3442f616ceb689297eb0&js_code='+js_code+'&grant_type=authorization_code'
      https.get(url, function (res) {
        var datas = [];
        var size = 0;
        res.on('data', function (data) {
          datas.push(data);
          size += data.length;
          //console.log(data)
        })
        res.on("end", function () {
        var buff = Buffer.concat(datas, size);
        //var result = iconv.decode(buff, "utf8");//转码
        var result = buff.toString();//不需要转编码,直接tostring  
        result = JSON.parse(result)
        console.log('result: ', result)
        console.log('session_key: ', result['session_key'])
        session_key = result['session_key']
        console.log('openid: ', result['openid'])
        openid = result['openid']
        })
      }).on("error", function (err) {
        console.log(err.stack)
        callback.apply(null)
      })

      //request access_token
      url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx87ccff16470f4817&secret=06d30910bbcb3442f616ceb689297eb0'
      https.get(url, function (res) {
        var datas = [];
        var size = 0;
        res.on('data', function (data) {
          datas.push(data);
          size += data.length;
          //console.log(data)
        })
        res.on("end", function () {
          var buff = Buffer.concat(datas, size);
          //var result = iconv.decode(buff, "utf8");//转码
          var result = buff.toString();//不需要转编码,直接tostring  
          result = JSON.parse(result)
          console.log('result: ', result)
          console.log('access_token: ', result['access_token'])
          access_token = result['access_token']
        })
      }).on("error", function (err) {
        console.log(err.stack)
        callback.apply(null)
      })
      return
    }

    //send template
    if (ctx.query.form_id) {
      const form_id = ctx.query.form_id
      const value   = ctx.query.value
      console.log("send form_id: ", form_id)
      console.log("send access_token:", access_token)
      console.log("send openid:", openid)

      var data = {
        "keyword1": {
          "value": "123456789",
          "color": "#173177"
        },
        "keyword2": {
          "value": "We创者",
          "color": "#173177"
        },
        "keyword3": {
          "value": "微信小程序微商城",
          "color": "#173177"
        },
        "keyword4": {
          "value": "10086",
          "color": "#173177"
        }
      }

      var contents = new Buffer(JSON.stringify({
        "touser": openid,
        "template_id": "31O8PHWNmsknkUtbwxMlDrq0W3lRIuyOybKj4Suwlfk",
        "form_id": form_id,
        "data": data,
        "emphasis_keyword": "keyword1.DATA"
      }))

      var options = {
        host: 'api.weixin.qq.com',
        path: '/cgi-bin/message/wxopen/template/send?access_token='+access_token,
        method: 'POST',
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': contents.length
        }
      }
      console.log("data: ", data)
      console.log("contents", contents)
      console.log("options", options)

      var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        console.log("statuscode: ", res.statusCode)
        res.on('data', function (data) {
          console.log('data:', data);
        })
      })

      
      req.write(contents);
      req.end();
      console.log("success")

      return
    }

    ///////////////////////
    

    /**
     * 解析微信发送过来的请求体
     * 可查看微信文档：https://mp.weixin.qq.com/debug/wxadoc/dev/api/custommsg/receive.html#接收消息和事件
     */
    console.log("kefu:", ctx);
    var body = 'success';
    ctx.body = body;
    

    var contents = new Buffer(JSON.stringify({
      "touser": openid,
      "msgtype": "text",
      "text":
      {
        "content": "We创者欢迎您....<a href=\"http://www.qq.com\" data-miniprogram-appid=\"wx87ccff16470f4817\" data-miniprogram-path=\"pages/index/index\">点击跳小程序</a>"
      }
    }))

    var options = {
      host: 'api.weixin.qq.com',
      path: '/cgi-bin/message/custom/send?access_token=' + access_token,
      method: 'POST',
      port: 443,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': contents.length
      }
    }

    console.log("contents", contents)
    console.log("options", options)

    var req = https.request(options, function (res) {
      res.setEncoding('utf8');
      console.log("statuscode: ", res.statusCode)
      res.on('data', function (data) {
        console.log('data:', data);
      })
    })


    req.write(contents);
    req.end();

    /*
    if (ctx.query.signature) {
      const { signature, timestamp, nonce } = ctx.query;
      body = checkSignature(signature, timestamp, nonce) ? 'success' : 'ERR_WHEN_CHECK_SIGNATURE';
      //data.FromUserName = openid

      var text = {
        "content": "Hello World"
      }

      var contents = JSON.stringify({
        "touser": openid,
        "msgtype": "text",
        "text": text
      })

      var options = {
        host: 'api.weixin.qq.com',
        path: 'cgi-bin/message/custom/send?access_token=' + access_token,
        method: 'POST',
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': contents.length
        }
      }
      console.log("contents", contents)
      console.log("options", options)

      var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        console.log("statuscode: ", res.statusCode)
        res.on('data', function (data) {
          console.log('data:', data);
        })
      })


      req.write(contents);
      req.end();
    } else {
      var data = JSON.parse(ctx.request.body.data);
      console.log('data: ', data)
      switch (data.MsgType) {
        case 'text': {//用户在客服会话中发送文本消息
          await sendTextMessage("我知道了", data, access_token);
          break;
        }
        case 'image': { //用户在客服会话中发送图片消息
          await sendImageMessage(data.MediaId, data, access_token);
          break;
        }
        case 'event': {
          console.log('event');
          var content = '';
          if (data.Event == 'user_enter_tempsession') {  //用户在小程序“客服会话按钮”进入客服会话,在聊天框进入不会有此事件
            await sendTextMessage("您有什么问题吗?", data, access_token);
          } else if (data.Event == 'kf_create_session') { //网页客服进入回话
            console.log('网页客服进入回话');
          }
          break;
        }
      }
    }
    */
    console.log('end');
    //ctx.body = body;
}

async function sendTextMessage(content, FromUserName, access_token) {
  await request.postJson({
    url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token,
    body: {
      touser: FromUserName,
      msgtype: "text",
      text:
      {
        content: content
      }
    },
    success: function (res) {
      console.log(res);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

async function sendImageMessage(media_id, data, access_token) {
  await request.postJson({
    url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token,
    body: {
      touser: data.FromUserName,
      msgtype: "image",
      image:
      {
        media_id: media_id
      }
    },
    success: function (res) {
      console.log(res);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

module.exports = {
    post,
    get
}
