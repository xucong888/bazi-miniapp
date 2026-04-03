Page({
  data: {
    packages: [
      { id: 'starter', name: '体验包', points: 100, price: 10, desc: '适合初次体验' },
      { id: 'basic', name: '基础包', points: 300, price: 25, desc: '可深度解读3次' },
      { id: 'standard', name: '标准包', points: 600, price: 45, desc: '赠送1次深度解读' },
      { id: 'premium', name: '尊享包', points: 1500, price: 100, desc: '赠送3次深度解读' }
    ]
  },

  selectPackage(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认支付',
      content: '即将调起微信支付',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(id)
        }
      }
    })
  },

  processPayment(packageId) {
    // 这里需要接入微信支付
    wx.showToast({ title: '支付功能开发中', icon: 'none' })
  }
})