// pages/puzzle/index.js
const WIDTH  = 300
const HEIGHT = 200

const NUMBER = 2

let pos_array = new Array()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imageSrc: 'ba.png',
    x: 0,
    y: 0,
    b_x: 0,
    b_y: 0,
    hidden: true,
    move_flag: 0,
    color_array: ['red', 'white', 'blue', 'black'],
    white_pos: 1,
    index:0
  },

  get_index: function (e) {
    for (var i = 0; i < NUMBER*NUMBER; i++){
      if (e.touches[0].x > pos_array[i].x && e.touches[0].x < (pos_array[i].x + WIDTH / NUMBER) && e.touches[0].y > pos_array[i].y && e.touches[0].y < (pos_array[i].y+HEIGHT/NUMBER)) {
        return i;
      }
    }
  },
  
  draw_line: function (context) {
    context.moveTo(0, 100)
    context.lineTo(300, 100)
    context.stroke()
    context.moveTo(150, 0)
    context.lineTo(150, 200)
    context.stroke()
    context.draw()
  },

  start: function (e) {
    this.setData({
      hidden: false,
      x: e.touches[0].x,
      b_x: e.touches[0].x,
      y: e.touches[0].y,
      b_y: e.touches[0].y
    })

    //如果是跟空白块挨着就可以往空白块移动 1 右 2 左 3 下 4 上
    let index = this.get_index(e)
    console.log("index: ", index)
    if (index + 1 == this.data.white_pos && this.data.white_pos % NUMBER != 0) {
      this.setData({move_flag:1})
    }
    else if (index - 1 == this.data.white_pos && this.data.white_pos % NUMBER != NUMBER -1) {
      this.setData({move_flag:2})
    }
    else if (index + 2 == this.data.white_pos) {
      this.setData({move_flag:3})
    }
    else if (index - 2 == this.data.white_pos) {
      this.setData({move_flag:4})
    }
    else {
      this.setData({move_flag:0})
    }

    this.setData({index:index})
  },
  move: function (e) {
    this.setData({
      x: e.touches[0].x,
      y: e.touches[0].y
    })
    console.log("move_flag: ", this.data.move_flag)
    if (0 == this.data.move_flag) {
      console.log("don't move: ", this.data.b_x, e.touches[0].x)
      return
    }

    var context = wx.createCanvasContext('firstCanvas')
    if (1 == this.data.move_flag || 2 == this.data.move_flag) {
      console.log("moveing", this.data.index, this.data.color_array[this.data.index], this.data.color_array[1])
      
      context.setFillStyle('white')
      context.fillRect(pos_array[this.data.index].x, pos_array[this.data.index].y, e.touches[0].x, HEIGHT/NUMBER)
      context.setFillStyle(this.data.color_array[this.data.index])
      context.fillRect(e.touches[0].x, pos_array[this.data.index].y, WIDTH/NUMBER, HEIGHT/NUMBER)
      context.setFillStyle('white')
      context.fillRect(e.touches[0].x + WIDTH / NUMBER, pos_array[this.data.index].y, WIDTH/NUMBER - e.touches[0].x, HEIGHT/NUMBER)

      
    }
    else if (3 == this.data.move_flag || 4 == this.data.move_flag) {
      console.log("moveing", this.data.index, this.data.color_array[this.data.index - 2], this.data.color_array[this.data.index])
      context.setFillStyle('white')
      context.fillRect(pos_array[this.data.index].x, e.touches[0].y, WIDTH/NUMBER, HEIGHT/NUMBER)
      context.setFillStyle(this.data.color_array[this.data.index])
      context.fillRect(pos_array[this.data.index].x, e.touches[0].y, WIDTH/NUMBER, HEIGHT/NUMBER)
      context.setFillStyle('white')
      context.fillRect(pos_array[this.data.index].x, e.touches[0].y + HEIGHT/NUMBER, WIDTH/NUMBER, HEIGHT/NUMBER - e.touches[0].y)
    }
    
    for (var i = 0; i < NUMBER * NUMBER; i++) {
      if (i != this.data.index && i != this.data.white_pos) {
        context.setFillStyle(this.data.color_array[i])
        context.fillRect(pos_array[i].x, pos_array[i].y, WIDTH / NUMBER, HEIGHT / NUMBER)
      }
    }
    this.draw_line(context)
  },

  end: function (e) {
    this.setData({
      hidden: true
    })
    if (0 == this.data.move_flag) {
      return
    }
    var context = wx.createCanvasContext('firstCanvas')
    console.log('x: ', this.data.x)
    console.log('b_x: ', this.data.b_x)

    context.setFillStyle(this.data.color_array[this.data.index])
    context.fillRect(pos_array[this.data.white_pos].x, pos_array[this.data.white_pos].y, WIDTH/NUMBER, HEIGHT/NUMBER)
    context.setFillStyle(this.data.color_array[this.data.white_pos])
    context.fillRect(pos_array[this.data.index].x, pos_array[this.data.index].y, WIDTH/NUMBER, HEIGHT/NUMBER)
   
    
    console.log("end", this.data.white_pos, this.data.color_array[this.data.white_pos], this.data.color_array[this.data.index])
    var color_item = 'color_array[' + this.data.white_pos + ']'
    this.setData({ [color_item]: this.data.color_array[this.data.index] })
    var color_item = 'color_array[' + this.data.index + ']'
    this.setData({ [color_item]: 'white' })
    this.setData({ white_pos: this.data.index })
    console.log("end", this.data.white_pos, this.data.color_array[this.data.white_pos], this.data.color_array[this.data.index])

    for (var i = 0; i < NUMBER * NUMBER; i++) {
      if (i != this.data.index && i != this.data.white_pos) {
        context.setFillStyle(this.data.color_array[i])
        context.fillRect(pos_array[i].x, pos_array[i].y, WIDTH / NUMBER, HEIGHT / NUMBER)
      }
    }
    this.draw_line(context)

  },

  chooseImage: function () {
    var self = this
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: function (res) {
        console.log('chooseImage success, temp path is', res.tempFilePaths[0])

        var imageSrc = res.tempFilePaths[0]
        

        wx.uploadFile({
          url: uploadFileUrl,
          filePath: imageSrc,
          name: 'data',
          success: function (res) {
            console.log('uploadImage success, res is:', res)

            wx.showToast({
              title: '上传成功',
              icon: 'success',
              duration: 1000
            })

            self.setData({
              imageSrc
            })
          },
          fail: function ({ errMsg }) {
            console.log('uploadImage fail, errMsg is', errMsg)
          }
        })

      },
      fail: function ({ errMsg }) {
        console.log('chooseImage fail, err is', errMsg)
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var context = wx.createCanvasContext('firstCanvas')

    for(var i = 0; i < NUMBER*NUMBER; i++) {
      pos_array[i] = { x: (i % NUMBER) * (WIDTH / NUMBER), y: parseInt(i / NUMBER) * (HEIGHT / NUMBER) }
      console.log("onLoad:", pos_array[i].x, pos_array[i].y)
      context.setFillStyle(this.data.color_array[i])
      context.fillRect(pos_array[i].x, pos_array[i].y, (WIDTH / NUMBER), (HEIGHT / NUMBER))
    }

    context.moveTo(0, 100)
    context.lineTo(300, 100)
    context.stroke()
    context.moveTo(150, 0)
    context.lineTo(150, 200)
    context.stroke()
    context.draw()

    var context2 = wx.createCanvasContext("secondCanvas")
    context2.drawImage('ba.png', 0, 0, 300, 200)
    context2.moveTo(0, 100)
    context2.lineTo(300, 100)
    context2.stroke()
    context2.moveTo(150, 0)
    context2.lineTo(150, 200)
    context2.stroke()
    context2.draw()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})