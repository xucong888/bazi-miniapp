App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    envId: 'cloud1-0gir7h0ic63bea19'
  },

  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: this.globalData.envId,
      traceUser: true
    })

    // 获取系统信息
    this.getSystemInfo()
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
      }
    })
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  }
})