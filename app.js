App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    envId: 'cloud1-0gir7h0ic63bea19'
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用云能力，请升级到最新微信版本后重试。'
      })
      return
    }

    try {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      })
      console.log('云开发初始化成功')
    } catch (err) {
      console.error('云开发初始化失败:', err)
      wx.showModal({
        title: '云开发初始化失败',
        content: '请检查云开发环境是否开通，环境ID是否正确',
        showCancel: false
      })
    }

    // 获取系统信息
    this.getSystemInfo()
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('系统信息:', res)
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err)
      }
    })
  },

  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
    } catch (err) {
      console.error('读取用户信息失败:', err)
    }
  }
})