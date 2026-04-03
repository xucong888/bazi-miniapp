Page({
  data: {
    result: null,
    selectedSystems: ['bazi', 'ziwei'],
    activeTab: 'bazi',
    loading: false
  },

  onLoad() {
    const result = wx.getStorageSync('currentResult')
    const selectedSystems = wx.getStorageSync('selectedSystems') || ['bazi', 'ziwei']
    
    if (result) {
      // 设置默认激活的标签
      let activeTab = 'bazi'
      if (!selectedSystems.includes('bazi') && selectedSystems.includes('ziwei')) {
        activeTab = 'ziwei'
      } else if (!selectedSystems.includes('bazi') && !selectedSystems.includes('ziwei') && selectedSystems.includes('western')) {
        activeTab = 'western'
      } else if (selectedSystems.includes('mbti')) {
        activeTab = 'mbti'
      }
      
      this.setData({ 
        result,
        selectedSystems,
        activeTab
      })
    } else {
      wx.showToast({ title: '暂无测算结果', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 切换标签
  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // 去支付页面
  goToPayment() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  },

  // 重新测算
  recalculate() {
    wx.navigateBack()
  }
})