Page({
  data: {
    userInfo: null,
    points: 0,
    history: []
  },

  onLoad() {
    this.loadUserInfo()
    this.loadPoints()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  loadPoints() {
    // 从云数据库加载积分
    this.setData({ points: 100 }) // 默认赠送100积分
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
      }
    })
  },

  goToPayment() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  }
})