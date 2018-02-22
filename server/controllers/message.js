const { message: { checkSignature } } = require('../qcloud')
var urlLib = require('url')
var https = require('https')
var http = require('http')
var qs   = require('querystring')
var iconv = require("iconv-lite")
var util  = require("util")
const request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');

var openid = ''
var session_key = ''
var access_token = ''
var js_code = ''
var thumb_media_id = ''

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
    console.log("post ctx:", ctx)
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

      //post image 
      //post_image(access_token)
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

    
    var body = 'success';
    ctx.body = body;
    
    //test code 
    {
      let data = ctx.request.body
      console.log("query: ", ctx.query)
      console.log("kefu: ", data);
      let buf = '';
      let json_context = ''
      console.log('FromUserName:', data['FromUserName'])
      console.log('MsgType:', data['MsgType'])
      console.log("data['Content']:", data['Content'])
	  
	  if (data['MsgType'] == 'Event'){
        return
      }
	  
      var contents = new Buffer(JSON.stringify({
        "touser": openid,
        "msgtype": "text",
        "text": {
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
      // 获取XML内容
      ctx.setEncoding('utf8');
      ctx.on('data', function (chunk) {
        buf += chunk;
      });
      // 内容接收完毕
      ctx.on('end', function () {
        console.log('buf: ', buf)
        xml2js.parseString(buf, function (err, json) {
          if (err) {
            err.status = 400;
            console.log('err')
          } else {
            json_context = json
            console.log("json: ", json)
            ctx.body = json;
          }
        })
        console.log("ctx.body.xml: ", ctx.body.xml)
        let data = ctx.body.xml;
        var msg = {
          "toUserName": data.FromUserName[0],
          "fromUserName": data.ToUserName[0],
          "createTime": data.CreateTime[0],
          "msgType": data.MsgType[0],
          "content": data.Content[0],
          "msgId": data.MsgId[0]
        };
        console.log("msg: ", msg)
        //api_request(msg)
        //echo
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
      })
      */
    } 
      //test code

    console.log('end');
    //ctx.body = body;
}

async function post_image(accessToken) {
  var boundaryKey = Math.random().toString(16); 
  var options = {
    host: 'api.weixin.qq.com',
    port: 443,
    path: 'cgi-bin/media/upload?access_token=' + accessToken + 'type=image',
    method: 'POST'
  };


  var reqHttps = https.request(options, function (resHttps) {
    console.log("statusCode: ", resHttps.statusCode);
    console.log("headers: ", resHttps.headers);

    resHttps.on('data', function (body1) {
      console.log("body:" + body1);
    });
  });

  var payload = '--' + boundaryKey + '\r\n' + 'Content-Type: image/jpeg\r\n'
    + 'Content-Disposition: form-data; name="media"; filename="gh_efc977173922_258.jpg"\r\n'
    + 'Content-Disposition: form-data; name="media"; filename="gh_efc977173922_258.jpg"\r\n'

  var enddata = '\r\n--' + boundaryKey + '--';

  reqHttps.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundaryKey + '');
  reqHttps.setHeader('Content-Length', Buffer.byteLength(payload) + Buffer.byteLength(enddata)); //+ req.files.media.size
  reqHttps.write(payload);

  var fileStream = fs.createReadStream("../images/gh_efc977173922_258.jpg", { bufferSize: 4 * 1024 });
  fileStream.pipe(reqHttps, { end: false });
  fileStream.on('end', function () {
    // mark the end of the one and only part
    reqHttps.end(enddata);

  });

  reqHttps.on('error', function (e) {
    console.error("error:" + e);
  });
}

async function api_request(data) {
  var msg = {
    "key": '463926bab2e040c89cb345dad8c0c96c',   // 可以填入自己申请的机器人的apiKey            
    "info": data.content,
    "userid": ~~(Math.random() * 99999)
  };
  var text = qs.stringify(msg);
  var options = {
    hostname: 'www.tuling123.com',
    path: '/openapi/api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  };
  var requestObj = http.request(options, function (response) {
    var result = '';
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      result += chunk;
    });
    response.on('end', function () {
      try {
        var obj = JSON.parse(result);
      }
      catch (e) {
        data.content = e.message;
        echo(data, res);
        return;
      }
      data.content = obj.text;
      echo(data, response);
    })
  });
  requestObj.on('error', function (e) {
    console.log('problem with request: ' + e.message);
    data.content = e.message;
    echo(data, res);
  });
  requestObj.write(text);
  requestObj.end();
}

async function echo(data, res) {
  var time = Math.round(new Date().getTime() / 1000);
  var output = "" +
    "<xml>" +
    "<ToUserName><![CDATA[" + data.toUserName + "]]></ToUserName>" +
    "<FromUserName><![CDATA[" + data.fromUserName + "]]></FromUserName>" +
    "<CreateTime>" + time + "</CreateTime>" +
    "<MsgType><![CDATA[" + data.msgType + "]]></MsgType>" +
    "<Content><![CDATA[" + data.content + "]]></Content>" +
    "</xml>";
  res.type('xml');
  res.send(output);
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
