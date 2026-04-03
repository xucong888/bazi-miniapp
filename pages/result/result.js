Page({
  data: {
    result: null,
    activeTab: 'bazi'
  },

  onLoad() {
    const result = wx.getStorageSync('currentResult')
    if (result) {
      this.setData({ result })
    } else {
      wx.showToast({ title: '暂无排盘结果', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  goToPayment() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  }
})